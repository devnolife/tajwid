import { db } from "@/lib/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/security/password";

/**
 * Seed (atau update) akun admin secara idempotent.
 *
 * Konfigurasi via env (semua opsional, ada default):
 *   ADMIN_USERNAME  (default: "admin")
 *   ADMIN_PASSWORD  (default: "admin123")
 *   ADMIN_NAME      (default: "Administrator Sistem")
 *   ADMIN_EMAIL     (default: "admin@tajwid.local")
 *   ADMIN_PHONE     (opsional)
 *
 * Password selalu disimpan sebagai salted scrypt hash.
 */
export async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const name = process.env.ADMIN_NAME ?? "Administrator Sistem";
  const email = process.env.ADMIN_EMAIL ?? "admin@tajwid.local";
  const phone = process.env.ADMIN_PHONE ?? null;
  const encodedPassword = await hashPassword(password);

  const existing = await db.select().from(users).where(eq(users.username, username));

  if (existing.length > 0) {
    await db
      .update(users)
      .set({ password: encodedPassword, name, email, phone, role: "admin" })
      .where(eq(users.username, username));
    console.log(`✓ Admin "${username}" sudah ada — credential & profil di-update.`);
  } else {
    await db.insert(users).values({
      username,
      password: encodedPassword,
      role: "admin",
      name,
      email,
      phone,
    });
    console.log(`✓ Admin "${username}" berhasil dibuat.`);
  }

  console.log("---------------------------------------------");
  console.log(" Akun Admin");
  console.log(`  Username : ${username}`);
  console.log(`  Nama     : ${name}`);
  console.log(`  Email    : ${email}`);
  console.log("---------------------------------------------");
}

const isDirectRun =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  /seed-admin\.(ts|js)$/.test(process.argv[1]);

if (isDirectRun) {
  seedAdmin()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("✗ Seed admin gagal:", err);
      process.exit(1);
    });
}
