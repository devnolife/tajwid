import { describe, expect, it, vi } from "vitest";
import {
  reviewPayment,
  uploadPaymentProof,
} from "@/lib/payment-client";

describe("payment client", () => {
  it("uploads proof directly to the resource-scoped endpoint", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          url: "/api/payments/payment-1/proof",
          type: "image/png",
          size: 8,
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );
    const file = new File([new Uint8Array([1, 2, 3])], "proof.png", {
      type: "image/png",
    });

    await uploadPaymentProof("payment-1", file, fetcher);

    expect(fetcher).toHaveBeenCalledWith(
      "/api/payments/payment-1/proof",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );
  });

  it("maps admin review actions to the strict payment action API", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "payment-1", status: "lunas" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await reviewPayment("payment-1", "approve", fetcher);

    expect(fetcher).toHaveBeenCalledWith("/api/payments/payment-1", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
  });

  it("surfaces the server error message", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Transisi tidak valid" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      reviewPayment("payment-1", "reject", fetcher),
    ).rejects.toThrow("Transisi tidak valid");
  });
});
