import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      organization_id: string;
      token: string; // This fixes the error in your Edit page!
    } & DefaultSession["user"];
  }
}