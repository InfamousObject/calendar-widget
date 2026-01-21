export function GET() {
  const robotsTxt = `
User-agent: *
Allow: /

# AI Search Bots - Explicitly allowed for GEO (Generative Engine Optimization)
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# Disallow private/authenticated areas
User-agent: *
Disallow: /dashboard
Disallow: /api/
Disallow: /auth/

Sitemap: https://www.kentroi.com/sitemap.xml
  `.trim();

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
