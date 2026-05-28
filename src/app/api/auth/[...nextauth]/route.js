import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "MaaSantoshi" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing username or password");
        }

        const user = await prisma.user.findUnique({
          where: {
            username: credentials.username
          }
        });

        if (!user || !user.isActive) {
          throw new Error("Invalid username or deactivated account");
        }

        const isValidPassword = bcrypt.compareSync(credentials.password, user.passwordHash);

        if (!isValidPassword) {
          throw new Error("Incorrect password");
        }

        // Return user details including role
        return {
          id: user.id,
          name: user.name,
          email: user.username, // Using email field to map username in NextAuth session
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.username = token.email; // Map back email to username
      }
      return session;
    }
  },
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours session
  },
  secret: process.env.NEXTAUTH_SECRET || "msigv-operations-secure-ledger-secret-717",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
