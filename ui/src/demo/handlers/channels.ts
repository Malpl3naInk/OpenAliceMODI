import { http, HttpResponse } from 'msw'

export const channelsHandlers = [
  http.get('/api/channels', () => HttpResponse.json({ channels: [] })),
  http.post('/api/channels', () =>
    HttpResponse.json({ channel: { id: 'demo-channel', label: 'Demo Channel' } }),
  ),
  http.put('/api/channels/:id', () =>
    HttpResponse.json({ channel: { id: 'demo-channel', label: 'Demo Channel' } }),
  ),
  http.delete('/api/channels/:id', () => new HttpResponse(null, { status: 204 })),
]
