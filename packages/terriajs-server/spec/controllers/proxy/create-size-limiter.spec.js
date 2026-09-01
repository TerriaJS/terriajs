import { Readable } from "node:stream";
import { createSizeLimiter } from "../../../lib/controllers/proxy/create-size-limiter.js";

function collectStream(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

describe("proxy createSizeLimiter", () => {
  it("passes through data within the limit", async () => {
    const limiter = createSizeLimiter(100);
    const input = Buffer.alloc(50, "x");

    const source = Readable.from([input]);
    const result = await collectStream(source.pipe(limiter));

    expect(result.length).toBe(50);
  });

  it("passes through data exactly at the limit", async () => {
    const limiter = createSizeLimiter(100);
    const input = Buffer.alloc(100, "x");

    const source = Readable.from([input]);
    const result = await collectStream(source.pipe(limiter));

    expect(result.length).toBe(100);
  });

  it("emits error when data exceeds the limit", async () => {
    const limiter = createSizeLimiter(100);
    const input = Buffer.alloc(101, "x");

    const source = Readable.from([input]);

    try {
      await collectStream(source.pipe(limiter));
      fail("Expected an error to be thrown");
    } catch (err) {
      expect(err.code).toBe("RESPONSE_TOO_LARGE");
      expect(err.message).toContain("exceeded 100 bytes");
    }
  });

  it("emits error when cumulative chunks exceed the limit", async () => {
    const limiter = createSizeLimiter(100);
    const chunk1 = Buffer.alloc(60, "a");
    const chunk2 = Buffer.alloc(60, "b");

    const source = Readable.from([chunk1, chunk2]);

    try {
      await collectStream(source.pipe(limiter));
      fail("Expected an error to be thrown");
    } catch (err) {
      expect(err.code).toBe("RESPONSE_TOO_LARGE");
    }
  });
});
