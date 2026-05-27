import { http, HttpResponse } from 'msw'
import {
  demoTradingAccount,
  demoUTASummary,
  demoAccountInfo,
  demoUTAConfig,
  DEMO_UTA_ID,
} from '../fixtures/trading'

export const tradingHandlers = [
  http.get('/api/trading/uta', () =>
    HttpResponse.json({
      utas: [demoTradingAccount],
      summaries: [demoUTASummary],
    }),
  ),

  http.get('/api/trading/equity', () =>
    HttpResponse.json({
      totalEquity: '10000.00',
      totalCash: '10000.00',
      totalUnrealizedPnL: '0.00',
      totalRealizedPnL: '0.00',
      accounts: [
        { id: DEMO_UTA_ID, label: 'Demo Paper Account', equity: '10000.00', cash: '10000.00' },
      ],
    }),
  ),

  http.get('/api/trading/fx-rates', () => HttpResponse.json({ rates: [] })),

  http.post('/api/trading/uta/:id/reconnect', () =>
    HttpResponse.json({ success: true, message: 'Demo mode — reconnect is a no-op.' }),
  ),

  http.get('/api/trading/uta/:id/account', () => HttpResponse.json(demoAccountInfo)),
  http.get('/api/trading/uta/:id/positions', () => HttpResponse.json({ positions: [] })),
  http.get('/api/trading/uta/:id/orders', () => HttpResponse.json({ orders: [] })),
  http.get('/api/trading/uta/:id/market-clock', () =>
    HttpResponse.json({
      isOpen: false,
      nextOpen: new Date(Date.now() + 3600_000).toISOString(),
      nextClose: new Date(Date.now() + 7 * 3600_000).toISOString(),
    }),
  ),

  http.get('/api/trading/uta/:id/wallet/status', () =>
    HttpResponse.json({ staged: [], pendingMessage: null, head: null, commitCount: 0 }),
  ),
  http.get('/api/trading/uta/:id/wallet/log', () => HttpResponse.json({ commits: [] })),
  http.get('/api/trading/uta/:id/wallet/show/:hash', () =>
    HttpResponse.json({ error: 'not found' }, { status: 404 }),
  ),
  http.post('/api/trading/uta/:id/wallet/reject', () =>
    HttpResponse.json({ hash: 'demo', message: 'rejected', operationCount: 0 }),
  ),
  http.post('/api/trading/uta/:id/wallet/push', () =>
    HttpResponse.json({
      hash: 'demo',
      message: 'demo push',
      operationCount: 0,
      submitted: [],
      rejected: [],
    }),
  ),
  http.post('/api/trading/uta/:id/wallet/place-order', () =>
    HttpResponse.json(
      { error: 'Demo mode — orders are read-only.', phase: 'validate' },
      { status: 400 },
    ),
  ),
  http.post('/api/trading/uta/:id/wallet/close-position', () =>
    HttpResponse.json(
      { error: 'Demo mode — orders are read-only.', phase: 'validate' },
      { status: 400 },
    ),
  ),
  http.post('/api/trading/uta/:id/wallet/cancel-order', () =>
    HttpResponse.json(
      { error: 'Demo mode — orders are read-only.', phase: 'validate' },
      { status: 400 },
    ),
  ),

  http.get('/api/trading/config/broker-presets', () => HttpResponse.json({ presets: [] })),
  http.get('/api/trading/config', () => HttpResponse.json({ utas: [demoUTAConfig] })),
  http.post('/api/trading/config/uta', () => HttpResponse.json(demoUTAConfig, { status: 201 })),
  http.put('/api/trading/config/uta/:id', () => HttpResponse.json(demoUTAConfig)),
  http.delete('/api/trading/config/uta/:id', () => HttpResponse.json({ ok: true })),
  http.post('/api/trading/config/test-connection', () =>
    HttpResponse.json({ success: true, account: demoAccountInfo }),
  ),

  http.get('/api/trading/uta/:id/snapshots', () => HttpResponse.json({ snapshots: [] })),
  http.delete('/api/trading/uta/:id/snapshots/:timestamp', () =>
    HttpResponse.json({ success: true }),
  ),
  http.get('/api/trading/snapshots/equity-curve', () => HttpResponse.json({ points: [] })),

  http.get('/api/trading/contracts/search', () =>
    HttpResponse.json({ results: [], count: 0, utasConfigured: 1 }),
  ),
]
