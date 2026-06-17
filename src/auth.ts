import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma/client";
import { compare } from "bcryptjs";
import { z } from "zod";

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ username: z.string().min(3), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { username, password } = parsedCredentials.data;
          
          const user = await prisma.user.findUnique({ 
            where: { username } 
          });
          
          if (!user) return null;
          
          const passwordsMatch = await compare(password, user.passwordHash);

          if (passwordsMatch) {
            return {
              id: user.id,
              username: user.username,
              name: user.name,
            };
          }
        }

        return null;
      },
    }),
  ],
});
