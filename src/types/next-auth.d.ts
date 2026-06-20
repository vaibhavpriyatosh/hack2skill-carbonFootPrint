import "next-auth";
import "next-auth/jwt";

/**
 * Module augmentation for NextAuth types.
 * Extends the default User, Session, and JWT types to include
 * the `username` field used throughout the application.
 */
declare module "next-auth" {
  interface User {
    username?: string;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      name: string;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
  }
}
