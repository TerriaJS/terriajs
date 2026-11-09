import { describe, expect, it } from "vitest";
import { dataAttr } from "../dataAttr";

describe("dataAttr", () => {
  it("sets a data attribute to true while its condition holds", () => {
    expect(dataAttr(true)).toBe("true");
  });

  it("leaves it off otherwise, rather than setting it false", () => {
    expect(dataAttr(false)).toBeUndefined();
    expect(dataAttr(undefined)).toBeUndefined();
  });
});
