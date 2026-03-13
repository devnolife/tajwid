import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@shared/schema";
import { storage } from "@/lib/db/storage";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { username, password, role } = parsed.data;
        const user = await storage.getUserByUsername(username);

        if (!user || user.password !== password || user.role !== role) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          username: user.username,
          nim: user.nim,
          faculty: user.faculty,
          program: user.program,
          phone: user.phone,
          specialization: user.specialization,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.username = (user as any).username;
        token.nim = (user as any).nim;
        token.faculty = (user as any).faculty;
        token.program = (user as any).program;
        token.phone = (user as any).phone;
        token.specialization = (user as any).specialization;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).username = token.username as string;
        (session.user as any).nim = token.nim as string | null;
        (session.user as any).faculty = token.faculty as string | null;
        (session.user as any).program = token.program as string | null;
        (session.user as any).phone = token.phone as string | null;
        (session.user as any).specialization = token.specialization as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "mengaji-secret-key",
});
