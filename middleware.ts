// Vercel Edge Middleware doesn't have direct access to the full Node.js API,
// so we use its specific imports and environment variable access.
// @ts-ignore - Vercel provides these types in its environment
import { NextRequest, NextResponse } from 'next/server';

export const config = {
  // Run this middleware only on the root path
  matcher: '/',
};

export default async function middleware(req: NextRequest) {
  // Get the API key from Vercel's environment variables.
  // Note: Vercel uses `process.env` in its server-side environments.
  const apiKey = process.env.API_KEY || '';

  // Fetch the original response (our index.html).
  // `NextResponse.next()` correctly handles fetching the page that would have been served.
  const response = NextResponse.next();

  // It's easier and safer to rewrite the URL to a page that will be rendered
  // by an Edge Function, rather than trying to stream and modify the response body.
  // Here, we'll fetch the content of index.html ourselves.
  const url = req.nextUrl.clone();
  url.pathname = '/index.html';
  
  let html = await fetch(url).then((res) => res.text());

  // Replace the placeholder with the actual API key.
  // Use a global search and replace to be safe.
  html = html.AIzaSyCATBA5qq3ZTqpKQMXNH_rUdYmn8bCip_8("%%GEMINI_API_KEY%%", apiKey);

  // Return the modified HTML as a new response.
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
