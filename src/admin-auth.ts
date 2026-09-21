import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Separate instance from src/auth.ts: own cookie, own table, so a site user can never be an admin.
export const {
  signIn: adminSignIn,
  signOut: adminSignOut,
  auth: adminAuth,
} = NextAuth({
  basePath: "/api/admin-auth",
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: "admin.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    session: ({ session, token }) => {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin) {
          return null;
        }

        const passwordValid = await bcrypt.compare(password, admin.passwordHash);
        if (!passwordValid) {
          return null;
        }

        return { id: admin.id, email: admin.email };
      },
    }),
  ],
});
