import { HERMES_API_URL, hermesAuthHeaders } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Returns the model list from the Hermes Agent (OpenAI `/v1/models` shape:
// { object: "list", data: [{ id, ... }] }).
export async function GET() {
  try {
    const res = await fetch(`${HERMES_API_URL}/v1/models`, {
      headers: hermesAuthHeaders(),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json(
      { object: 'list', data: [], error: 'Could not reach Hermes API.' },
      { status: 502 },
    );
  }
}
