import StratumOrder from "../../../lib/Models/Definition/StratumOrder";

describe("StratumOrder", function () {
  it("initially has a definition and a user stratum", function () {
    const so = new StratumOrder();
    expect(so.priorities.get("definition")).toBeDefined();
    expect(so.priorities.get("user")).toBeDefined();
  });

  it("strata types are added in the right order", function () {
    const so = new StratumOrder();
    so.addDefinitionStratum("definitionTest");
    so.addUserStratum("userTest");
    so.addLoadStratum("loadTest");

    expect(so.priorities.get("loadTest")).toBeLessThan(
      <number>so.priorities.get("definitionTest")
    );
    expect(so.priorities.get("definitionTest")).toBeLessThan(
      <number>so.priorities.get("userTest")
    );
  });

  it("strata of the same type get unique priorities", function () {
    const so = new StratumOrder();

    so.addDefinitionStratum("a");
    so.addDefinitionStratum("b");
    expect(so.priorities.get("a")).not.toEqual(so.priorities.get("b"));

    so.addUserStratum("c");
    so.addUserStratum("d");
    expect(so.priorities.get("c")).not.toEqual(so.priorities.get("d"));

    so.addUserStratum("e");
    so.addUserStratum("f");
    expect(so.priorities.get("e")).not.toEqual(so.priorities.get("f"));
  });

  it("sort functions return strata in the expected order", function () {
    const so = new StratumOrder();

    so.addDefinitionStratum("a");
    so.addLoadStratum("b");
    so.addDefinitionStratum("c");
    so.addUserStratum("d");
    so.addUserStratum("e");
    so.addLoadStratum("f");

    const a = { a: "A" };
    const b = { b: "B" };
    const c = { c: "C" };
    const d = { d: "D" };
    const e = { e: "E" };
    const f = { f: "F" };
    const strata = new Map<string, any>([
      ["a", a],
      ["b", b],
      ["c", c],
      ["d", d],
      ["e", e],
      ["f", f]
    ]);

    expect(Array.from(so.sortBottomToTop(strata).values())).toEqual([
      b,
      f,
      a,
      c,
      d,
      e
    ]);
    expect(Array.from(so.sortTopToBottom(strata).values())).toEqual([
      e,
      d,
      c,
      a,
      f,
      b
    ]);
  });

  it("add functions do not change the priority of existing strata", function () {
    const so = new StratumOrder();

    so.addDefinitionStratum("a");
    so.addLoadStratum("b");
    so.addUserStratum("c");

    const a = so.priorities.get("a");
    const b = so.priorities.get("b");
    const c = so.priorities.get("c");

    so.addDefinitionStratum("a");
    so.addLoadStratum("c"); // b and c purposely swapped
    so.addUserStratum("b");
    expect(so.priorities.get("a")).toEqual(a);
    expect(so.priorities.get("b")).toEqual(b);
    expect(so.priorities.get("c")).toEqual(c);
  });

  it("throws when a strata does not have a priority", function () {
    const so = new StratumOrder();

    so.addDefinitionStratum("a");

    const a = {};
    const b = {};
    const strata = new Map<string, any>([
      ["a", a],
      ["b", b]
    ]);

    expect(function () {
      so.sortBottomToTop(strata);
    }).toThrow();
  });
});
