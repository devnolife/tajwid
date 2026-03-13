import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      username: string;
      nim?: string | null;
      faculty?: string | null;
      program?: string | null;
      phone?: string | null;
      specialization?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    username: string;
    nim?: string | null;
    faculty?: string | null;
    program?: string | null;
    phone?: string | null;
    specialization?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    username: string;
    nim?: string | null;
    faculty?: string | null;
    program?: string | null;
    phone?: string | null;
    specialization?: string | null;
  }
}
