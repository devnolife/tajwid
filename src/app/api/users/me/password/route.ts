import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";
import { md5Hash } from "@/lib/md5";
import { z } from "zod";

const schema = z.object({
  currentPassword: z.string().min(1, "Password lama wajib diisi"),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.errors[0].message }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;
    const id = (session.user as any).id;
    const user = await storage.getUser(id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Mahasiswa pakai MD5, admin/instruktur plain text (konsisten dengan auth.ts)
    const isMahasiswa = user.role === "mahasiswa";
    const currentHashed = isMahasiswa ? md5Hash(currentPassword) : currentPassword;
    if (user.password !== currentHashed) {
      return NextResponse.json({ message: "Password lama tidak sesuai" }, { status: 400 });
    }

    const newHashed = isMahasiswa ? md5Hash(newPassword) : newPassword;
    await storage.updateUser(id, { password: newHashed } as any);

    return NextResponse.json({ message: "Password berhasil diganti" });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}
