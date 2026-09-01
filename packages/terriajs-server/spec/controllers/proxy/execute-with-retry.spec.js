import { executeWithRetry } from "../../../lib/controllers/proxy/execute-with-retry.js";

describe("executeWithRetry", () => {
  it("should succeed on first attempt with matching auth", async () => {
    const mockFetch = jasmine.createSpy().and.returnValue(
      Promise.resolve({
        statusCode: 200,
        headers: {},
        body: { pipe: jasmine.createSpy() }
      })
    );

    const strategies = [
      { type: "user", authorization: "Bearer token" },
      { type: "none" }
    ];
    const requestOptions = { url: "http://example.com" };

    const result = await executeWithRetry({
      strategies,
      requestOptions,
      fetchFn: mockFetch
    });

    expect(result.response.statusCode).toBe(200);
    expect(result.usedAuthStrategy).toEqual({
      type: "user",
      authorization: "Bearer token"
    });
    expect(mockFetch).toHaveBeenCalledWith({
      headers: {
        authorization: "Bearer token"
      }
    });
  });

  it("should retry with next strategy on 401, and return on first success response", async () => {
    const mockFetch = jasmine.createSpy().and.returnValues(
      Promise.reject({
        statusCode: 401,
        body: { statusCode: 401, message: "Unauthorized" }
      }),
      Promise.resolve({
        statusCode: 200,
        headers: {},
        body: { pipe: jasmine.createSpy() }
      })
    );

    const strategies = [
      { type: "user", authorization: "Bearer wrong" },
      { type: "proxy", authorization: "Bearer correct" },
      { type: "none" }
    ];

    const result = await executeWithRetry({
      strategies,
      requestOptions: { url: "http://example.com" },
      fetchFn: mockFetch
    });

    expect(result.response.statusCode).toBe(200);
    expect(result.usedAuthStrategy).toEqual({
      type: "proxy",
      authorization: "Bearer correct"
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.calls.argsFor(0)).toEqual([
      { headers: { authorization: "Bearer wrong" } }
    ]);
    expect(mockFetch.calls.argsFor(1)).toEqual([
      { headers: { authorization: "Bearer correct" } }
    ]);
    expect(mockFetch).not.toHaveBeenCalledWith([{ headers: {} }]);
  });

  it("should retry with next strategy on 401, and wait for first success response", async () => {
    const mockFetch = jasmine.createSpy().and.returnValues(
      Promise.reject({
        statusCode: 401,
        body: { statusCode: 401, message: "Unauthorized" }
      }),
      Promise.reject({
        statusCode: 403,
        body: { statusCode: 403, message: "Forbidden" }
      }),
      Promise.resolve({
        statusCode: 200,
        headers: {},
        body: { pipe: jasmine.createSpy() }
      })
    );

    const strategies = [
      { type: "user", authorization: "Bearer wrong" },
      { type: "proxy", authorization: "Bearer also-wrong" },
      { type: "none" }
    ];

    const result = await executeWithRetry({
      strategies,
      requestOptions: { url: "http://example.com" },
      fetchFn: mockFetch
    });

    expect(result.response.statusCode).toBe(200);
    expect(result.usedAuthStrategy).toEqual({ type: "none" });

    expect(mockFetch.calls.argsFor(0)).toEqual([
      { headers: { authorization: "Bearer wrong" } }
    ]);
    expect(mockFetch.calls.argsFor(1)).toEqual([
      { headers: { authorization: "Bearer also-wrong" } }
    ]);
    expect(mockFetch.calls.argsFor(2)).toEqual([{ headers: {} }]);
  });

  it("should stop retrying after last strategy", async () => {
    const mockFetch = jasmine.createSpy().and.returnValue(
      Promise.reject({
        statusCode: 403,
        body: { statusCode: 403, message: "Forbidden" }
      })
    );

    const strategies = [
      { type: "user", authorization: "Bearer wrong" },
      { type: "proxy", authorization: "Bearer also-wrong" },
      { type: "none" }
    ];

    try {
      await executeWithRetry({
        strategies,
        requestOptions: { url: "http://example.com" },
        fetchFn: mockFetch
      });
    } catch (err) {
      expect(err.statusCode).toBe(403);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockFetch.calls.argsFor(0)).toEqual([
        { headers: { authorization: "Bearer wrong" } }
      ]);
      expect(mockFetch.calls.argsFor(1)).toEqual([
        { headers: { authorization: "Bearer also-wrong" } }
      ]);
      expect(mockFetch.calls.argsFor(2)).toEqual([{ headers: {} }]);
      return;
    }
  });

  it("should throw error if no strategies provided", async () => {
    const mockFetch = jasmine.createSpy();

    const strategies = [];
    await expectAsync(
      executeWithRetry({
        strategies,
        requestOptions: { url: "http://example.com" },
        fetchFn: mockFetch
      })
    ).toBeRejectedWithError("No auth strategies provided");
  });
});
