import parseStringSize from "../../lib/Core/parseStringSize";

describe("parseStringSize", function () {
  it("Can parse size string without unit", function () {
    const value = parseStringSize("1024");
    expect(value).toBe(1024);
  });

  it("Can parse size string with KB unit", function () {
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

  it("Throws error for invalid size format", function () {
    try {
      parseStringSize("abc");
    } catch (error: any) {
      expect(error.message).toBe(`Invalid share size format: abc`);
    }
  });

  it("Handles edge case where unit is not specified but value is in bytes", function () {
    const value = parseStringSize("1024"); // assuming this is a valid size string
    expect(value).toBe(1024);
  });
});
