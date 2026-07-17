import { db } from "@/lib/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/security/password";
import { getAdminSeedConfig } from "@/lib/db/seed-admin-config";

/**
 * Seed (atau update) akun admin secara idempotent.
 *
 * Konfigurasi via env:
 *   ADMIN_USERNAME  (default: "admin")
 *   ADMIN_PASSWORD  (wajib, minimal 12 karakter)
 *   ADMIN_NAME      (default: "Administrator Sistem")
 *   ADMIN_EMAIL     (default: "admin@tajwid.local")
 *   ADMIN_PHONE     (opsional)
 *
 * Password selalu disimpan sebagai salted scrypt hash.
 */
export async function seedAdmin() {
  const { username, password, name, email, phone } = getAdminSeedConfig();
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
