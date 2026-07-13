import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getIdentity } from "@/lib/api/authz";
import { parseJson, toErrorResponse } from "@/lib/api/http";
import { paymentActionSchema } from "@/lib/api/schemas";
import { transitionPaymentWorkflow } from "@/lib/services/payment-service";
import { paymentWorkflowDependencies } from "@/lib/services/payment-db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const identity = getIdentity(await auth());
    const { id } = await params;
    const input = await parseJson(request, paymentActionSchema);
    const result = await transitionPaymentWorkflow(
      identity,
      id,
      input,
      paymentWorkflowDependencies,
    );
    return NextResponse.json(result.payment);
  } catch (error) {
    return toErrorResponse(error);
  }
}
