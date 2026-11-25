import { describe, expect, it } from "vitest";
import { assertAdmin, powersSchema } from "./admin-policy";

describe("Admin permissions and abilities", () => {
  it("allows only the admin role", () => {
    expect(() => assertAdmin("admin")).not.toThrow();
    expect(() => assertAdmin("user")).toThrow();
    expect(() => assertAdmin(null)).toThrow();
  });
  it.each(["invisible", "giant", "flying", "noclip"] as const)("accepts the %s ability", key => {
    const input = { tag: "", invisible: false, giant: false, flying: false, noclip: false, [key]: true };
    expect(powersSchema.parse(input)[key]).toBe(true);
  });
  it("allows removing the tag", () => {
    expect(powersSchema.parse({ tag: "", invisible: false, giant: false, flying: false, noclip: false }).tag).toBe("");
  });
});