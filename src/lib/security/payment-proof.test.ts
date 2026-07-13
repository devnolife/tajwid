import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  detectPaymentProofType,
  getPaymentProofPath,
  writePaymentProof,
} from "@/lib/security/payment-proof";

const temporaryDirectories: string[] = [];

async function temporaryDirectory() {
  const directory = await mkdtemp(path.join(tmpdir(), "tajwid-proof-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("private payment proof storage", () => {
  it("detects supported content from magic bytes instead of metadata", () => {
    expect(
      detectPaymentProofType(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toEqual({ mimeType: "image/png", extension: "png" });
    expect(
      detectPaymentProofType(Buffer.from("<html><script>alert(1)</script>")),
    ).toBeNull();
  });

  it("accepts only UUID payment identifiers for storage paths", () => {
    const root = "/private/proofs";
    expect(
      getPaymentProofPath(
        root,
        "4a329697-1de5-4099-9898-1d9dc34e6810",
      ),
    ).toBe(
      "/private/proofs/4a329697-1de5-4099-9898-1d9dc34e6810.proof",
    );
    expect(() => getPaymentProofPath(root, "../../public/payload.html")).toThrow(
      "Payment ID tidak valid",
    );
  });

  it("writes proof bytes privately and atomically", async () => {
    const root = await temporaryDirectory();
    const paymentId = "4a329697-1de5-4099-9898-1d9dc34e6810";
    const bytes = Buffer.from("%PDF-1.7\nproof");

    const result = await writePaymentProof(root, paymentId, bytes);

    expect(result).toEqual({
      path: path.join(root, `${paymentId}.proof`),
      mimeType: "application/pdf",
      extension: "pdf",
      size: bytes.length,
    });
    expect(await readFile(result.path)).toEqual(bytes);
    expect((await stat(result.path)).mode & 0o777).toBe(0o600);
  });

  it("rejects empty, oversized, and unsupported files", async () => {
    const root = await temporaryDirectory();
    const paymentId = "4a329697-1de5-4099-9898-1d9dc34e6810";

    await expect(writePaymentProof(root, paymentId, Buffer.alloc(0))).rejects.toThrow(
      "File kosong",
    );
    await expect(
      writePaymentProof(root, paymentId, Buffer.alloc(5 * 1024 * 1024 + 1)),
    ).rejects.toThrow("maksimal 5MB");
    await expect(
      writePaymentProof(root, paymentId, Buffer.from("not-an-image")),
    ).rejects.toThrow("Tipe file tidak didukung");
  });
});
