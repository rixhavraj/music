import { NextRequest, NextResponse } from "next/server";

// BACKEND is the URL of the persistent Express service. Vercel cannot reach
// a localhost process from a serverless function, so fail clearly in
// production instead of silently proxying to 127.0.0.1.
const BACKEND_URL =
  process.env.BACKEND ||
  process.env.BACKEND_URL ||
  // Production backend currently hosted on Render. Keep the environment
  // variable override so the service can be moved without a frontend change.
  "https://music-dqpp.onrender.com";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handleProxy(req: NextRequest) {
  try {
    if (!BACKEND_URL) {
      console.error("Missing BACKEND environment variable for API proxy");
      return NextResponse.json(
        { error: "Backend is not configured. Set BACKEND to the deployed backend URL." },
        { status: 503 }
      );
    }

    const url = new URL(req.url);
    // The catch-all route is mounted below /api. Keep the original path so
    // Express receives /api/... (the backend router is mounted at /api).
    const backendPath = `${url.pathname}${url.search}`;
    
    const targetUrl = new URL(
      backendPath,
      BACKEND_URL.endsWith("/") ? BACKEND_URL : `${BACKEND_URL}/`
    );

    const headers = new Headers(req.headers);
    headers.delete("host"); // Let the fetch client handle the host header
    headers.delete("connection");
    headers.delete("content-length");

    const fetchOptions: RequestInit & { duplex?: "half" } = {
      method: req.method,
      headers,
      redirect: "manual",
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      fetchOptions.body = req.body;
      // Note: Duplex is required for streaming bodies in Node.js fetch
      fetchOptions.duplex = "half";
    }

    const response = await fetch(targetUrl.toString(), fetchOptions);

    const responseHeaders = new Headers(response.headers);
    // Remove headers that might cause issues when proxying
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("transfer-encoding");

    // These headers are required for seeking and for Web Audio consumers of
    // the proxied stream. They are safe to expose because this is same-origin
    // with the Next.js app.
    if (response.headers.has("accept-ranges")) {
      responseHeaders.set("Accept-Ranges", response.headers.get("accept-ranges")!);
    }

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("API Proxy Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error (Proxy)" },
      { status: 500 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
export const OPTIONS = handleProxy;
