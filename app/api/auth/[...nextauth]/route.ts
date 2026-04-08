import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "admin@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("🚀 NextAuth is attempting to call the backend...");
        try {
          const res = await fetch("http://localhost:4000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password,
            }),
          });

          console.log("📥 Backend responded with status:", res.status);
          const user = await res.json();

          if (res.ok && user) {
            return user;
          }
          console.log("❌ Backend rejected login:", user);
          return null;
        } catch (error) {
          console.error("💥 CRITICAL FETCH ERROR IN NEXTAUTH:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    // 1. Take data from backend and put it into the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organization_id = user.organization_id;
        token.accessToken = user.token; 
    }
      return token;
    },
    // 2. Take data from the JWT token and expose it to the Next.js session
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organization_id = token.organization_id as string;
         session.user.accessToken = token.accessToken as string; 
    }
      return session;
    }
  },
  pages: {
    signIn: '/login', // Tells NextAuth to use our custom ShadCN login page
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };