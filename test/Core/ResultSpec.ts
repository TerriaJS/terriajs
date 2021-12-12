import TerriaError from "../../lib/Core/TerriaError";
import Result from "../../lib/Core/Result";

describe("Result", function() {
  beforeEach(function() {});

  it("Can create Result without error", async () => {
    const result = new Result("what");

    expect(result.ignoreError()).toBe("what");
    expect(result.throwIfError()).toBe("what");
    expect(result.throwIfUndefined()).toBe("what");
    expect(result.error).toBeUndefined();

    let caughtError = false;
    expect(
      result.catchError(() => {
        caughtError = true;
      })
    ).toBe("what");
    expect(caughtError).toBeFalsy();

    const result2 = new Result("what");

    expect(result2.ignoreError()).toBe("what");
    expect(result2.throwIfError()).toBe("what");
    expect(result2.throwIfUndefined()).toBe("what");
    expect(result.error).toBeUndefined();

    let caughtError2 = false;
    expect(
      result2.catchError(() => {
        caughtError2 = true;
      })
    ).toBe("what");
    expect(caughtError2).toBeFalsy();

    expect(result.map(val => val + " something").ignoreError()).toBe(
      "what something"
    );
    expect(result.map(val => val + " something2").throwIfError()).toBe(
      "what something2"
    );
    expect(
      (await result.mapAsync(async val => val + " something")).ignoreError()
    ).toBe("what something");
    expect(
      (await result.mapAsync(async val => val + " something2")).throwIfError()
    ).toBe("what something2");
  });

  it("Can create Result with error", async () => {
    const result = new Result(
      "what",
      new TerriaError({ message: "some error" })
    );

    expect(result.ignoreError()).toBe("what");
    expect(result.throwIfError).toThrow();
    expect(result.throwIfUndefined).toThrow();
    expect(result.error?.message).toBe("some error");

    let caughtError = false;
    expect(
      result.catchError(() => {
        caughtError = true;
      })
    ).toBe("what");
    expect(caughtError).toBeTruthy();

    const result2 = new Result("what", { message: "some error" });

    expect(result2.ignoreError()).toBe("what");
    expect(result2.throwIfError).toThrow();
    expect(result2.throwIfUndefined).toThrow();
    expect(result2.error?.message).toBe("some error");

    let caughtError2 = false;
    expect(
      result2.catchError(() => {
        caughtError2 = true;
      })
    ).toBe("what");
    expect(caughtError2).toBeTruthy();

    expect(result.map(val => val + " something").ignoreError()).toBe(
      "what something"
    );
    expect(result.map(val => val + " something2").throwIfError).toThrow();
    expect(
      (await result.mapAsync(async val => val + " something")).ignoreError()
    ).toBe("what something");
    expect(
      (await result.mapAsync(async val => val + " something2")).throwIfError
    ).toThrow();
  });
});
