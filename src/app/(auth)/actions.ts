"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma/client";
import { hash } from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username too long"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function signup(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  
  const validatedFields = signupSchema.safeParse(data);
  
  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message };
  }
  
  const { name, username, password } = validatedFields.data;
  
  try {
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    
    if (existingUser) {
      return { error: "Username is already taken." };
    }
    
    const passwordHash = await hash(password, 10);
    
    await prisma.user.create({
      data: {
        name,
        username,
        passwordHash,
      }
    });
    
  } catch (error) {
    return { error: "Something went wrong. Please try again." };
  }
  
  redirect("/login?registered=true");
}

export async function authenticate(prevState: any, formData: FormData) {
  try {
    // NextAuth throws a redirect error on success, which we must rethrow
    await signIn("credentials", Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid username or password." };
        default:
          return { error: "Something went wrong." };
      }
    }
    // Must re-throw Next.js redirect errors so navigation works
    throw error;
  }
}
