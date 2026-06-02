import { NextRequest } from 'next/server';
import { HERMES_CONFIG_URL, HERMES_CONFIG_KEY } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Reads ~/.hermes/config.yaml via the Pi's config server and returns it as text.
export async function GET() {
  try {
    const res = await fetch(`${HERMES_CONFIG_URL}/config`, {
      headers: { 'x-api-key': HERMES_CONFIG_KEY },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch {
    return Response.json(
      { error: 'Could not reach the Hermes config server on the Pi.' },
      { status: 502 },
    );
  }
}

// Writes the edited YAML back to ~/.hermes/config.yaml via the Pi's config server.
export async function POST(req: NextRequest) {
  const yaml = await req.text();
  try {
    const res = await fetch(`${HERMES_CONFIG_URL}/config`, {
      method: 'POST',
      headers: {
        'x-api-key': HERMES_CONFIG_KEY,
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body: yaml,
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch {
    return Response.json(
      { error: 'Could not reach the Hermes config server on the Pi.' },
      { status: 502 },
    );
  }
}
