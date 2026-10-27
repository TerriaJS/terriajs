import type { ReactElement, ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { pickChildren } from "./pickChildren";

const Remove = (): null => null;
const Other = (): null => null;

describe("pickChildren", () => {
  it("takes out the children of one component, keeping the rest in order", () => {
    const children = [
      "Suburbs",
      <Remove key="remove" />,
      <Other key="other" />,
      <Remove key="again" />
    ] as ReactNode;
    const [rest, picked] = pickChildren(children, Remove);
    const kept = rest as ReactNode[];

    expect(kept).toHaveLength(2);
    expect(kept[0]).toBe("Suburbs");
    expect((kept[1] as ReactElement).type).toBe(Other);
    expect(picked?.map((child) => (child as ReactElement).key)).toEqual([
      "remove",
      "again"
    ]);
  });

  it("gives nothing picked when none are that component", () => {
    const children = ["Suburbs", <Other key="other" />] as ReactNode;
    const [rest, picked] = pickChildren(children, Remove);

    expect(rest as ReactNode[]).toHaveLength(2);
    expect(picked).toBeUndefined();
  });
});
