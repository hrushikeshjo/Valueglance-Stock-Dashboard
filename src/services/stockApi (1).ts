import type { ApiProvider, StockQuote } from '../types';

const DEFAULT_SYMBOLS = [
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'JPM', 'V', 'UNH', 'HD', 'PG', 'AVGO',
  'ORCL', 'CRM', 'ADBE', 'CSCO', 'INTC', 'AMD', 'QCOM', 'TXN', 'IBM', 'NOW', 'INTU', 'AMAT', 'MU',
  'PANW', 'SNPS', 'CDNS', 'ADI', 'LRCX', 'KLAC', 'ANET', 'FTNT', 'WDAY', 'PYPL', 'NFLX', 'DIS',
  'CMCSA', 'T', 'VZ', 'TMUS', 'CHTR', 'NKE', 'SBUX', 'MCD', 'LOW', 'TJX', 'BKNG', 'CMG', 'ORLY',
  'MAR', 'GM', 'F', 'KO', 'PEP', 'COST', 'WMT', 'MDLZ', 'CL', 'KMB', 'GIS', 'STZ', 'LLY', 'JNJ',
  'ABBV', 'MRK', 'PFE', 'TMO', 'ABT', 'DHR', 'BMY', 'AMGN', 'GILD', 'CVS', 'ISRG', 'VRTX', 'REGN',
  'MDT', 'CI', 'ELV', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'SCHW', 'BLK', 'SPGI', 'CB', 'PNC',
  'USB', 'CAT', 'BA', 'HON', 'UPS', 'RTX', 'LMT', 'GE',
];

// Alpha Vantage's free tier caps usage at 25 requests/day and 5/minute. We only fetch
// live quotes for the first N symbols and serve the rest from mock data so the app
// never exceeds the daily quota or trips the rate limiter.
const ALPHA_VANTAGE_MAX_LIVE_SYMBOLS = 20;
const ALPHA_VANTAGE_BATCH_SIZE = 5;
const ALPHA_VANTAGE_BATCH_DELAY_MS = 61_000;

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
  AVGO: 'Broadcom Inc.',
  ORCL: 'Oracle Corp.',
  CRM: 'Salesforce Inc.',
  ADBE: 'Adobe Inc.',
  CSCO: 'Cisco Systems Inc.',
  INTC: 'Intel Corp.',
  AMD: 'Advanced Micro Devices Inc.',
  QCOM: 'Qualcomm Inc.',
  TXN: 'Texas Instruments Inc.',
  IBM: 'International Business Machines Corp.',
  NOW: 'ServiceNow Inc.',
  INTU: 'Intuit Inc.',
  AMAT: 'Applied Materials Inc.',
  MU: 'Micron Technology Inc.',
  PANW: 'Palo Alto Networks Inc.',
  SNPS: 'Synopsys Inc.',
  CDNS: 'Cadence Design Systems Inc.',
  ADI: 'Analog Devices Inc.',
  LRCX: 'Lam Research Corp.',
  KLAC: 'KLA Corp.',
  ANET: 'Arista Networks Inc.',
  FTNT: 'Fortinet Inc.',
  WDAY: 'Workday Inc.',
  PYPL: 'PayPal Holdings Inc.',
  NFLX: 'Netflix Inc.',
  DIS: 'The Walt Disney Co.',
  CMCSA: 'Comcast Corp.',
  T: 'AT&T Inc.',
  VZ: 'Verizon Communications Inc.',
  TMUS: 'T-Mobile US Inc.',
  CHTR: 'Charter Communications Inc.',
  NKE: 'Nike Inc.',
  SBUX: 'Starbucks Corp.',
  MCD: "McDonald's Corp.",
  LOW: "Lowe's Companies Inc.",
  TJX: 'The TJX Companies Inc.',
  BKNG: 'Booking Holdings Inc.',
  CMG: 'Chipotle Mexican Grill Inc.',
  ORLY: "O'Reilly Automotive Inc.",
  MAR: 'Marriott International Inc.',
  GM: 'General Motors Co.',
  F: 'Ford Motor Co.',
  KO: 'The Coca-Cola Co.',
  PEP: 'PepsiCo Inc.',
  COST: 'Costco Wholesale Corp.',
  WMT: 'Walmart Inc.',
  MDLZ: 'Mondelez International Inc.',
  CL: 'Colgate-Palmolive Co.',
  KMB: 'Kimberly-Clark Corp.',
  GIS: 'General Mills Inc.',
  STZ: 'Constellation Brands Inc.',
  LLY: 'Eli Lilly and Co.',
  JNJ: 'Johnson & Johnson',
  ABBV: 'AbbVie Inc.',
  MRK: 'Merck & Co. Inc.',
  PFE: 'Pfizer Inc.',
  TMO: 'Thermo Fisher Scientific Inc.',
  ABT: 'Abbott Laboratories',
  DHR: 'Danaher Corp.',
  BMY: 'Bristol-Myers Squibb Co.',
  AMGN: 'Amgen Inc.',
  GILD: 'Gilead Sciences Inc.',
  CVS: 'CVS Health Corp.',
  ISRG: 'Intuitive Surgical Inc.',
  VRTX: 'Vertex Pharmaceuticals Inc.',
  REGN: 'Regeneron Pharmaceuticals Inc.',
  MDT: 'Medtronic plc',
  CI: 'The Cigna Group',
  ELV: 'Elevance Health Inc.',
  BAC: 'Bank of America Corp.',
  WFC: 'Wells Fargo & Co.',
  GS: 'The Goldman Sachs Group Inc.',
  MS: 'Morgan Stanley',
  C: 'Citigroup Inc.',
  AXP: 'American Express Co.',
  SCHW: 'The Charles Schwab Corp.',
  BLK: 'BlackRock Inc.',
  SPGI: 'S&P Global Inc.',
  CB: 'Chubb Ltd.',
  PNC: 'The PNC Financial Services Group Inc.',
  USB: 'U.S. Bancorp',
  CAT: 'Caterpillar Inc.',
  BA: 'The Boeing Co.',
  HON: 'Honeywell International Inc.',
  UPS: 'United Parcel Service Inc.',
  RTX: 'RTX Corp.',
  LMT: 'Lockheed Martin Corp.',
  GE: 'GE Aerospace',
};

const mockQuotes: StockQuote[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 214.42,
    changePercent: -1.49,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [217.66, 219.05, 220.93, 218.75, 216.99, 213.34, 214.42],
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 436.76,
    changePercent: -2.96,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [450.06, 450.15, 445.64, 438.22, 436.99, 430.59, 436.76],
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    price: 138.11,
    changePercent: -2.7,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [141.94, 142.4, 140.98, 141.21, 141.98, 140.46, 138.11],
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 176.21,
    changePercent: -0.63,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [177.32, 175.15, 174.15, 175.4, 177.35, 174.25, 176.21],
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 188.94,
    changePercent: -0.18,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [189.29, 190.0, 192.41, 189.66, 186.92, 185.83, 188.94],
  },
  {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    price: 644.62,
    changePercent: 3.61,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [622.19, 623.36, 620.65, 631.4, 632.22, 637.49, 644.62],
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 182.74,
    changePercent: 2.35,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [178.54, 175.67, 176.97, 177.46, 179.8, 180.57, 182.74],
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    price: 268.83,
    changePercent: -6.21,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [286.63, 284.36, 280.33, 277.66, 273.52, 271.46, 268.83],
  },
  {
    symbol: 'V',
    name: 'Visa Inc.',
    price: 356.18,
    changePercent: -0.75,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [358.86, 364.59, 361.56, 357.82, 356.16, 354.44, 356.18],
  },
  {
    symbol: 'UNH',
    name: 'UnitedHealth Group Inc.',
    price: 309.12,
    changePercent: -1.05,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [312.4, 311.05, 307.33, 309.89, 306.26, 307.47, 309.12],
  },
  {
    symbol: 'HD',
    name: 'The Home Depot Inc.',
    price: 367.45,
    changePercent: 5.54,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [348.15, 351.64, 356.03, 358.41, 359.15, 360.97, 367.45],
  },
  {
    symbol: 'PG',
    name: 'Procter & Gamble Co.',
    price: 165.86,
    changePercent: -3.5,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [171.88, 174.66, 172.86, 171.43, 170.3, 167.48, 165.86],
  },
  {
    symbol: 'AVGO',
    name: 'Broadcom Inc.',
    price: 285.4,
    changePercent: 2.27,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [279.07, 278.66, 282.88, 281.82, 283.41, 281.53, 285.4],
  },
  {
    symbol: 'ORCL',
    name: 'Oracle Corp.',
    price: 175.2,
    changePercent: -0.63,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [176.31, 178.87, 179.42, 177.9, 178.29, 176.68, 175.2],
  },
  {
    symbol: 'CRM',
    name: 'Salesforce Inc.',
    price: 340.1,
    changePercent: -2.57,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [349.06, 343.46, 338.48, 338.6, 344.78, 341.33, 340.1],
  },
  {
    symbol: 'ADBE',
    name: 'Adobe Inc.',
    price: 480.55,
    changePercent: -2.12,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [490.94, 488.86, 481.3, 479.96, 485.06, 487.3, 480.55],
  },
  {
    symbol: 'CSCO',
    name: 'Cisco Systems Inc.',
    price: 58.3,
    changePercent: 4.05,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [56.03, 56.48, 55.5, 56.23, 57.2, 57.26, 58.3],
  },
  {
    symbol: 'INTC',
    name: 'Intel Corp.',
    price: 32.15,
    changePercent: -1.2,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [32.54, 32.46, 32.01, 32.17, 31.9, 31.94, 32.15],
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices Inc.',
    price: 145.6,
    changePercent: 0.84,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [144.38, 142.73, 142.73, 141.52, 143.46, 145.84, 145.6],
  },
  {
    symbol: 'QCOM',
    name: 'Qualcomm Inc.',
    price: 165.9,
    changePercent: 1.78,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [163.0, 160.99, 161.62, 162.43, 161.26, 163.44, 165.9],
  },
  {
    symbol: 'TXN',
    name: 'Texas Instruments Inc.',
    price: 195.4,
    changePercent: -0.2,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [195.8, 194.57, 191.13, 191.34, 193.28, 193.55, 195.4],
  },
  {
    symbol: 'IBM',
    name: 'International Business Machines Corp.',
    price: 235.7,
    changePercent: 0.14,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [235.36, 231.67, 230.08, 232.86, 236.08, 239.78, 235.7],
  },
  {
    symbol: 'NOW',
    name: 'ServiceNow Inc.',
    price: 950.2,
    changePercent: 0.87,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [942.02, 950.94, 936.42, 935.95, 922.19, 937.27, 950.2],
  },
  {
    symbol: 'INTU',
    name: 'Intuit Inc.',
    price: 650.8,
    changePercent: 0.23,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [649.3, 658.12, 652.6, 653.77, 653.19, 644.57, 650.8],
  },
  {
    symbol: 'AMAT',
    name: 'Applied Materials Inc.',
    price: 195.3,
    changePercent: -2.06,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [199.4, 198.06, 195.95, 197.59, 197.87, 195.84, 195.3],
  },
  {
    symbol: 'MU',
    name: 'Micron Technology Inc.',
    price: 105.4,
    changePercent: -0.16,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [105.57, 104.53, 103.12, 103.19, 102.96, 103.52, 105.4],
  },
  {
    symbol: 'PANW',
    name: 'Palo Alto Networks Inc.',
    price: 165.1,
    changePercent: -3.24,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [170.62, 171.43, 168.82, 167.14, 165.53, 166.06, 165.1],
  },
  {
    symbol: 'SNPS',
    name: 'Synopsys Inc.',
    price: 520.6,
    changePercent: -0.06,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [520.91, 524.1, 519.2, 511.3, 518.01, 525.68, 520.6],
  },
  {
    symbol: 'CDNS',
    name: 'Cadence Design Systems Inc.',
    price: 290.3,
    changePercent: 0.43,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [289.06, 292.05, 291.76, 292.51, 297.17, 293.29, 290.3],
  },
  {
    symbol: 'ADI',
    name: 'Analog Devices Inc.',
    price: 230.1,
    changePercent: -2.06,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [234.93, 234.65, 234.01, 233.43, 230.09, 227.55, 230.1],
  },
  {
    symbol: 'LRCX',
    name: 'Lam Research Corp.',
    price: 85.4,
    changePercent: 0.85,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [84.68, 84.19, 83.9, 82.7, 84.17, 84.7, 85.4],
  },
  {
    symbol: 'KLAC',
    name: 'KLA Corp.',
    price: 700.5,
    changePercent: -1.94,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [714.36, 708.71, 706.72, 705.42, 697.64, 691.38, 700.5],
  },
  {
    symbol: 'ANET',
    name: 'Arista Networks Inc.',
    price: 320.2,
    changePercent: 0.32,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [319.17, 314.09, 314.66, 318.81, 318.16, 323.08, 320.2],
  },
  {
    symbol: 'FTNT',
    name: 'Fortinet Inc.',
    price: 95.3,
    changePercent: 6.55,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [89.44, 88.38, 89.5, 90.9, 92.46, 93.59, 95.3],
  },
  {
    symbol: 'WDAY',
    name: 'Workday Inc.',
    price: 245.1,
    changePercent: -1.67,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [249.26, 253.69, 252.59, 248.64, 247.76, 245.23, 245.1],
  },
  {
    symbol: 'PYPL',
    name: 'PayPal Holdings Inc.',
    price: 70.4,
    changePercent: 3.26,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [68.18, 69.42, 70.58, 70.38, 70.27, 71.0, 70.4],
  },
  {
    symbol: 'NFLX',
    name: 'Netflix Inc.',
    price: 850.3,
    changePercent: 1.02,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [841.72, 844.13, 858.62, 852.38, 841.92, 848.59, 850.3],
  },
  {
    symbol: 'DIS',
    name: 'The Walt Disney Co.',
    price: 110.2,
    changePercent: 1.06,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [109.04, 110.44, 110.45, 110.79, 109.05, 110.03, 110.2],
  },
  {
    symbol: 'CMCSA',
    name: 'Comcast Corp.',
    price: 38.5,
    changePercent: -1.18,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [38.96, 39.21, 39.34, 38.9, 38.32, 38.97, 38.5],
  },
  {
    symbol: 'T',
    name: 'AT&T Inc.',
    price: 22.3,
    changePercent: -1.02,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [22.53, 22.63, 22.71, 22.5, 22.82, 22.51, 22.3],
  },
  {
    symbol: 'VZ',
    name: 'Verizon Communications Inc.',
    price: 42.1,
    changePercent: 1.42,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [41.51, 41.84, 41.4, 42.06, 42.09, 42.22, 42.1],
  },
  {
    symbol: 'TMUS',
    name: 'T-Mobile US Inc.',
    price: 195.4,
    changePercent: -1.15,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [197.68, 199.49, 198.18, 196.76, 197.98, 197.24, 195.4],
  },
  {
    symbol: 'CHTR',
    name: 'Charter Communications Inc.',
    price: 320.6,
    changePercent: -0.61,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [322.58, 319.28, 314.45, 320.17, 326.02, 325.53, 320.6],
  },
  {
    symbol: 'NKE',
    name: 'Nike Inc.',
    price: 75.2,
    changePercent: 1.8,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [73.87, 72.97, 72.63, 73.64, 74.66, 75.84, 75.2],
  },
  {
    symbol: 'SBUX',
    name: 'Starbucks Corp.',
    price: 95.4,
    changePercent: 2.97,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [92.65, 91.04, 91.55, 93.18, 93.56, 94.25, 95.4],
  },
  {
    symbol: 'MCD',
    name: "McDonald's Corp.",
    price: 295.1,
    changePercent: -0.07,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [295.3, 291.27, 287.49, 292.11, 293.84, 291.73, 295.1],
  },
  {
    symbol: 'LOW',
    name: "Lowe's Companies Inc.",
    price: 245.3,
    changePercent: -1.91,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [250.07, 247.43, 249.38, 250.32, 248.29, 248.77, 245.3],
  },
  {
    symbol: 'TJX',
    name: 'The TJX Companies Inc.',
    price: 115.2,
    changePercent: 0.88,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [114.2, 112.55, 113.97, 115.66, 115.61, 114.64, 115.2],
  },
  {
    symbol: 'BKNG',
    name: 'Booking Holdings Inc.',
    price: 4800.5,
    changePercent: -2.2,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [4908.49, 4866.78, 4890.92, 4939.13, 4852.41, 4813.71, 4800.5],
  },
  {
    symbol: 'CMG',
    name: 'Chipotle Mexican Grill Inc.',
    price: 55.3,
    changePercent: -1.07,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [55.9, 56.68, 55.83, 54.86, 54.72, 54.82, 55.3],
  },
  {
    symbol: 'ORLY',
    name: "O'Reilly Automotive Inc.",
    price: 1250.4,
    changePercent: 0.55,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [1243.58, 1227.12, 1211.77, 1215.38, 1230.2, 1232.22, 1250.4],
  },
  {
    symbol: 'MAR',
    name: 'Marriott International Inc.',
    price: 260.1,
    changePercent: 3.61,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [251.04, 248.45, 252.07, 255.39, 258.14, 261.9, 260.1],
  },
  {
    symbol: 'GM',
    name: 'General Motors Co.',
    price: 52.3,
    changePercent: 0.19,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [52.2, 52.43, 52.25, 52.98, 53.52, 52.77, 52.3],
  },
  {
    symbol: 'F',
    name: 'Ford Motor Co.',
    price: 12.1,
    changePercent: 6.05,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [11.41, 11.57, 11.7, 11.9, 12.06, 12.25, 12.1],
  },
  {
    symbol: 'KO',
    name: 'The Coca-Cola Co.',
    price: 65.4,
    changePercent: 2.57,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [63.76, 64.61, 65.32, 66.35, 65.95, 66.52, 65.4],
  },
  {
    symbol: 'PEP',
    name: 'PepsiCo Inc.',
    price: 165.3,
    changePercent: 2.62,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [161.08, 163.19, 165.41, 163.11, 164.82, 163.45, 165.3],
  },
  {
    symbol: 'COST',
    name: 'Costco Wholesale Corp.',
    price: 920.6,
    changePercent: -0.59,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [926.1, 917.11, 926.97, 920.51, 919.2, 929.8, 920.6],
  },
  {
    symbol: 'WMT',
    name: 'Walmart Inc.',
    price: 90.2,
    changePercent: -1.18,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [91.28, 90.56, 92.11, 93.33, 92.76, 91.75, 90.2],
  },
  {
    symbol: 'MDLZ',
    name: 'Mondelez International Inc.',
    price: 65.1,
    changePercent: 2.28,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [63.65, 62.78, 63.79, 63.87, 65.0, 64.77, 65.1],
  },
  {
    symbol: 'CL',
    name: 'Colgate-Palmolive Co.',
    price: 95.4,
    changePercent: -0.24,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [95.63, 95.41, 94.08, 93.29, 94.87, 93.78, 95.4],
  },
  {
    symbol: 'KMB',
    name: 'Kimberly-Clark Corp.',
    price: 130.2,
    changePercent: 0.44,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [129.63, 129.99, 129.45, 129.5, 130.0, 129.13, 130.2],
  },
  {
    symbol: 'GIS',
    name: 'General Mills Inc.',
    price: 62.3,
    changePercent: 0.56,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [61.95, 62.44, 62.53, 63.5, 62.38, 62.85, 62.3],
  },
  {
    symbol: 'STZ',
    name: 'Constellation Brands Inc.',
    price: 235.1,
    changePercent: -0.55,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [236.39, 234.95, 236.35, 232.75, 231.62, 233.05, 235.1],
  },
  {
    symbol: 'LLY',
    name: 'Eli Lilly and Co.',
    price: 850.4,
    changePercent: -0.34,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [853.31, 850.51, 844.71, 838.68, 845.37, 856.1, 850.4],
  },
  {
    symbol: 'JNJ',
    name: 'Johnson & Johnson',
    price: 155.3,
    changePercent: -0.47,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [156.04, 157.04, 159.57, 159.11, 157.0, 155.85, 155.3],
  },
  {
    symbol: 'ABBV',
    name: 'AbbVie Inc.',
    price: 175.2,
    changePercent: -1.2,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [177.33, 175.98, 172.87, 173.17, 171.94, 172.66, 175.2],
  },
  {
    symbol: 'MRK',
    name: 'Merck & Co. Inc.',
    price: 105.4,
    changePercent: -0.76,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [106.21, 105.13, 104.91, 104.78, 105.37, 105.67, 105.4],
  },
  {
    symbol: 'PFE',
    name: 'Pfizer Inc.',
    price: 27.1,
    changePercent: -0.18,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [27.15, 27.17, 26.77, 26.46, 26.74, 27.13, 27.1],
  },
  {
    symbol: 'TMO',
    name: 'Thermo Fisher Scientific Inc.',
    price: 540.3,
    changePercent: 1.6,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [531.79, 526.57, 529.87, 534.7, 540.9, 537.71, 540.3],
  },
  {
    symbol: 'ABT',
    name: 'Abbott Laboratories',
    price: 115.2,
    changePercent: -3.96,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [119.95, 118.13, 119.64, 119.53, 118.44, 116.45, 115.2],
  },
  {
    symbol: 'DHR',
    name: 'Danaher Corp.',
    price: 220.4,
    changePercent: -1.16,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [222.98, 220.94, 220.9, 222.47, 220.05, 221.08, 220.4],
  },
  {
    symbol: 'BMY',
    name: 'Bristol-Myers Squibb Co.',
    price: 52.3,
    changePercent: -1.0,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [52.83, 52.69, 51.95, 52.46, 52.94, 52.01, 52.3],
  },
  {
    symbol: 'AMGN',
    name: 'Amgen Inc.',
    price: 290.1,
    changePercent: -0.67,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [292.06, 295.77, 293.12, 288.45, 288.64, 293.48, 290.1],
  },
  {
    symbol: 'GILD',
    name: 'Gilead Sciences Inc.',
    price: 95.4,
    changePercent: 5.44,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [90.48, 91.97, 92.29, 93.94, 94.51, 95.55, 95.4],
  },
  {
    symbol: 'CVS',
    name: 'CVS Health Corp.',
    price: 65.2,
    changePercent: 4.1,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [62.63, 62.74, 63.5, 63.51, 64.02, 64.28, 65.2],
  },
  {
    symbol: 'ISRG',
    name: 'Intuitive Surgical Inc.',
    price: 470.3,
    changePercent: 0.96,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [465.81, 468.13, 463.91, 459.92, 459.5, 463.57, 470.3],
  },
  {
    symbol: 'VRTX',
    name: 'Vertex Pharmaceuticals Inc.',
    price: 460.1,
    changePercent: -1.58,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [467.48, 463.9, 456.95, 453.27, 455.35, 455.7, 460.1],
  },
  {
    symbol: 'REGN',
    name: 'Regeneron Pharmaceuticals Inc.',
    price: 750.4,
    changePercent: -2.84,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [772.3, 777.73, 770.28, 760.38, 761.48, 756.57, 750.4],
  },
  {
    symbol: 'MDT',
    name: 'Medtronic plc',
    price: 90.2,
    changePercent: -2.31,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [92.33, 91.37, 91.09, 91.23, 90.93, 89.53, 90.2],
  },
  {
    symbol: 'CI',
    name: 'The Cigna Group',
    price: 330.3,
    changePercent: 4.55,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [315.94, 318.99, 323.14, 325.43, 326.42, 331.25, 330.3],
  },
  {
    symbol: 'ELV',
    name: 'Elevance Health Inc.',
    price: 420.1,
    changePercent: 1.12,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [415.43, 422.32, 427.76, 431.7, 429.41, 421.91, 420.1],
  },
  {
    symbol: 'BAC',
    name: 'Bank of America Corp.',
    price: 42.3,
    changePercent: -0.84,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [42.66, 42.23, 41.81, 41.97, 42.04, 42.42, 42.3],
  },
  {
    symbol: 'WFC',
    name: 'Wells Fargo & Co.',
    price: 72.1,
    changePercent: -3.34,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [74.59, 73.7, 73.45, 73.93, 73.5, 72.27, 72.1],
  },
  {
    symbol: 'GS',
    name: 'The Goldman Sachs Group Inc.',
    price: 580.4,
    changePercent: -2.8,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [597.14, 598.53, 596.26, 586.28, 588.87, 581.08, 580.4],
  },
  {
    symbol: 'MS',
    name: 'Morgan Stanley',
    price: 115.2,
    changePercent: -4.54,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [120.68, 120.16, 118.25, 118.09, 116.56, 117.16, 115.2],
  },
  {
    symbol: 'C',
    name: 'Citigroup Inc.',
    price: 70.3,
    changePercent: 0.98,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [69.62, 70.46, 71.11, 70.8, 71.47, 71.03, 70.3],
  },
  {
    symbol: 'AXP',
    name: 'American Express Co.',
    price: 290.1,
    changePercent: -2.64,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [297.98, 296.38, 301.81, 302.24, 297.1, 292.69, 290.1],
  },
  {
    symbol: 'SCHW',
    name: 'The Charles Schwab Corp.',
    price: 78.4,
    changePercent: 3.64,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [75.65, 74.84, 76.07, 76.77, 77.19, 77.98, 78.4],
  },
  {
    symbol: 'BLK',
    name: 'BlackRock Inc.',
    price: 950.3,
    changePercent: -4.36,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [993.65, 983.66, 985.93, 991.98, 978.81, 966.71, 950.3],
  },
  {
    symbol: 'SPGI',
    name: 'S&P Global Inc.',
    price: 480.1,
    changePercent: 0.4,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [478.17, 471.63, 475.88, 477.72, 472.07, 476.65, 480.1],
  },
  {
    symbol: 'CB',
    name: 'Chubb Ltd.',
    price: 280.2,
    changePercent: -0.28,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [281.0, 282.81, 280.91, 276.19, 272.35, 276.98, 280.2],
  },
  {
    symbol: 'PNC',
    name: 'The PNC Financial Services Group Inc.',
    price: 195.4,
    changePercent: 1.71,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [192.11, 192.99, 194.32, 191.4, 192.89, 192.18, 195.4],
  },
  {
    symbol: 'USB',
    name: 'U.S. Bancorp',
    price: 48.3,
    changePercent: 1.6,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [47.54, 48.38, 47.73, 47.9, 48.51, 48.99, 48.3],
  },
  {
    symbol: 'CAT',
    name: 'Caterpillar Inc.',
    price: 380.1,
    changePercent: -0.8,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [383.15, 380.97, 381.05, 379.28, 378.3, 376.23, 380.1],
  },
  {
    symbol: 'BA',
    name: 'The Boeing Co.',
    price: 195.4,
    changePercent: 4.48,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [187.03, 189.27, 190.2, 193.41, 190.7, 192.94, 195.4],
  },
  {
    symbol: 'HON',
    name: 'Honeywell International Inc.',
    price: 220.3,
    changePercent: 3.39,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [213.07, 215.46, 213.69, 217.33, 219.17, 218.66, 220.3],
  },
  {
    symbol: 'UPS',
    name: 'United Parcel Service Inc.',
    price: 130.1,
    changePercent: 1.13,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [128.65, 130.3, 129.22, 130.3, 130.0, 129.92, 130.1],
  },
  {
    symbol: 'RTX',
    name: 'RTX Corp.',
    price: 125.4,
    changePercent: 0.46,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [124.82, 125.32, 125.16, 124.02, 125.75, 123.91, 125.4],
  },
  {
    symbol: 'LMT',
    name: 'Lockheed Martin Corp.',
    price: 480.2,
    changePercent: -1.92,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [489.59, 494.9, 489.82, 484.27, 490.47, 482.29, 480.2],
  },
  {
    symbol: 'GE',
    name: 'GE Aerospace',
    price: 175.3,
    changePercent: 0.61,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    history: [174.24, 177.1, 174.03, 172.64, 173.9, 176.31, 175.3],
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
    return fetchAlphaVantageQuotesWithFallback(symbols);
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

// Alpha Vantage's free tier only allows 25 requests/day (5/minute). Rather than firing
// one request per symbol and blowing through that quota, we only fetch live data for the
// first ALPHA_VANTAGE_MAX_LIVE_SYMBOLS symbols (batched to stay under the per-minute cap)
// and backfill every other symbol with mock data. Live requests that fail (e.g. missing
// API key, exceeded quota) also fall back to mock data rather than dropping the row.
async function fetchAlphaVantageQuotesWithFallback(symbols: string[]): Promise<StockQuote[]> {
  const liveSymbols = symbols.slice(0, ALPHA_VANTAGE_MAX_LIVE_SYMBOLS);
  const liveQuotes = await fetchThrottledQuotes(liveSymbols, fetchAlphaVantageQuote);

  if (liveQuotes.length === 0 && liveSymbols.length > 0) {
    console.warn('Alpha Vantage returned no live quotes; falling back to mock data for all symbols.');
  }

  return mergeWithSampleRows(symbols, liveQuotes);
}

// Fetches quotes in small batches with a delay between batches so we never exceed
// Alpha Vantage's free-tier rate limit of 5 requests per minute.
async function fetchThrottledQuotes(
  symbols: string[],
  fetchQuote: (symbol: string) => Promise<StockQuote>,
): Promise<StockQuote[]> {
  const results: StockQuote[] = [];

  for (let i = 0; i < symbols.length; i += ALPHA_VANTAGE_BATCH_SIZE) {
    const batch = symbols.slice(i, i + ALPHA_VANTAGE_BATCH_SIZE);
    const settled = await Promise.allSettled(batch.map(fetchQuote));

    for (const result of settled) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }

    const isLastBatch = i + ALPHA_VANTAGE_BATCH_SIZE >= symbols.length;
    if (!isLastBatch) {
      await delay(ALPHA_VANTAGE_BATCH_DELAY_MS);
    }
  }

  return results;
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
