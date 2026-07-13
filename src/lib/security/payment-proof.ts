import {
  chmod,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_PROOF_SIZE = 5 * 1024 * 1024;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface PaymentProofType {
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  extension: "jpg" | "png" | "webp" | "pdf";
}

export interface StoredPaymentProof extends PaymentProofType {
  path: string;
  size: number;
}

function startsWith(buffer: Buffer, signature: number[]): boolean {
  return (
    buffer.length >= signature.length &&
    signature.every((byte, index) => buffer[index] === byte)
  );
}

export function detectPaymentProofType(
  buffer: Buffer,
): PaymentProofType | null {
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) {
    return { mimeType: "image/jpeg", extension: "jpg" };
  }
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mimeType: "image/png", extension: "png" };
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { mimeType: "image/webp", extension: "webp" };
  }
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
    return { mimeType: "application/pdf", extension: "pdf" };
  }
  return null;
}

export function getPaymentProofRoot(
  environment: NodeJS.ProcessEnv = process.env,
): string {
  const configured = environment.PAYMENT_PROOF_DIR?.trim();
  return path.resolve(configured || path.join(process.cwd(), ".data", "payment-proofs"));
}

export function getPaymentProofPath(root: string, paymentId: string): string {
  if (!UUID_PATTERN.test(paymentId)) {
    throw new Error("Payment ID tidak valid");
  }
  return path.join(path.resolve(root), `${paymentId}.proof`);
}

export async function writePaymentProof(
  root: string,
  paymentId: string,
  bytes: Buffer,
): Promise<StoredPaymentProof> {
  if (bytes.length === 0) {
    throw new Error("File kosong");
  }
  if (bytes.length > MAX_PROOF_SIZE) {
    throw new Error("Ukuran file maksimal 5MB");
  }
  const type = detectPaymentProofType(bytes);
  if (!type) {
    throw new Error("Tipe file tidak didukung");
  }

  const target = getPaymentProofPath(root, paymentId);
  const temporary = `${target}.${randomUUID()}.tmp`;
  await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
  try {
    await writeFile(temporary, bytes, { flag: "wx", mode: 0o600 });
    await rename(temporary, target);
    await chmod(target, 0o600);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }

  return { path: target, ...type, size: bytes.length };
}

export function readPaymentProof(root: string, paymentId: string): Promise<Buffer> {
  return readFile(getPaymentProofPath(root, paymentId));
}

export function deletePaymentProof(root: string, paymentId: string): Promise<void> {
  return rm(getPaymentProofPath(root, paymentId), { force: true });
}
