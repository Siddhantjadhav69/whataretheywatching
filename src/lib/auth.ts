import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { isDatabaseConnectionError } from "@/lib/database-errors";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "you@example.com"
        },
        password: {
          label: "Password",
          type: "password"
        }
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user
          .findUnique({
            where: { email }
          })
          .catch((error: unknown) => {
            if (isDatabaseConnectionError(error)) {
              console.error("Database is not reachable. Start PostgreSQL on 127.0.0.1:5433 and run Prisma schema push.");
              return null;
            }

            throw error;
          });

        if (!user) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          username: user.username
        };
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        
        // Fetch additional user data from database
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            avatarUrl: true,
            bio: true
          }
        });
        
        if (user) {
          session.user.avatarUrl = user.avatarUrl;
          session.user.bio = user.bio;
        }
      }

      return session;
    }
  },
  pages: {
    signIn: "/login"
  },
  secret: process.env.NEXTAUTH_SECRET
};
