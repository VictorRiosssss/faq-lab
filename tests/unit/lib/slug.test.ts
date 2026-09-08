import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Técnica")).toBe("tecnica");
    expect(slugify("Comercial")).toBe("comercial");
  });

  it("removes accents", () => {
    expect(slugify("Área Financeira")).toBe("area-financeira");
  });

  it("trims stray hyphens", () => {
    expect(slugify("  -- Recursos Humanos --  ")).toBe("recursos-humanos");
  });
});
