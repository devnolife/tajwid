import { describe, expect, it } from "vitest";
import { queryClient } from "@/lib/queryClient";

describe("query client freshness policy", () => {
  it("does not cache server state forever", () => {
    const options = queryClient.getDefaultOptions().queries;
    expect(options?.staleTime).toBe(30_000);
    expect(options?.refetchOnWindowFocus).toBe(true);
  });
});
