import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

const PI_SERVER_URL = process.env.PI_SERVER_URL;
const PI_API_KEY = process.env.PI_API_KEY;

// Forwards each chunk from the browser to the Pi server.
// Browser → Vercel (HTTPS) → Pi (HTTP on local network via port forwarding).
// Each chunk is 4 MB so it stays well under Vercel's body size limit.
export async function POST(request: NextRequest) {
  if (!PI_SERVER_URL || !PI_API_KEY) {
    return NextResponse.json(
      { error: 'Server not configured — set PI_SERVER_URL and PI_API_KEY in Vercel env vars.' },
      { status: 500 }
    );
  }

  const contentType = request.headers.get('content-type');

  try {
    const piRes = await fetch(`${PI_SERVER_URL}/upload/chunk`, {
      method: 'POST',
      headers: {
        'X-API-Key': PI_API_KEY,
        ...(contentType && { 'Content-Type': contentType }),
      },
      // @ts-ignore
      duplex: 'half',
      body: request.body,
    });

    if (!piRes.ok) {
      const msg = await piRes.text().catch(() => 'Unknown error');
      console.error('[upload] Pi error:', piRes.status, msg);
      return NextResponse.json({ error: `Pi server returned ${piRes.status}` }, { status: 502 });
    }

    const data = await piRes.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[upload] fetch error:', err);
    return NextResponse.json(
      { error: 'Could not reach Pi server — is it running?' },
      { status: 503 }
    );
  }
}
