import { describe, expect, it } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useTreeItems } from "../useTreeItems";

type CatalogNode = { id: string; name: string; children?: CatalogNode[] };

const CATALOG: CatalogNode[] = [
  {
    id: "boundaries",
    name: "Boundaries",
    children: [
      {
        id: "abs",
        name: "ABS statistical areas",
        children: [
          { id: "sa2", name: "SA2 2021" },
          { id: "lga", name: "Local Government Areas" }
        ]
      },
      { id: "suburbs", name: "Suburbs" }
    ]
  },
  { id: "hazards", name: "Hazards", children: [] },
  { id: "roads", name: "Roads" }
];

describe("useTreeItems", () => {
  it("lists every group's key, to expand them all", async () => {
    const { result } = await renderHook(() => useTreeItems({ items: CATALOG }));

    expect(result.current.expandableKeys).toEqual(["boundaries", "abs"]);
  });

  it("lists the leaves in order, at any depth", async () => {
    const { result } = await renderHook(() => useTreeItems({ items: CATALOG }));

    expect(result.current.leaves.map((node) => node.id)).toEqual([
      "sa2",
      "lga",
      "suburbs",
      "hazards",
      "roads"
    ]);
  });

  it("keeps the leaves that match and the groups that hold them", async () => {
    const { result } = await renderHook(() => useTreeItems({ items: CATALOG }));

    const filtered = result.current.filterTree((node) =>
      node.name.includes("Areas")
    );

    expect(filtered).toEqual([
      {
        ...CATALOG[0],
        children: [
          {
            ...CATALOG[0]?.children?.[0],
            children: [{ id: "lga", name: "Local Government Areas" }]
          }
        ]
      }
    ]);
  });

  it("takes which nodes are leaves, for groups whose children load later", async () => {
    const { result } = await renderHook(() =>
      useTreeItems({ items: CATALOG, isLeaf: (node) => !node.children })
    );

    expect(result.current.expandableKeys).toEqual([
      "boundaries",
      "abs",
      "hazards"
    ]);
    expect(result.current.leaves.map((node) => node.id)).not.toContain(
      "hazards"
    );
  });
});
