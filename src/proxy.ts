import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Bail out gracefully if AUTH_SECRET is not configured
  if (!process.env.AUTH_SECRET) {
    console.error("AUTH_SECRET is not set — skipping auth proxy");
    return NextResponse.next();
  }

  try {
    const { default: NextAuth } = await import("next-auth");
    const { authConfig } = await import("./auth.config");
    const handler = NextAuth(authConfig).auth as unknown as (req: NextRequest) => Promise<Response | undefined>;
    const result = await handler(request);
    return result ?? NextResponse.next();
  } catch (err) {
    console.error("Proxy auth error:", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png$|.*\\.ico$|.*\\.svg$).*)',
  ],
};
