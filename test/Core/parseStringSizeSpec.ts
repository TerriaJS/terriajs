import parseStringSize from "../../lib/Core/parseStringSize";

describe("parseStringSize", function () {
  it("Throws error for non-string input", function () {
    // @ts-expect-error Testing runtime error for non-string input
    expect(() => parseStringSize(1234)).toThrowError("Input must be a string");
  });

  it("Throws error for undefined input", function () {
    // @ts-expect-error Testing runtime error for undefined input
    expect(() => parseStringSize(undefined)).toThrowError(
      "Input must be a string"
    );
  });

  it("Parses size string without unit as bytes", function () {
    const value = parseStringSize("1024");
    expect(value).toBe(1024);
  });

  it("Can parse size string with KB unit", function () {
    // Assumes 1KB equals 1024 bytes
    const value = parseStringSize("1KB");
    expect(value).toBe(1024);
  });

  it("Can parse size string with MB unit", function () {
    const value = parseStringSize("1MB");
    expect(value).toBe(1048576); // 1024^2
  });

  it("Can parse size string with GB unit", function () {
    const value = parseStringSize("1GB");
    expect(value).toBe(1073741824); // 1024^3
  });

  it("Can parse size string with TB unit", function () {
    const value = parseStringSize("1TB");
    expect(value).toBe(1099511627776); // 1024^4
  });

  it("Throws error for non-numeric size string", function () {
    try {
      parseStringSize("abc");
    } catch (error: any) {
      expect(error.message).toBe(`Invalid size format: abc`);
    }
  });

  it("Handles edge case where unit is not specified but value is in bytes", function () {
    const value = parseStringSize("1024");
    expect(value).toBe(1024);
  });
});
