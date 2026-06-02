import { NextRequest } from 'next/server';
import { HERMES_API_URL, hermesAuthHeaders } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Allow long-lived streamed completions on Vercel.
export const maxDuration = 300;

// Proxies the chat request straight through to the Hermes Agent's
// OpenAI-compatible endpoint and streams the response back to the browser.
export async function POST(req: NextRequest) {
  const body = await req.text();

  let upstream: Response;
  try {
    upstream = await fetch(`${HERMES_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...hermesAuthHeaders() },
      body,
      // @ts-expect-error — Node fetch streaming bodies require this flag.
      duplex: 'half',
    });
  } catch {
    return Response.json(
      { error: 'Could not reach Hermes API. Is the agent running and reachable?' },
      { status: 502 },
    );
  }

  // Pipe the upstream stream (SSE) straight back to the client untouched.
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type':
        upstream.headers.get('Content-Type') || 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
