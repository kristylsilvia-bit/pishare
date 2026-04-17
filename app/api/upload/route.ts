import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 min max for large uploads

const PI_SERVER_URL = process.env.PI_SERVER_URL;
const PI_API_KEY = process.env.PI_API_KEY;

export async function POST(request: NextRequest) {
  if (!PI_SERVER_URL || !PI_API_KEY) {
    return NextResponse.json(
      { error: 'Server not configured — set PI_SERVER_URL and PI_API_KEY in Vercel env vars.' },
      { status: 500 }
    );
  }

  // Stream the multipart body directly to the Pi instead of buffering it.
  // This lets you upload large files without hitting Vercel's memory limit.
  const contentType = request.headers.get('content-type');
  const contentLength = request.headers.get('content-length');

  try {
    const piRes = await fetch(`${PI_SERVER_URL}/upload`, {
      method: 'POST',
      headers: {
        'X-API-Key': PI_API_KEY,
        ...(contentType   && { 'Content-Type': contentType }),
        ...(contentLength && { 'Content-Length': contentLength }),
      },
      // @ts-ignore — duplex is required in Node 18+ for streaming request bodies
      duplex: 'half',
      body: request.body,
    });

    if (!piRes.ok) {
      const msg = await piRes.text().catch(() => 'Unknown error');
      console.error('[upload] Pi error:', piRes.status, msg);
      return NextResponse.json(
        { error: `Pi server returned ${piRes.status}` },
        { status: 502 }
      );
    }

    const data = await piRes.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[upload] fetch error:', err);
    return NextResponse.json(
      { error: 'Could not reach Pi server — is it running and port-forwarded?' },
      { status: 503 }
    );
  }
}
