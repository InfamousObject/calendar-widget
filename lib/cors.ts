/**
 * CORS utility for embed API routes.
 * These routes are called cross-origin by public/embed.js running on customer websites.
 */

export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

/** Preflight OPTIONS handler — re-export from any route that needs CORS. */
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
