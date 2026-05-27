import { http, HttpResponse } from 'msw'

export const notificationsNewsHandlers = [
  http.get('/api/notifications/history', () => HttpResponse.json({ entries: [], hasMore: false })),
  http.get('/api/news', () => HttpResponse.json({ items: [], count: 0, lookback: '24h' })),
]
