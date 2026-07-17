type Environment = Record<string, string | undefined>;

export interface AdminSeedConfig {
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string | null;
}

export function getAdminSeedConfig(
  environment: Environment = process.env,
): AdminSeedConfig {
  const password = environment.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD wajib dikonfigurasi");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD minimal 12 karakter");
  }

  return {
    username: environment.ADMIN_USERNAME?.trim() || "admin",
    password,
    name: environment.ADMIN_NAME?.trim() || "Administrator Sistem",
    email: environment.ADMIN_EMAIL?.trim() || "admin@tajwid.local",
    phone: environment.ADMIN_PHONE?.trim() || null,
  };
}
