import { NextAuthOptions } from "next-auth"
import type { Adapter } from "next-auth/adapters"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as unknown as Adapter,

  // Must be "jwt" when using CredentialsProvider
  // "database" strategy does not work with credentials
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn:  "/login",
    error:   "/login",  // redirect auth errors back to login page
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 1. Guard — both fields must be present
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // 2. Look up user by email, include profile for name
        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { profile: true },
        })

        // 3. No user found
        if (!user) return null

        // 4. OAuth user trying to sign in with password
        if (!user.password) return null

        // 5. Verify password against bcrypt hash
        const passwordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!passwordValid) return null

        // 6. Return user shape — becomes the JWT token payload
        return {
          id:        user.id,
          email:     user.email,
          role:      user.role,
          firstName: user.profile?.firstName ?? null,
          lastName:  user.profile?.lastName  ?? null,
        }
      },
    }),
  ],

  callbacks: {
    // Runs when JWT is created (sign in) or accessed (request)
    async jwt({ token, user }) {
      if (user) {
        // First sign in — attach custom fields to token
        token.id        = user.id
        token.role      = user.role
        token.firstName = user.firstName
        token.lastName  = user.lastName
      }
      return token
    },

    // Runs whenever session is accessed via getServerSession / useSession
    async session({ session, token }) {
      if (token) {
        session.user.id        = token.id
        session.user.role      = token.role
        session.user.firstName = token.firstName
        session.user.lastName  = token.lastName
      }
      return session
    },
  },

  // Auto-create profile when a NEW OAuth user signs in
  // (not used for credentials — profile is created in /api/register)
  events: {
    async createUser({ user }) {
      // Only runs for OAuth sign-ups (Google, GitHub, etc.)
      // Credentials users already have a profile from /api/register
      const nameParts = user.name?.split(" ") ?? []
      await db.profile.upsert({
        where:  { userId: user.id },
        create: {
          userId:    user.id,
          firstName: nameParts[0]                    ?? null,
          lastName:  nameParts.slice(1).join(" ") || null,
          avatar:    user.image                      ?? null,
        },
        update: {}, // don't overwrite if profile already exists
      })
    },
  },

  // Set to true in production
  debug: process.env.NODE_ENV === "development",
}