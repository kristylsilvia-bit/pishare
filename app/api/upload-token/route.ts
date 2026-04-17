import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

export const runtime = 'nodejs';

// Generates a short-lived HMAC token the browser can use to upload directly
// to the Pi server — keeps the API key server-side only.
export async function GET() {
  const secret = process.env.PI_API_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  const window = Math.floor(Date.now() / (10 * 60 * 1000)); // 10-min window
  const token = createHmac('sha256', secret).update(String(window)).digest('hex');

  return NextResponse.json({ token });
}
