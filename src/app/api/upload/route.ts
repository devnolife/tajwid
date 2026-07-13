import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getIdentity } from "@/lib/api/authz";
import { toErrorResponse } from "@/lib/api/http";

export async function POST(_request: Request) {
  void _request;
  try {
    getIdentity(await auth());
    return NextResponse.json(
      {
        message: "Gunakan endpoint bukti pembayaran yang terikat resource",
        code: "UPLOAD_ENDPOINT_RETIRED",
      },
      { status: 410 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
