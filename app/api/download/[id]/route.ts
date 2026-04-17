import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const PI_SERVER_URL = process.env.PI_SERVER_URL;
const PI_API_KEY = process.env.PI_API_KEY;

// This route redirects the browser to the Pi's direct download endpoint.
// The file bytes stream straight from your Pi → browser without passing through Vercel,
// so there's no Vercel bandwidth limit or response-size cap on downloads.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!PI_SERVER_URL) {
    return NextResponse.json({ error: 'PI_SERVER_URL not set' }, { status: 500 });
  }

  // Verify the file actually exists before redirecting (returns 404 cleanly)
  try {
    const check = await fetch(`${PI_SERVER_URL}/file/${params.id}`, {
      headers: { 'X-API-Key': PI_API_KEY ?? '' },
      cache: 'no-store',
    });

    if (check.status === 404) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: 'Could not reach Pi server' }, { status: 503 });
  }

  // 302 redirect → Pi serves the file bytes directly to the browser
  return NextResponse.redirect(`${PI_SERVER_URL}/download/${params.id}`, 302);
}
