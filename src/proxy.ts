import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth: proxy } = NextAuth(authConfig);

export const config = {
  // Protect all routes except auth APIs, static files, and images
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
