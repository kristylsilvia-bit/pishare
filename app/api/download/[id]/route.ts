import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

const PI_SERVER_URL = process.env.PI_SERVER_URL;
const PI_API_KEY = process.env.PI_API_KEY;

// Streams the file directly from the Pi to the browser.
// This works on all devices including Meta Quest, which blocks HTTP redirects.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!PI_SERVER_URL) {
    return NextResponse.json({ error: 'PI_SERVER_URL not set' }, { status: 500 });
  }

  // Get file metadata first
  let fileInfo: { name: string; size: number; mimeType: string } | null = null;
  try {
    const infoRes = await fetch(`${PI_SERVER_URL}/file/${params.id}`, {
      headers: { 'X-API-Key': PI_API_KEY ?? '' },
      cache: 'no-store',
    });
    if (infoRes.status === 404) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    if (infoRes.ok) fileInfo = await infoRes.json();
  } catch {
    return NextResponse.json({ error: 'Could not reach Pi server' }, { status: 503 });
  }

  // Stream the file from Pi → Vercel → browser
  try {
    const piRes = await fetch(`${PI_SERVER_URL}/download/${params.id}`, {
      headers: { 'X-API-Key': PI_API_KEY ?? '' },
    });

    if (!piRes.ok || !piRes.body) {
      return NextResponse.json({ error: 'Failed to fetch file from Pi' }, { status: 502 });
    }

    const fileName = fileInfo?.name ?? 'download';
    const mimeType = fileInfo?.mimeType ?? 'application/octet-stream';
    const safeName = encodeURIComponent(fileName).replace(/%20/g, ' ');

    return new NextResponse(piRes.body, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename*=UTF-8''${safeName}`,
        ...(fileInfo?.size ? { 'Content-Length': String(fileInfo.size) } : {}),
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Download failed' }, { status: 503 });
  }
}
