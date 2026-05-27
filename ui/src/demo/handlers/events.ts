import { http, HttpResponse } from 'msw'
import { demoEvent } from '../fixtures/events'

// SSE: emit one canned event then leave the stream open. The UI's connectSSE
// treats stream close as an error and reconnects with backoff, so we MUST NOT
// close the controller. Stage 2 will replace this with a scripted timeline.
function eventsStream(): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(demoEvent)}\n\n`))
    },
  })
  return new HttpResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

export const eventsHandlers = [
  http.get('/api/events', () =>
    HttpResponse.json({ entries: [demoEvent], total: 1, page: 1, pageSize: 50, totalPages: 1 }),
  ),
  http.get('/api/events/recent', () =>
    HttpResponse.json({ entries: [demoEvent], lastSeq: demoEvent.seq }),
  ),
  http.get('/api/events/stream', () => eventsStream()),
  http.post('/api/events/ingest', () => HttpResponse.json(demoEvent, { status: 201 })),
  http.get('/api/events/auth-status', () =>
    HttpResponse.json({ configured: false, tokenCount: 0, tokenIds: [] }),
  ),
]
