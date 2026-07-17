import { createHash, timingSafeEqual } from "node:crypto";

type Environment = Record<string, string | undefined>;

export function getCertificateIntegrationKey(
  environment: Environment = process.env,
): string | null {
  const key = environment.CERTIFICATE_API_KEY?.trim();
  if (!key) return null;
  if (key.length < 32) {
    throw new Error("CERTIFICATE_API_KEY minimal 32 karakter");
  }
  return key;
}

export function isValidIntegrationKey(
  candidate: string | null,
  configuredKey: string,
): boolean {
  if (!candidate) return false;
  const candidateDigest = createHash("sha256").update(candidate).digest();
  const configuredDigest = createHash("sha256").update(configuredKey).digest();
  return timingSafeEqual(candidateDigest, configuredDigest);
}
