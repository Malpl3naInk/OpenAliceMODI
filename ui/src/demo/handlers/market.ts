import { http, HttpResponse } from 'msw'

export const marketHandlers = [
  http.get('/api/market/search', () => HttpResponse.json({ results: [], count: 0 })),

  http.get('/api/market-data-v1/:assetClass/price/historical', () =>
    HttpResponse.json({ results: null, provider: 'demo', error: 'Demo mode — market data is not available.' }),
  ),
  http.get('/api/market-data-v1/equity/profile', () =>
    HttpResponse.json({ results: null, provider: 'demo', error: 'Demo mode.' }),
  ),
  http.get('/api/market-data-v1/equity/price/quote', () =>
    HttpResponse.json({ results: null, provider: 'demo', error: 'Demo mode.' }),
  ),
  http.get('/api/market-data-v1/equity/fundamental/metrics', () =>
    HttpResponse.json({ results: null, provider: 'demo', error: 'Demo mode.' }),
  ),
  http.get('/api/market-data-v1/equity/fundamental/ratios', () =>
    HttpResponse.json({ results: null, provider: 'demo', error: 'Demo mode.' }),
  ),
  http.get('/api/market-data-v1/equity/fundamental/balance', () =>
    HttpResponse.json({ results: null, provider: 'demo', error: 'Demo mode.' }),
  ),
  http.get('/api/market-data-v1/equity/fundamental/income', () =>
    HttpResponse.json({ results: null, provider: 'demo', error: 'Demo mode.' }),
  ),
  http.get('/api/market-data-v1/equity/fundamental/cash', () =>
    HttpResponse.json({ results: null, provider: 'demo', error: 'Demo mode.' }),
  ),
  http.post('/api/market-data/test-provider', () => HttpResponse.json({ ok: true })),
]
