import { describe, expect, it } from "vitest";
import { moveItems } from "./moveItems";

const layer = (id: string): { id: string } => ({ id });
const ids = (items: { id: string }[]): string[] => items.map(({ id }) => id);

const LAYERS = ["roads", "rivers", "suburbs", "bushfires"].map(layer);

describe("moveItems", () => {
  it("moves an item before the target", () => {
    expect(
      ids(
        moveItems(LAYERS, new Set(["bushfires"]), {
          type: "item",
          key: "rivers",
          dropPosition: "before"
        })
      )
    ).toEqual(["roads", "bushfires", "rivers", "suburbs"]);
  });

  it("moves an item after the target", () => {
    expect(
      ids(
        moveItems(LAYERS, new Set(["roads"]), {
          type: "item",
          key: "suburbs",
          dropPosition: "after"
        })
      )
    ).toEqual(["rivers", "suburbs", "roads", "bushfires"]);
  });

  it("moves several items together, in their order in the list", () => {
    expect(
      ids(
        moveItems(LAYERS, new Set(["suburbs", "roads"]), {
          type: "item",
          key: "bushfires",
          dropPosition: "after"
        })
      )
    ).toEqual(["rivers", "bushfires", "roads", "suburbs"]);
  });

  it("leaves the items as they are when the target is one of the moved", () => {
    expect(
      ids(
        moveItems(LAYERS, new Set(["rivers"]), {
          type: "item",
          key: "rivers",
          dropPosition: "after"
        })
      )
    ).toEqual(ids(LAYERS));
  });

  it("leaves the items as they are when the target isn't in them", () => {
    expect(
      ids(
        moveItems(LAYERS, new Set(["roads"]), {
          type: "item",
          key: "removed",
          dropPosition: "before"
        })
      )
    ).toEqual(ids(LAYERS));
  });

  it("doesn't change the items it's given", () => {
    const layers = [...LAYERS];

    moveItems(layers, new Set(["roads"]), {
      type: "item",
      key: "bushfires",
      dropPosition: "after"
    });

    expect(layers).toEqual(LAYERS);
  });
});
