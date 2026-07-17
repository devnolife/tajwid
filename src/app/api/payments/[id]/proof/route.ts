import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";
import {
  ApiError,
  getIdentity,
  requireRole,
} from "@/lib/api/authz";
import { toErrorResponse } from "@/lib/api/http";
import {
  deletePaymentProof,
  detectPaymentProofType,
  getPaymentProofRoot,
  readPaymentProof,
  writePaymentProof,
} from "@/lib/security/payment-proof";
import { transitionPaymentWorkflow } from "@/lib/services/payment-service";
import { paymentWorkflowDependencies } from "@/lib/services/payment-db";

const paymentIdSchema = z.string().uuid();
const MAX_PROOF_SIZE = 5 * 1024 * 1024;

function parsePaymentId(id: string): string {
  const parsed = paymentIdSchema.safeParse(id);
  if (!parsed.success) {
    throw new ApiError(400, "Payment ID tidak valid", "INVALID_INPUT");
  }
  return parsed.data;
}

async function getPaymentOrThrow(id: string) {
  const payment = await storage.getPayment(id);
  if (!payment) {
    throw new ApiError(404, "Payment not found", "NOT_FOUND");
  }
  return payment;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let stored = false;
  let paymentId: string | null = null;
  const root = getPaymentProofRoot();
  try {
    const identity = requireRole(getIdentity(await auth()), "mahasiswa");
    paymentId = parsePaymentId((await params).id);
    const payment = await getPaymentOrThrow(paymentId);
    if (payment.studentId !== identity.id) {
      throw new ApiError(403, "Forbidden", "FORBIDDEN");
    }
    if (payment.status !== "belum_bayar" && payment.status !== "ditolak") {
      throw new ApiError(
        409,
        "Transisi status pembayaran tidak valid",
        "INVALID_PAYMENT_STATE",
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ApiError(400, "File tidak ditemukan", "INVALID_INPUT");
    }
    if (file.size > MAX_PROOF_SIZE) {
      throw new ApiError(400, "Ukuran file maksimal 5MB", "INVALID_INPUT");
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    let proof;
    try {
      proof = await writePaymentProof(root, paymentId, bytes);
      stored = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload gagal";
      throw new ApiError(400, message, "INVALID_PROOF");
    }

    const proofUrl = `/api/payments/${paymentId}/proof`;
    await transitionPaymentWorkflow(
      identity,
      paymentId,
      { action: "submit_proof", proofUrl },
      paymentWorkflowDependencies,
    );

    return NextResponse.json(
      {
        url: proofUrl,
        size: proof.size,
        type: proof.mimeType,
      },
      { status: 201 },
    );
  } catch (error) {
    if (stored && paymentId) {
      await deletePaymentProof(root, paymentId).catch(() => undefined);
    }
    return toErrorResponse(error);
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const identity = getIdentity(await auth());
    const paymentId = parsePaymentId((await params).id);
    const payment = await getPaymentOrThrow(paymentId);
    if (
      identity.role !== "admin" &&
      (identity.role !== "mahasiswa" || identity.id !== payment.studentId)
    ) {
      throw new ApiError(403, "Forbidden", "FORBIDDEN");
    }

    let bytes: Buffer;
    try {
      bytes = await readPaymentProof(getPaymentProofRoot(), paymentId);
    } catch {
      throw new ApiError(404, "Bukti pembayaran tidak ditemukan", "NOT_FOUND");
    }
    const type = detectPaymentProofType(bytes);
    if (!type) {
      throw new ApiError(500, "Bukti pembayaran rusak", "CORRUPT_PROOF");
    }

    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": type.mimeType,
        "Content-Disposition": `attachment; filename="bukti-pembayaran.${type.extension}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
