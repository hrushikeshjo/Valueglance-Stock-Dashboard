import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, RefreshCw, Search } from 'lucide-react';
import { fetchStockQuotes, getActiveProvider } from './services/stockApi';
import type { SortKey, StockQuote } from './types';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

function App() {
  const provider = getActiveProvider();
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeView, setActiveView] = useState<'table' | 'comparison'>('table');
  const [sortKey, setSortKey] = useState<SortKey>('symbol');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const visibleQuotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = quotes.filter((quote) => {
      return (
        quote.symbol.toLowerCase().includes(normalizedQuery) ||
        quote.name.toLowerCase().includes(normalizedQuery)
      );
    });

    return filtered.sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      const first = a[sortKey];
      const second = b[sortKey];

      if (typeof first === 'string' && typeof second === 'string') {
        return first.localeCompare(second) * direction;
      }

      return ((first as number) - (second as number)) * direction;
    });
  }, [query, quotes, sortDirection, sortKey]);

  async function loadQuotes() {
    setIsLoading(true);
    setError(null);

    try {
      const nextQuotes = await fetchStockQuotes();
      setQuotes(nextQuotes);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load stock prices.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleSort(nextSortKey: SortKey) {
    if (nextSortKey === sortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(nextSortKey === 'symbol' ? 'asc' : 'desc');
  }

  useEffect(() => {
    void loadQuotes();
  }, []);

  return (
    <main className="min-h-screen bg-surface text-ink">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Market Watch</p>
            <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">Stock Price Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              A responsive React and Tailwind dashboard connected to {formatProvider(provider)}.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700">
              {formatProvider(provider)}
            </span>
            <button
              type="button"
              onClick={loadQuotes}
              disabled={isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw aria-hidden className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Metric label="Tracked Symbols" value={quotes.length.toString()} />
          <Metric
            label="Average Move"
            value={`${percentFormatter.format(
              quotes.reduce((total, quote) => total + quote.changePercent, 0) / Math.max(quotes.length, 1),
            )}%`}
          />
          <Metric
            label="Top Mover"
            value={quotes.length ? [...quotes].sort((a, b) => b.changePercent - a.changePercent)[0].symbol : '-'}
          />
        </section>

        <div className="inline-flex w-full rounded-lg border border-slate-200 bg-white p-1 shadow-soft sm:w-fit">
          <button
            type="button"
            onClick={() => setActiveView('table')}
            className={`h-10 flex-1 rounded-md px-4 text-sm font-semibold transition sm:flex-none ${
              activeView === 'table' ? 'bg-ink text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-ink'
            }`}
          >
            Table
          </button>
          <button
            type="button"
            onClick={() => setActiveView('comparison')}
            className={`h-10 flex-1 rounded-md px-4 text-sm font-semibold transition sm:flex-none ${
              activeView === 'comparison' ? 'bg-ink text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-ink'
            }`}
          >
            Comparison
          </button>
        </div>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{activeView === 'table' ? 'Live Quotes' : 'Stock Comparison'}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {activeView === 'table'
                  ? 'Search and sort the table by symbol, price, or movement.'
                  : 'Compare movement and normalized trend across the current watchlist.'}
              </p>
            </div>

            {activeView === 'table' ? (
              <label className="relative block w-full sm:max-w-xs">
                <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <span className="sr-only">Search stocks</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search symbol or company"
                  className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-ink focus:ring-2 focus:ring-ink/10"
                />
              </label>
            ) : null}
          </div>

          {error ? <ErrorState message={error} onRetry={loadQuotes} /> : null}
          {isLoading ? <LoadingState /> : null}
          {!isLoading && !error && activeView === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <SortableHeader label="Stock Symbol" sortKey="symbol" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                    <SortableHeader label="Price" sortKey="price" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                    <SortableHeader label="% Change" sortKey="changePercent" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                    <th className="px-4 py-3 font-semibold">Trend</th>
                    <th className="px-4 py-3 font-semibold">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleQuotes.map((quote) => (
                    <tr key={quote.symbol} className="transition hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-ink">{quote.symbol}</div>
                        <div className="mt-1 text-xs text-slate-500">{quote.name}</div>
                      </td>
                      <td className="px-4 py-4 font-medium">{currencyFormatter.format(quote.price)}</td>
                      <td className="px-4 py-4">
                        <ChangePill value={quote.changePercent} />
                      </td>
                      <td className="px-4 py-4">
                        <Sparkline values={quote.history} isPositive={quote.changePercent >= 0} />
                      </td>
                      <td className="px-4 py-4 text-slate-500">{formatDate(quote.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {!isLoading && !error && activeView === 'comparison' ? <ComparisonView quotes={quotes} /> : null}

          {!isLoading && !error && activeView === 'table' && visibleQuotes.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-slate-500">No matching stocks found.</div>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: 'asc' | 'desc';
  onSort: (sortKey: SortKey) => void;
}) {
  const isActive = sortKey === activeKey;
  const Icon = direction === 'asc' ? ArrowUp : ArrowDown;

  return (
    <th className="px-4 py-3 font-semibold">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-slate-500 transition hover:text-ink"
      >
        {label}
        {isActive ? <Icon aria-hidden className="h-3.5 w-3.5" /> : null}
      </button>
    </th>
  );
}

function ChangePill({ value }: { value: number }) {
  const isPositive = value >= 0;

  return (
    <span
      className={`inline-flex min-w-20 items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold ${
        isPositive ? 'bg-emerald-50 text-gain' : 'bg-rose-50 text-loss'
      }`}
    >
      {isPositive ? '+' : ''}
      {percentFormatter.format(value)}%
    </span>
  );
}

function Sparkline({ values, isPositive }: { values: number[]; isPositive: boolean }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 120;
      const y = 38 - ((value - min) / range) * 30;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="h-11 w-32" viewBox="0 0 120 44" role="img" aria-label="Recent stock trend">
      <polyline
        fill="none"
        points={points}
        stroke={isPositive ? '#0f8f64' : '#cf3f44'}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  );
}

function ComparisonView({ quotes }: { quotes: StockQuote[] }) {
  if (quotes.length === 0) {
    return <div className="px-4 py-12 text-center text-sm text-slate-500">No stocks available to compare.</div>;
  }

  return (
    <div className="grid gap-6 p-4 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-ink">Percent Change</h3>
        <div className="mt-4 overflow-x-auto">
          <PercentChangeChart quotes={quotes} />
        </div>
      </div>

      <div className="min-w-0 border-t border-slate-200 pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <h3 className="text-sm font-semibold text-ink">Normalized Trend</h3>
        <div className="mt-4">
          <TrendComparisonChart quotes={quotes.slice(0, 6)} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
          {quotes.slice(0, 6).map((quote, index) => (
            <div key={quote.symbol} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColor(index) }} />
              <span className="font-medium">{quote.symbol}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PercentChangeChart({ quotes }: { quotes: StockQuote[] }) {
  const rowHeight = 44;
  const labelWidth = 64;
  const chartWidth = 520;
  const height = quotes.length * rowHeight + 24;
  const maxAbs = Math.max(...quotes.map((quote) => Math.abs(quote.changePercent)), 1);
  const zeroX = labelWidth + chartWidth / 2;

  return (
    <svg className="min-w-[720px]" viewBox={`0 0 ${labelWidth + chartWidth + 112} ${height}`} role="img" aria-label="Percent change comparison chart">
      <line x1={zeroX} x2={zeroX} y1="0" y2={height - 12} stroke="#cbd5e1" strokeWidth="1" />
      {quotes.map((quote, index) => {
        const barWidth = (Math.abs(quote.changePercent) / maxAbs) * (chartWidth / 2 - 16);
        const isPositive = quote.changePercent >= 0;
        const x = isPositive ? zeroX : zeroX - barWidth;
        const y = index * rowHeight + 10;

        return (
          <g key={quote.symbol}>
            <text x="0" y={y + 19} fill="#475569" fontSize="13" fontWeight="700">
              {quote.symbol}
            </text>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height="24"
              rx="5"
              fill={isPositive ? '#0f8f64' : '#cf3f44'}
            />
            <text
              x={isPositive ? x + barWidth + 8 : x - 8}
              y={y + 17}
              fill="#334155"
              fontSize="12"
              fontWeight="700"
              textAnchor={isPositive ? 'start' : 'end'}
            >
              {isPositive ? '+' : ''}
              {percentFormatter.format(quote.changePercent)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function TrendComparisonChart({ quotes }: { quotes: StockQuote[] }) {
  const width = 320;
  const height = 180;
  const padding = 18;

  return (
    <svg className="h-auto w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Normalized trend comparison chart">
      <rect x="0" y="0" width={width} height={height} rx="8" fill="#f8fafc" />
      {[0, 1, 2, 3].map((line) => {
        const y = padding + line * ((height - padding * 2) / 3);
        return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
      })}
      {quotes.map((quote, index) => (
        <polyline
          key={quote.symbol}
          fill="none"
          points={toTrendPoints(quote.history, width, height, padding)}
          stroke={chartColor(index)}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
        />
      ))}
    </svg>
  );
}

function toTrendPoints(values: number[], width: number, height: number, padding: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');
}

function chartColor(index: number) {
  const colors = ['#2563eb', '#0f8f64', '#cf3f44', '#7c3aed', '#d97706', '#0891b2'];
  return colors[index % colors.length];
}

function LoadingState() {
  return (
    <div className="flex items-center gap-3 px-4 py-10 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-ink" />
      Loading stock prices...
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="m-4 flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 sm:flex-row sm:items-center sm:justify-between">
      <span>{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-9 items-center justify-center rounded-md bg-rose-700 px-3 text-sm font-semibold text-white transition hover:bg-rose-800"
      >
        Try again
      </button>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatProvider(provider: string) {
  if (provider === 'alpha-vantage') return 'Alpha Vantage';
  if (provider === 'finnhub') return 'Finnhub';
  return 'Mock Data';
}

export default App;
