export type StockQuote = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  currency: string;
  previousClose?: number;
  updatedAt: string;
  history: number[];
};

export type SortKey = 'symbol' | 'price' | 'changePercent';

export type ApiProvider = 'mock' | 'alpha-vantage' | 'finnhub';
