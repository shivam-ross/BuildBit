import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from "next-auth/providers/github"
import { NextAuthOptions } from 'next-auth';
import { prisma } from './db';
import { PrismaClient } from '@prisma/client';


export const NEXT_AUTH_CONFIG: NextAuthOptions = {
    adapter: PrismaAdapter(prisma as unknown as PrismaClient),
    session: {
      strategy: "jwt"
    },
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      })
      
    ],
    callbacks: {
      jwt: async ({ user, token }) => {
        if (user) {
          token.id = user.id;
        }
        return token;
      },
      session: async ({ session, token }) => {
        if (token?.id) {
          session.user.id = token.id;
        }
        return session;
      }
    },
    
}