import { SmartAPI } from 'smartapi-javascript';
import dotenv from 'dotenv';
import crypto from 'crypto';
import type { MarketHierarchy, StockData } from '../lib/market-service';

dotenv.config();

interface AngelSessionResponse {
    status?: boolean;
    message?: string;
    data?: {
        jwtToken?: string;
        refreshToken?: string;
        feedToken?: string;
    };
}

interface AngelLtpResponse {
    status?: boolean;
    data?: {
        ltp?: number;
        close?: number;
    };
}

interface AngelInstrument {
    token: string;
    symbol: string;
    exch_seg: string;
}

interface LtpPoint {
    price: number;
    changePercent: number;
}

export class AngelOneService {
    private smartApi: SmartAPI;
    private feedToken: string | null = null;
    private jwtToken: string | null = null;
    private refreshToken: string | null = null;
    private readonly clientCode: string;
    private readonly instrumentMap: Record<string, string> = {
        'NIFTY': '99926000', // Nifty 50
        'SENSEX': '99919000', // Sensex
        'BANKNIFTY': '99926009' // Nifty Bank
    };
    private readonly heatmapSectorSymbols: Record<string, string[]> = {
        'Financials': ['HDFCBANK', 'ICICIBANK', 'SBIN', 'KOTAKBANK', 'AXISBANK'],
        'Technology': ['TCS', 'INFY', 'HCLTECH', 'WIPRO', 'TECHM'],
        'Energy': ['RELIANCE', 'ONGC', 'POWERGRID', 'NTPC', 'TATAPOWER'],
        'Consumer': ['ITC', 'HINDUNILVR', 'NESTLEIND', 'BRITANNIA', 'TITAN'],
        'Automobile': ['TATAMOTORS', 'M&M', 'MARUTI', 'BAJAJ-AUTO', 'EICHERMOT']
    };

    private instrumentTokenMap = new Map<string, string>();
    private instrumentMapLoadedAt = 0;
    private readonly instrumentMapTtlMs = 60 * 60 * 1000;

    private loginPromise: Promise<boolean> | null = null;
    private loginCooldownUntil = 0;
    private readonly loginCooldownMs = 30_000;
    private warnedMissingConfig = false;

    // Market hours utility functions
    private isNSEMarketOpen(): boolean {
        const now = new Date();
        const istTime = new Date(now.getTime() + (330 * 60 * 1000)); // IST offset
        const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
        const hours = istTime.getHours();
        const minutes = istTime.getMinutes();
        const timeInMinutes = hours * 60 + minutes;
        
        // Check if it's a weekday (Monday = 1, Friday = 5)
        if (day === 0 || day === 6) {
            return false; // Weekend
        }
        
        // NSE trading hours: 9:15 AM to 3:30 PM IST
        const marketOpen = 9 * 60 + 15;  // 9:15 AM
        const marketClose = 15 * 60 + 30; // 3:30 PM
        
        return timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
    }

    private getNSEMarketStatus(): { isOpen: boolean; message: string } {
        const isOpen = this.isNSEMarketOpen();
        if (isOpen) {
            return { isOpen: true, message: 'NSE Market Open' };
        } else {
            const now = new Date();
            const istTime = new Date(now.getTime() + (330 * 60 * 1000));
            const day = istTime.getDay();
            
            if (day === 0 || day === 6) {
                return { isOpen: false, message: 'NSE Market Closed - Weekend' };
            } else {
                return { isOpen: false, message: 'NSE Market Closed - After Hours' };
            }
        }
    }

    constructor() {
        this.smartApi = new SmartAPI({
            api_key: process.env.ANGEL_API_KEY || ''
        });

        this.clientCode = process.env.ANGEL_CLIENT_CODE || '';
    }

    private isPlaceholder(value: string | undefined): boolean {
        if (!value) return true;
        const normalized = value.trim().toUpperCase();
        return (
            normalized.length === 0
            || normalized.includes('YOUR_')
            || normalized.includes('PLACEHOLDER')
            || normalized === 'NA'
            || normalized === 'N/A'
        );
    }

    public isConfigured(): boolean {
        return !this.isPlaceholder(process.env.ANGEL_API_KEY)
            && !this.isPlaceholder(process.env.ANGEL_CLIENT_CODE)
            && !this.isPlaceholder(process.env.ANGEL_PASSWORD)
            && !this.isPlaceholder(process.env.ANGEL_TOTP_KEY);
    }

    private decodeBase32(secret: string): Buffer | null {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        const normalized = secret.toUpperCase().replace(/=+$/g, '').replace(/\s+/g, '');

        if (!normalized || /[^A-Z2-7]/.test(normalized)) {
            return null;
        }

        let bits = '';
        for (const ch of normalized) {
            const val = alphabet.indexOf(ch);
            if (val < 0) return null;
            bits += val.toString(2).padStart(5, '0');
        }

        const bytes: number[] = [];
        for (let i = 0; i + 8 <= bits.length; i += 8) {
            bytes.push(parseInt(bits.slice(i, i + 8), 2));
        }

        return Buffer.from(bytes);
    }

    private generateTotpFromBase32(secret: string, stepSeconds = 30, digits = 6): string | null {
        const key = this.decodeBase32(secret);
        if (!key) return null;

        const counter = Math.floor(Date.now() / 1000 / stepSeconds);
        const counterBuffer = Buffer.alloc(8);
        counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
        counterBuffer.writeUInt32BE(counter % 0x100000000, 4);

        const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();
        const offset = hmac[hmac.length - 1] & 0x0f;

        const code = ((hmac[offset] & 0x7f) << 24)
            | ((hmac[offset + 1] & 0xff) << 16)
            | ((hmac[offset + 2] & 0xff) << 8)
            | (hmac[offset + 3] & 0xff);

        const otp = (code % (10 ** digits)).toString().padStart(digits, '0');
        return otp;
    }

    private normalizeSymbol(symbol: string): string {
        return symbol.toUpperCase().replace(/\.(NS|BO)$/i, '');
    }

    private computeChangePercent(ltp: number, close?: number): number {
        if (!close || close <= 0) return 0;
        return ((ltp - close) / close) * 100;
    }

    private async loadInstrumentMapIfNeeded(force = false): Promise<void> {
        const now = Date.now();
        if (!force && this.instrumentTokenMap.size > 0 && now - this.instrumentMapLoadedAt < this.instrumentMapTtlMs) {
            return;
        }

        try {
            const res = await fetch('https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json');
            if (!res.ok) {
                throw new Error(`Instrument master fetch failed: ${res.status}`);
            }

            const instruments = (await res.json()) as AngelInstrument[];
            const nextMap = new Map<string, string>();

            for (const item of instruments) {
                if (!item || item.exch_seg !== 'NSE' || !item.symbol || !item.token) continue;
                if (!item.symbol.endsWith('-EQ')) continue;

                const base = item.symbol.replace(/-EQ$/i, '').toUpperCase();
                nextMap.set(base, item.token);
            }

            this.instrumentTokenMap = nextMap;
            this.instrumentMapLoadedAt = Date.now();
            console.log(`Angel instrument token map loaded: ${this.instrumentTokenMap.size} NSE symbols`);
        } catch (e) {
            console.error('Failed to load Angel instrument map:', e);
        }
    }

    private async ensureLoggedIn(): Promise<boolean> {
        if (this.jwtToken) return true;
        if (Date.now() < this.loginCooldownUntil) {
            return false;
        }
        if (this.loginPromise) return this.loginPromise;

        this.loginPromise = this.login();
        try {
            return await this.loginPromise;
        } finally {
            this.loginPromise = null;
        }
    }

    async login(): Promise<boolean> {
        try {
            console.log('Logging in to Angel One SmartAPI...');

            // Validate environment variables
            if (!this.isConfigured()) {
                if (!this.warnedMissingConfig) {
                    console.warn('Angel credentials are missing/placeholder. Skipping Angel login and using fallback market feeds.');
                    this.warnedMissingConfig = true;
                }
                this.loginCooldownUntil = Date.now() + (10 * 60 * 1000);
                return false;
            }

            const totpKey = process.env.ANGEL_TOTP_KEY;
            if (!totpKey) {
                console.error('ANGEL_TOTP_KEY is not set. Please set your TOTP secret in .env');
                this.loginCooldownUntil = Date.now() + this.loginCooldownMs;
                return false;
            }
            
            const rawTotp = totpKey.replace(/\s+/g, '');
            if (!rawTotp) {
                console.error('ANGEL_TOTP_KEY is empty. Please set your TOTP secret in .env');
                this.loginCooldownUntil = Date.now() + this.loginCooldownMs;
                return false;
            }

            let otp: string;
            if (/^\d{6}$/.test(rawTotp)) {
                // Supports temporarily passing a current TOTP code directly.
                otp = rawTotp;
            } else {
                const secret = rawTotp.toUpperCase();
                if (!/^[A-Z2-7]+=*$/.test(secret)) {
                    console.error('ANGEL_TOTP_KEY must be a base32 secret (A-Z, 2-7) or a current 6-digit OTP code.');
                    this.loginCooldownUntil = Date.now() + this.loginCooldownMs;
                    return false;
                }

                const generatedOtp = this.generateTotpFromBase32(secret);
                if (!generatedOtp) {
                    console.error('Failed to generate TOTP from ANGEL_TOTP_KEY. Verify it is a valid base32 secret.');
                    this.loginCooldownUntil = Date.now() + this.loginCooldownMs;
                    return false;
                }

                otp = generatedOtp;
            }

            if (!otp) {
                console.error('Failed to generate TOTP from ANGEL_TOTP_KEY. Verify it is a valid base32 secret.');
                this.loginCooldownUntil = Date.now() + this.loginCooldownMs;
                return false;
            }

            const clientCode = process.env.ANGEL_CLIENT_CODE;
            const password = process.env.ANGEL_PASSWORD;
            
            if (!clientCode || !password) {
                console.error('ANGEL_CLIENT_CODE or ANGEL_PASSWORD not set in .env');
                this.loginCooldownUntil = Date.now() + this.loginCooldownMs;
                return false;
            }

            const data = await this.smartApi.generateSession(
                clientCode,
                password,
                otp
            ) as AngelSessionResponse;

            if (data.status && data.data?.jwtToken && data.data?.feedToken && data.data?.refreshToken) {
                this.jwtToken = data.data.jwtToken;
                this.feedToken = data.data.feedToken;
                this.refreshToken = data.data.refreshToken;
                this.loginCooldownUntil = 0;
                console.log('Angel One Login Successful');
                await this.loadInstrumentMapIfNeeded(true);
                return true;
            } else {
                const failureMessage = data.message || 'Unknown error';
                console.error('Angel One Login Failed:', failureMessage);
                const looksLikeTotpIssue = /totp|otp/i.test(failureMessage);
                this.loginCooldownUntil = Date.now() + (looksLikeTotpIssue ? 10 * 60 * 1000 : this.loginCooldownMs);
                return false;
            }
        } catch (error) {
            console.error('Angel One Login Error:', error);
            this.loginCooldownUntil = Date.now() + this.loginCooldownMs;
            return false;
        }
    }

    async getMarketData(symbol: string): Promise<number | null> {
        const success = await this.ensureLoggedIn();
        if (!success) return null;

        try {
            let exchange = 'NSE';
            let token = '';

            if (symbol === 'NIFTY') {
                token = this.instrumentMap.NIFTY;
            } else if (symbol === 'SENSEX') {
                exchange = 'BSE';
                token = this.instrumentMap.SENSEX;
            } else if (symbol === 'BANKNIFTY') {
                token = this.instrumentMap.BANKNIFTY;
            } else {
                return null;
            }

            // Fetch LTP (Last Traded Price)
            const ltpData = await this.smartApi.getLTP({
                exchange: exchange,
                tradingsymbol: symbol,
                symboltoken: token
            }) as AngelLtpResponse;

            if (ltpData.status && ltpData.data?.ltp) {
                return ltpData.data.ltp;
            }

            return null;
        } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error);
            return null;
        }
    }

    async getStockLtp(symbol: string): Promise<LtpPoint | null> {
        // Check market hours first
        const marketStatus = this.getNSEMarketStatus();
        if (!marketStatus.isOpen) {
            console.log(`📅 ${marketStatus.message} - Using last closing price for ${symbol}`);
            // Return null to force fallback to Yahoo Finance which has last closing prices
            return null;
        }

        const success = await this.ensureLoggedIn();
        if (!success) {
            console.warn(`⚠️ AngelOne login failed for ${symbol} - using fallback`);
            return null;
        }

        await this.loadInstrumentMapIfNeeded();

        const base = this.normalizeSymbol(symbol);
        const token = this.instrumentTokenMap.get(base);
        if (!token) {
            console.warn(`⚠️ No instrument token found for ${symbol} - using fallback`);
            return null;
        }

        try {
            const ltpData = await this.smartApi.getLTP({
                exchange: 'NSE',
                tradingsymbol: `${base}-EQ`,
                symboltoken: token
            }) as AngelLtpResponse;

            if (!ltpData.status || !ltpData.data?.ltp) {
                console.warn(`⚠️ AngelOne API returned no data for ${symbol} - using fallback`);
                return null;
            }

            const price = ltpData.data.ltp;
            const changePercent = this.computeChangePercent(price, ltpData.data.close);
            
            console.log(`✅ AngelOne LIVE: ${symbol} = ₹${price} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);
            return { price, changePercent };
        } catch (e) {
            console.warn(`⚠️ AngelOne LTP fetch failed for ${base}:`, e);
            return null;
        }
    }

    async getBatchStockLtp(symbols: string[]): Promise<Map<string, LtpPoint>> {
        const unique = Array.from(new Set(symbols.map((s) => this.normalizeSymbol(s))));
        const result = new Map<string, LtpPoint>();

        const entries = await Promise.all(
            unique.map(async (sym) => [sym, await this.getStockLtp(sym)] as const)
        );

        for (const [sym, data] of entries) {
            if (data) result.set(sym, data);
        }

        return result;
    }

    async getHeatmapData(): Promise<MarketHierarchy[]> {
        const symbols = Object.values(this.heatmapSectorSymbols).flat();
        const quoteMap = await this.getBatchStockLtp(symbols);

        const sectors: MarketHierarchy[] = [];
        for (const [sector, sectorSymbols] of Object.entries(this.heatmapSectorSymbols)) {
            const children: StockData[] = sectorSymbols
                .map((sym) => {
                    const quote = quoteMap.get(sym);
                    if (!quote) return null;

                    return {
                        name: sym,
                        value: Math.max(quote.price, 1) * 1000,
                        price: quote.price,
                        change: quote.changePercent,
                        volume: 0
                    };
                })
                .filter((x): x is StockData => Boolean(x));

            if (children.length === 0) continue;

            sectors.push({
                name: sector,
                value: children.reduce((acc, c) => acc + c.value, 0),
                children
            });
        }

        return sectors;
    }
}
