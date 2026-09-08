import { filterHeaders } from "../../../lib/controllers/proxy/filter-headers.js";

describe("proxy filterHeaders", () => {
  it("properly filters", () => {
    const headers = {
      "Proxy-Connection": "delete me!",
      unfilteredheader: "don't delete me!"
    };

    const filteredHeaders = filterHeaders(headers);
    expect(filteredHeaders["Proxy-Connection"]).toBeUndefined();
    expect(filteredHeaders.unfilteredheader).toBe(headers.unfilteredheader);
  });

  it("properly filters when socket defined", () => {
    const headers = {
      "Proxy-Connection": "delete me!",
      unfilteredheader: "don't delete me!"
    };
    const socket = { remoteAddress: "test" };
    const filteredHeaders = filterHeaders(headers, socket);
    expect(filteredHeaders["x-forwarded-for"]).toBe(socket.remoteAddress);
  });

  it("properly combines x-forwarded-for header with socket remote address", () => {
    const socket = { remoteAddress: "test" };
    const headersWithForwarded = {
      "Proxy-Connection": "delete me!",
      unfilteredheader: "don't delete me!",
      "x-forwarded-for": "192.168.1.1"
    };
    const filteredHeaders = filterHeaders(headersWithForwarded, socket);
    expect(filteredHeaders["x-forwarded-for"]).toBe(
      `${headersWithForwarded["x-forwarded-for"]}, ${socket.remoteAddress}`
    );
  });
});
