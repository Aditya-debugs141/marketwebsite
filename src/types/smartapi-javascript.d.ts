declare module 'smartapi-javascript' {
    export class SmartAPI {
        constructor(config: {
            api_key: string;
            access_token?: string;
            refresh_token?: string;
        });

        generateSession(
            clientId: string,
            password: string,
            totp?: string
        ): Promise<{
            status: boolean;
            message: string;
            data?: {
                jwtToken?: string;
                refreshToken?: string;
                feedToken?: string;
            };
        }>;

        getProfile(): Promise<unknown>;
        
        getQuote(params: {
            mode: string;
            exchangeTokens: Record<string, string[]>;
        }): Promise<{
            status: boolean;
            message: string;
            data?: {
                fetched?: Array<{
                    exchange?: string;
                    tradingsymbol?: string;
                    symboltoken?: string;
                    open?: number;
                    high?: number;
                    low?: number;
                    close?: number;
                    ltp?: number;
                }>;
            };
        }>;

        getLTP(params: {
            exchange: string;
            tradingsymbol: string;
            symboltoken: string;
        }): Promise<{
            status: boolean;
            message: string;
            data?: {
                exchange?: string;
                tradingsymbol?: string;
                ltp?: number;
            };
        }>;
    }
}
