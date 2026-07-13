import { describe, expect, it } from "vitest";
import config from "../tailwind.config";

describe("Tailwind configuration", () => {
  it("loads in an ESM runtime and registers its plugin", () => {
    expect(config.plugins).toHaveLength(2);
    expect(config.plugins?.every(Boolean)).toBe(true);
  });
});
