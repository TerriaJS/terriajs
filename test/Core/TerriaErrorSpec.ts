import TerriaError, { TerriaErrorSeverity } from "../../lib/Core/TerriaError";

describe("TerriaError", function() {
  beforeEach(function() {});

  it("Can create TerriaError", function() {
    const test = new TerriaError({ message: "some message" });
    expect(test.message).toBe("some message");
    expect(test.title).toBe("core.terriaError.defaultTitle");
  });

  it("Can create TerriaError from string", function() {
    const test = TerriaError.from("What what");
    expect(test.message).toBe("What what");
    expect(test.title).toBe("core.terriaError.defaultTitle");

    const test2 = TerriaError.from("What what", { title: "Some title" });
    expect(test2.message).toBe("What what");
    expect(test2.title).toBe("Some title");
  });

  it("Can create TerriaError from Error", function() {
    const error = new Error("What what what");
    const test = TerriaError.from(error);
    expect(test.message).toBe("What what what");
    expect(test.title).toBe("core.terriaError.defaultTitle");
    expect(test.originalError?.[0]).toBe(error);

    const error2 = new Error("What 2 what");
    const test2 = TerriaError.from(error2, { title: "Some better title" });
    expect(test2.message).toBe("What 2 what");
    expect(test2.title).toBe("Some better title");
    expect(test2.originalError?.[0]).toBe(error2);
  });

  it("Can create TerriaError from Object", function() {
    const error = new Object("some stringy object");
    const test = TerriaError.from(error);
    expect(test.message).toBe("some stringy object");
    expect(test.title).toBe("core.terriaError.defaultTitle");
    expect(test.originalError?.[0]).toEqual(new Error("some stringy object"));
    console.log(test);
  });

  it("Can create chain of TerriaErrors and combine them", function() {
    const error = new TerriaError({ message: "some message" });
    const test = TerriaError.from(error);
    expect(test).toBe(error);

    const error2 = new TerriaError({ message: "some message" });
    const test2 = TerriaError.from(error2, "Some other message");
    expect(test2.message).toBe("Some other message");
    expect(test2.originalError?.[0].message).toBe("some message");

    const test3 = TerriaError.from(test2, { title: "A title" });
    expect(test3.message).toBe(test2.message);
    expect(test3.title).toBe("A title");
    expect((test3.originalError?.[0] as TerriaError).title).toBe(
      "core.terriaError.defaultTitle"
    );
    const errors = test3.flatten();
    expect(errors[0].message).toBe(
      ["Some other message", "Some other message", "some message"][0]
    );
    expect(errors[1].message).toBe(
      ["Some other message", "Some other message", "some message"][1]
    );
    expect(errors[2].message).toBe(
      ["Some other message", "Some other message", "some message"][2]
    );

    const combined = TerriaError.combine(errors, "A big error");
    expect(combined?.message).toBe("A big error");
    expect(combined?.title).toBe("core.terriaError.defaultCombineTitle");
    expect(combined?.originalError?.length).toBe(3);
    expect(
      (combined?.originalError?.[0] as TerriaError).originalError?.length
    ).toBe(1);
    expect(
      (combined?.originalError?.[1] as TerriaError).originalError?.length
    ).toBe(1);
    expect(
      (combined?.originalError?.[2] as TerriaError).originalError?.length
    ).toBe(0);
    expect(combined?.flatten().length).toBe(7);
  });
});
