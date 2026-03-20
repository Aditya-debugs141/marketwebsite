type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface RetryOptions {
    retries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    label?: string;
    shouldRetry?: (error: unknown) => boolean;
}

export interface TimeoutOptions {
    timeoutMs: number;
    label: string;
}

function toError(error: unknown): Error {
    if (error instanceof Error) return error;
    return new Error(typeof error === 'string' ? error : JSON.stringify(error));
}

function writeLog(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const payload = {
        ts: new Date().toISOString(),
        level,
        message,
        ...(context ? { context } : {})
    };

    const line = JSON.stringify(payload);
    if (level === 'error') {
        console.error(line);
        return;
    }
    if (level === 'warn') {
        console.warn(line);
        return;
    }
    console.log(line);
}

export const logger = {
    debug: (message: string, context?: Record<string, unknown>) => writeLog('debug', message, context),
    info: (message: string, context?: Record<string, unknown>) => writeLog('info', message, context),
    warn: (message: string, context?: Record<string, unknown>) => writeLog('warn', message, context),
    error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
        const err = error ? toError(error) : undefined;
        writeLog('error', message, {
            ...(context || {}),
            ...(err ? { error: err.message, stack: err.stack } : {})
        });
    }
};

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function withTimeout<T>(promise: Promise<T>, options: TimeoutOptions): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`${options.label} timed out after ${options.timeoutMs}ms`)), options.timeoutMs);
        promise
            .then((value) => {
                clearTimeout(timer);
                resolve(value);
            })
            .catch((error) => {
                clearTimeout(timer);
                reject(error);
            });
    });
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const retries = options.retries ?? 2;
    const baseDelayMs = options.baseDelayMs ?? 400;
    const maxDelayMs = options.maxDelayMs ?? 4000;
    const shouldRetry = options.shouldRetry ?? (() => true);

    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const canRetry = attempt < retries && shouldRetry(error);
            if (!canRetry) {
                throw error;
            }

            const backoff = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
            logger.warn('Retrying operation after failure', {
                label: options.label ?? 'operation',
                attempt: attempt + 1,
                nextDelayMs: backoff,
                reason: toError(error).message
            });
            await sleep(backoff);
        }
    }

    throw toError(lastError);
}

export function dedupeSymbols(symbols: string[]): string[] {
    return [...new Set(symbols.map((s) => s.trim()).filter(Boolean))];
}

export function isTransientNetworkError(error: unknown): boolean {
    const message = toError(error).message.toLowerCase();
    return message.includes('timed out')
        || message.includes('429')
        || message.includes('503')
        || message.includes('504')
        || message.includes('network')
        || message.includes('fetch failed')
        || message.includes('ecconnreset')
        || message.includes('etimedout');
}
