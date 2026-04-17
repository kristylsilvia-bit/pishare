import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const PI_SERVER_URL = process.env.PI_SERVER_URL;
const PI_API_KEY = process.env.PI_API_KEY;

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!PI_SERVER_URL) {
    return NextResponse.json({ error: 'PI_SERVER_URL not set' }, { status: 500 });
  }

  try {
    const piRes = await fetch(`${PI_SERVER_URL}/file/${params.id}`, {
      headers: { 'X-API-Key': PI_API_KEY ?? '' },
      cache: 'no-store',
    });

    if (piRes.status === 404) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (!piRes.ok) {
      return NextResponse.json({ error: 'Pi server error' }, { status: 502 });
    }

    const data = await piRes.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Could not reach Pi server' }, { status: 503 });
  }
}
