import type { ApiProvider, StockQuote } from '../types';

const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'JPM', 'V', 'UNH', 'HD', 'PG'];

const COMPANY_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft Corp.',
  NVDA: 'NVIDIA Corp.',
  GOOGL: 'Alphabet Inc.',
  AMZN: 'Amazon.com Inc.',
  TSLA: 'Tesla Inc.',
  META: 'Meta Platforms Inc.',
  JPM: 'JPMorgan Chase & Co.',
  V: 'Visa Inc.',
  UNH: 'UnitedHealth Group Inc.',
  HD: 'The Home Depot Inc.',
  PG: 'Procter & Gamble Co.',
};

const mockQuotes: StockQuote[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 214.42,
    changePercent: 1.18,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [207, 209, 208, 211, 212, 210, 214],
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 436.76,
    changePercent: -0.42,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [441, 439, 438, 442, 440, 437, 436],
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    price: 138.11,
    changePercent: 2.63,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [129, 131, 130, 134, 136, 135, 138],
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 176.21,
    changePercent: 0.74,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [171, 172, 174, 173, 175, 174, 176],
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 188.94,
    changePercent: -1.05,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [194, 192, 193, 191, 190, 189, 188],
  },
  {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    price: 644.62,
    changePercent: 1.54,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [621, 626, 633, 631, 639, 641, 644],
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 182.74,
    changePercent: -2.31,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [191, 188, 186, 187, 184, 185, 182],
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    price: 268.83,
    changePercent: 0.36,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [263, 265, 266, 267, 266, 268, 269],
  },
  {
    symbol: 'V',
    name: 'Visa Inc.',
    price: 356.18,
    changePercent: 0.91,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [347, 349, 351, 350, 353, 354, 356],
  },
  {
    symbol: 'UNH',
    name: 'UnitedHealth Group Inc.',
    price: 309.12,
    changePercent: -0.68,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [316, 314, 312, 313, 311, 310, 309],
  },
  {
    symbol: 'HD',
    name: 'The Home Depot Inc.',
    price: 367.45,
    changePercent: 1.07,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [358, 359, 361, 360, 363, 365, 367],
  },
  {
    symbol: 'PG',
    name: 'Procter & Gamble Co.',
    price: 165.86,
    changePercent: -0.14,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [167, 166, 166, 165, 166, 165, 166],
  },
];

export function getConfiguredSymbols(): string[] {
  const raw = import.meta.env.VITE_STOCK_SYMBOLS;
  if (!raw) return DEFAULT_SYMBOLS;

  return raw
    .split(',')
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);
}

export async function fetchStockQuotes(symbols = getConfiguredSymbols()): Promise<StockQuote[]> {
  const provider = getProvider();

  if (provider === 'alpha-vantage') {
    return fetchProviderQuotes(symbols, fetchAlphaVantageQuote, 'Alpha Vantage');
  }

  if (provider === 'finnhub') {
    return fetchProviderQuotes(symbols, fetchFinnhubQuote, 'Finnhub');
  }

  await delay(500);
  return mockQuotes.filter((quote) => symbols.includes(quote.symbol));
}

export function getActiveProvider(): ApiProvider {
  return getProvider();
}

function getProvider(): ApiProvider {
  return (import.meta.env.VITE_STOCK_API_PROVIDER || 'mock') as ApiProvider;
}

async function fetchProviderQuotes(
  symbols: string[],
  fetchQuote: (symbol: string) => Promise<StockQuote>,
  providerLabel: string,
): Promise<StockQuote[]> {
  const results = await Promise.allSettled(symbols.map(fetchQuote));
  const quotes = results
    .filter((result): result is PromiseFulfilledResult<StockQuote> => result.status === 'fulfilled')
    .map((result) => result.value);

  if (quotes.length > 0) {
    return mergeWithSampleRows(symbols, quotes);
  }

  const firstError = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
  const message = firstError?.reason instanceof Error ? firstError.reason.message : `No ${providerLabel} quotes returned.`;
  throw new Error(message);
}

function mergeWithSampleRows(symbols: string[], apiQuotes: StockQuote[]) {
  const quoteBySymbol = new Map(apiQuotes.map((quote) => [quote.symbol, quote]));
  const sampleBySymbol = new Map(mockQuotes.map((quote) => [quote.symbol, quote]));

  return symbols
    .map((symbol) => quoteBySymbol.get(symbol) || sampleBySymbol.get(symbol))
    .filter((quote): quote is StockQuote => Boolean(quote));
}

async function fetchAlphaVantageQuote(symbol: string): Promise<StockQuote> {
  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_ALPHA_VANTAGE_API_KEY. Add it to .env.local or use VITE_STOCK_API_PROVIDER=mock.');
  }

  const url = new URL('https://www.alphavantage.co/query');
  url.searchParams.set('function', 'GLOBAL_QUOTE');
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('apikey', apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Alpha Vantage request failed for ${symbol}.`);
  }

  const data = await response.json();
  assertNoAlphaVantageError(data, symbol);

  const quote = data['Global Quote'];
  if (!quote || !quote['05. price']) {
    throw new Error(`No Alpha Vantage quote returned for ${symbol}.`);
  }

  const price = Number(quote['05. price']);
  const previousClose = Number(quote['08. previous close']);
  const changePercent = Number(String(quote['10. change percent']).replace('%', ''));

  return {
    symbol,
    name: COMPANY_NAMES[symbol] || symbol,
    price,
    previousClose,
    changePercent,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: makeMiniHistory(price, previousClose),
  };
}

async function fetchFinnhubQuote(symbol: string): Promise<StockQuote> {
  const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_FINNHUB_API_KEY. Add it to .env.local or use VITE_STOCK_API_PROVIDER=mock.');
  }

  const url = new URL('https://finnhub.io/api/v1/quote');
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('token', apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Finnhub request failed for ${symbol}.`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`Finnhub error for ${symbol}: ${data.error}.`);
  }

  if (!data || typeof data.c !== 'number' || data.c === 0) {
    throw new Error(`No Finnhub quote returned for ${symbol}.`);
  }

  const price = data.c;
  const previousClose = data.pc;
  const changePercent = previousClose ? ((price - previousClose) / previousClose) * 100 : 0;

  return {
    symbol,
    name: COMPANY_NAMES[symbol] || symbol,
    price,
    previousClose,
    changePercent,
    currency: 'USD',
    updatedAt: new Date((data.t || Date.now() / 1000) * 1000).toISOString(),
    history: makeMiniHistory(price, previousClose),
  };
}

function makeMiniHistory(price: number, previousClose?: number): number[] {
  const base = previousClose || price;
  return [base * 0.985, base * 1.006, base * 0.997, base * 1.012, base * 1.004, price];
}

function assertNoAlphaVantageError(data: Record<string, unknown>, symbol: string) {
  const message = data['Error Message'] || data.Information || data.Note;

  if (typeof message === 'string') {
    throw new Error(`Alpha Vantage error for ${symbol}: ${message}`);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
