export type PaymentReviewAction = "approve" | "reject";

type Fetcher = typeof fetch;

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data?.message === "string" ? data.message : "Permintaan gagal";
    throw new Error(message);
  }
  return data as T;
}

export async function uploadPaymentProof(
  paymentId: string,
  file: File,
  fetcher: Fetcher = fetch,
): Promise<{ url: string; type: string; size: number }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetcher(`/api/payments/${paymentId}/proof`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return parseResponse(response);
}

export async function reviewPayment<T>(
  paymentId: string,
  action: PaymentReviewAction,
  fetcher: Fetcher = fetch,
): Promise<T> {
  const response = await fetcher(`/api/payments/${paymentId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  return parseResponse<T>(response);
}
