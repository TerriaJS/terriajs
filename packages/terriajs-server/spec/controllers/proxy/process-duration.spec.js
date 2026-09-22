import { processDuration } from "../../../lib/controllers/proxy/process-duration.js";
import { DURATION_UNITS } from "../../../lib/controllers/proxy/constants.js";

describe("processDuration", () => {
  it("should parse valid duration with seconds", () => {
    const result = processDuration("30s");
    expect(result).toBe(30 * DURATION_UNITS["s"]);
  });

  it("should parse valid duration with minutes", () => {
    const result = processDuration("5m");
    expect(result).toBe(5 * DURATION_UNITS["m"]);
  });

  it("should parse valid duration with hours", () => {
    const result = processDuration("2h");
    expect(result).toBe(2 * DURATION_UNITS["h"]);
  });

  it("should parse valid duration with days", () => {
    const result = processDuration("1d");
    expect(result).toBe(1 * DURATION_UNITS["d"]);
  });

  it("should parse decimal values", () => {
    const result = processDuration("1.5h");
    expect(result).toBe(1.5 * DURATION_UNITS["h"]);
  });

  it("should throw error for invalid duration format", () => {
    expect(() => processDuration("invalid")).toThrowError("Invalid duration");
    expect(() => processDuration("invalid")).toThrow(
      jasmine.objectContaining({ code: "INVALID_DURATION" })
    );
  });

  it("should throw error for empty string", () => {
    expect(() => processDuration("")).toThrowError("Invalid duration");
  });

  it("should throw error for invalid unit", () => {
    expect(() => processDuration("0.1ss")).toThrow(
      jasmine.objectContaining({ code: "INVALID_DURATION" })
    );
  });

  it("should throw error for duration without unit", () => {
    expect(() => processDuration("5")).toThrowError("Invalid duration");
  });

  it("should throw error for unit without value", () => {
    expect(() => processDuration("s")).toThrowError("Invalid duration");
  });
});
