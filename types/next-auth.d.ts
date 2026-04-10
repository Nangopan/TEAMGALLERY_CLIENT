import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      organization_id: string;
      token: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    organization_id: string;
    token: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    organization_id: string;
    accessToken: string;
  }
}