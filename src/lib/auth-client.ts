"use client";

import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { queryClient } from "./queryClient";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user ? {
    id: (session.user as any).id,
    username: (session.user as any).username,
    role: (session.user as any).role,
    name: session.user.name,
    email: session.user.email,
    nim: (session.user as any).nim,
    faculty: (session.user as any).faculty,
    program: (session.user as any).program,
    phone: (session.user as any).phone,
    specialization: (session.user as any).specialization,
  } : null;

  const login = async (username: string, password: string, role: string) => {
    const result = await nextAuthSignIn("credentials", {
      username,
      password,
      role,
      redirect: false,
    });

    if (result?.error) {
      throw new Error("Username atau password salah");
    }

    router.push(`/${role}/dashboard`);
    router.refresh();
  };

  const logout = async () => {
    queryClient.clear();
    await nextAuthSignOut({ redirectTo: "/login" });
  };

  return {
    user,
    loading: status === "loading",
    login,
    logout,
  };
}
