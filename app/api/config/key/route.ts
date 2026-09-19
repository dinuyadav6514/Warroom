import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function testGeminiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
        generationConfig: { maxOutputTokens: 5 },
      }),
      signal: AbortSignal.timeout(9000),
    });
    if (res.ok) {
      return { valid: true };
    }
    const raw = await res.text();
    let errorMsg = `Google API rejected key (HTTP ${res.status})`;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.error?.message) {
        errorMsg = parsed.error.message;
      }
    } catch {}
    return { valid: false, error: errorMsg };
  } catch {
    // On network timeout/error, do not block the user
    return { valid: true };
  }
}

export async function GET() {
  // Key is stored in the user's browser (localStorage), not on the server.
  // This endpoint exists only for compatibility — key status is managed client-side.
  return NextResponse.json({
    configured: false,
    provider: 'GEMINI',
    status: 'CLIENT_MANAGED',
    message: 'API key is stored in your browser. Use the [AI TERMINAL KEY] button to configure it.',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'A valid Gemini API key is required.' },
        { status: 400 }
      );
    }

    const cleanKey = apiKey.trim();

    // Validate key with Google AI Studio API
    const validation = await testGeminiKey(cleanKey);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: `Google API rejected this key: "${validation.error}". Gemini keys start with "AIzaSy..." and can be generated for free at https://aistudio.google.com/app/apikey.`,
        },
        { status: 400 }
      );
    }

    // Key is valid — the browser will store it in localStorage.
    // We do NOT store it server-side so each user's key stays private.
    return NextResponse.json({
      success: true,
      message: 'Gemini API key validated successfully. Saving to your browser.',
      status: 'API-LIVE',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to validate API key';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
