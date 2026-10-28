import { describe, expect, it } from "vitest";
import { parseCSSTime } from "../parseCSSTime";

describe("parseCSSTime", () => {
  it("reads milliseconds", () => {
    expect(parseCSSTime("250ms")).toBe(250);
  });

  it("converts seconds to milliseconds", () => {
    expect(parseCSSTime(" 0.5s ")).toBe(500);
  });

  it("treats a bare number as milliseconds", () => {
    expect(parseCSSTime("300")).toBe(300);
  });

  it("is undefined for an unset or invalid value", () => {
    expect(parseCSSTime(undefined)).toBeUndefined();
    expect(parseCSSTime("")).toBeUndefined();
    expect(parseCSSTime("fast")).toBeUndefined();
  });
});
