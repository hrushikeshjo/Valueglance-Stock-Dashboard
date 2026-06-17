# Stock Price Dashboard

A simple React, TypeScript, and Tailwind CSS stock dashboard for the Valueglance coding challenge.

## Features

- Required table with stock symbol, price, and percentage change
- Loading and error states
- Search by stock symbol or company name
- Sort by symbol, price, or percentage change
- Responsive Tailwind layout
- Lightweight SVG trend chart for each stock
- Mock data mode so the app runs before API keys are added
- API adapters for Alpha Vantage and Finnhub

## Getting Started

This repo contains all source and config needed to run the dashboard. Dependencies are installed from `package-lock.json`, so `node_modules` does not need to be committed.

```bash
npm install
npm run dev
```

The app runs without a local `.env` file by using mock stock data. Add API keys only if you want live provider data.

## API Keys

Copy `.env.example` to `.env.local`, then choose a provider.

For mock data:

```bash
VITE_STOCK_API_PROVIDER=mock
```

For Alpha Vantage:

```bash
VITE_STOCK_API_PROVIDER=alpha-vantage
VITE_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
```

For Finnhub:

```bash
VITE_STOCK_API_PROVIDER=finnhub
VITE_FINNHUB_API_KEY=your_finnhub_key
```

Optional symbol list:

```bash
VITE_STOCK_SYMBOLS=AAPL,MSFT,NVDA,GOOGL,AMZN,META,TSLA,JPM,V,UNH,HD,PG
```

The dashboard keeps API results when available and fills any temporarily rate-limited symbols with local sample rows so the watchlist still renders.

## Deployment

This app is ready for Vercel, Netlify, or GitHub Pages. Use:

```bash
npm run build
```

The production output is created in `dist`.
