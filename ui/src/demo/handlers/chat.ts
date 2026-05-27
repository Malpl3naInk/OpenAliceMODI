import { http, HttpResponse } from 'msw'

// POST /api/chat returns SSE-shaped stream. Final event is `done`, after
// which we close the controller (UI's reader loop exits on `done`).
function chatPostStream(): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const text = 'Hello from demo mode — chat is a static stub here. Stage 2 will replace this with a scripted reply.'
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'stream', event: { type: 'text', text } })}\n\n`),
      )
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'done', text, media: [] })}\n\n`),
      )
      controller.close()
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

// GET /api/chat/events — legacy inbound notification channel. Stays open idle.
function chatEventsStream(): Response {
  const stream = new ReadableStream({
    start() {
      // no initial event; stay open
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

export const chatHandlers = [
  http.post('/api/chat', () => chatPostStream()),
  http.get('/api/chat/events', () => chatEventsStream()),
  http.get('/api/chat/history', () => HttpResponse.json({ messages: [], hasMore: false })),
]
