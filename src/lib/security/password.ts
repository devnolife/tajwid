import {
  createHash,
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";
import { md5Hash } from "@/lib/md5";

export type PasswordRole = "mahasiswa" | "instruktur" | "admin";

export interface PasswordVerification {
  valid: boolean;
  needsRehash: boolean;
}

const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const MAX_MEMORY = 64 * 1024 * 1024;

function scrypt(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: { N: number; r: number; p: number; maxmem: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey);
    });
  });
}

function constantTimeStringEqual(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: MAX_MEMORY,
  });

  return [
    "scrypt",
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
}

async function verifyScryptPassword(
  password: string,
  encoded: string,
): Promise<PasswordVerification> {
  const parts = encoded.split("$");
  if (parts.length !== 6) {
    return { valid: false, needsRehash: false };
  }

  const [, nValue, rValue, pValue, saltValue, hashValue] = parts;
  const N = Number(nValue);
  const r = Number(rValue);
  const p = Number(pValue);

  if (
    !Number.isSafeInteger(N) ||
    !Number.isSafeInteger(r) ||
    !Number.isSafeInteger(p) ||
    N <= 1 ||
    r <= 0 ||
    p <= 0
  ) {
    return { valid: false, needsRehash: false };
  }

  try {
    const salt = Buffer.from(saltValue, "base64url");
    const expected = Buffer.from(hashValue, "base64url");
    if (salt.length < 16 || expected.length !== KEY_LENGTH) {
      return { valid: false, needsRehash: false };
    }

    const actual = await scrypt(password, salt, expected.length, {
      N,
      r,
      p,
      maxmem: MAX_MEMORY,
    });

    return {
      valid: timingSafeEqual(actual, expected),
      needsRehash: N !== SCRYPT_N || r !== SCRYPT_R || p !== SCRYPT_P,
    };
  } catch {
    return { valid: false, needsRehash: false };
  }
}

export async function verifyPassword(
  password: string,
  storedPassword: string,
  role: PasswordRole,
): Promise<PasswordVerification> {
  if (storedPassword.startsWith("scrypt$")) {
    return verifyScryptPassword(password, storedPassword);
  }

  if (role === "mahasiswa" && /^[a-f\d]{32}$/i.test(storedPassword)) {
    return {
      valid: constantTimeStringEqual(md5Hash(password), storedPassword),
      needsRehash: true,
    };
  }

  return {
    valid: constantTimeStringEqual(password, storedPassword),
    needsRehash: true,
  };
}

export async function verifyAndUpgradePassword(
  password: string,
  storedPassword: string,
  role: PasswordRole,
  savePassword: (encodedPassword: string) => Promise<unknown>,
): Promise<boolean> {
  const verification = await verifyPassword(password, storedPassword, role);
  if (!verification.valid) {
    return false;
  }

  if (verification.needsRehash) {
    await savePassword(await hashPassword(password));
  }

  return true;
}
