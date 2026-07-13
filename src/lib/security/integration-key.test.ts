import { describe, expect, it } from "vitest";
import {
  getCertificateIntegrationKey,
  isValidIntegrationKey,
} from "@/lib/security/integration-key";

describe("certificate integration key", () => {
  it("never falls back to a public default", () => {
    expect(getCertificateIntegrationKey({})).toBeNull();
    expect(() =>
      getCertificateIntegrationKey({ CERTIFICATE_API_KEY: "short-default" }),
    ).toThrow("minimal 32 karakter");
  });

  it("accepts a strong configured key and compares it safely", () => {
    const key = "vVY09FOEw7hb-KyJkFO4q1QFx3xrc3msoT_WfP94bE0";
    expect(getCertificateIntegrationKey({ CERTIFICATE_API_KEY: key })).toBe(key);
    expect(isValidIntegrationKey(key, key)).toBe(true);
    expect(isValidIntegrationKey("wrong", key)).toBe(false);
    expect(isValidIntegrationKey(null, key)).toBe(false);
  });
});
