import { HERMES_API_URL } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lightweight reachability probe for the connection dot + offline banner.
export async function GET() {
  try {
    const res = await fetch(`${HERMES_API_URL}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // /health may return plain text; that's fine.
      body = null;
    }

    return Response.json(
      { ok: res.ok, status: res.status, body },
      { status: res.ok ? 200 : 502 },
    );
  } catch {
    return Response.json({ ok: false, status: 0 }, { status: 502 });
  }
}
