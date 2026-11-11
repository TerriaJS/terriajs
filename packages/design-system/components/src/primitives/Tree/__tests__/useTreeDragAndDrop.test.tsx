import { Collection } from "react-aria-components/Collection";
import { useEffect } from "react";
import type { DragAndDropHooks } from "react-aria-components/useDragAndDrop";
import { useTreeData } from "react-stately";
import type { DragItem, DropEvent } from "react-aria";
import { DropZone, type Key } from "react-aria-components";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Tree } from "..";
import {
  useTreeDragAndDrop,
  type TreeDataNode,
  type UseTreeDragAndDropOptions
} from "../useTreeDragAndDrop";

type Layer = { id: string; name: string; children?: Layer[] };

const LAYERS: Layer[] = [
  { id: "suburbs", name: "Suburbs" },
  { id: "roads", name: "Roads" },
  { id: "rivers", name: "Rivers" }
];

// A workbench whose layers are reordered by dragging; layers can be kept
// from taking others into them
const Workbench = ({
  layersTakeLayers = true,
  getItems
}: {
  layersTakeLayers?: boolean;
  getItems?: UseTreeDragAndDropOptions<Layer>["getItems"];
}): React.ReactElement => {
  const tree = useTreeData({
    initialItems: LAYERS,
    getKey: (layer) => layer.id,
    getChildren: (layer) => layer.children ?? []
  });
  const { dragAndDropHooks } = useTreeDragAndDrop({
    tree,
    getItems,
    shouldAcceptItemDrop: () => layersTakeLayers
  });
  return (
    <Tree
      aria-label="Workbench"
      items={tree.items}
      dragAndDropHooks={dragAndDropHooks}
    >
      {function renderLayer(item) {
        return (
          <Tree.Item id={item.key} textValue={item.value.name}>
            <Tree.ItemContent>
              <Tree.Indicator />
              <Tree.ItemLabel>{item.value.name}</Tree.ItemLabel>
              <Tree.DragHandle />
            </Tree.ItemContent>
            <Collection items={item.children ?? []}>{renderLayer}</Collection>
          </Tree.Item>
        );
      }}
    </Tree>
  );
};

const rowNames = (screen: Awaited<ReturnType<typeof render>>): string[] =>
  screen
    .getByRole("row")
    .elements()
    .map((row) => row.getAttribute("aria-label") ?? "");

describe("useTreeDragAndDrop", () => {
  it("moves a row with the keyboard, from its drag handle", async () => {
    const screen = await render(<Workbench />);

    await userEvent.tab();
    await userEvent.tab();
    await expect
      .element(screen.getByRole("button", { name: /^Drag Suburbs/ }))
      .toHaveFocus();

    await userEvent.keyboard("{Enter}");
    // Past "Insert between Suburbs and Roads" and "Drop on Roads"
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Enter}");

    await expect
      .poll(() => rowNames(screen))
      .toEqual(["Roads", "Suburbs", "Rivers"]);
  });

  // A drag's items come from the app's own data, as React Aria hands them
  // over: the rows' names are there even for rows out of view
  it("gives getItems the dragged rows' data", async () => {
    const getItems = vi.fn(
      (_keys: Set<Key>, items: TreeDataNode<Layer>[]): DragItem[] =>
        items.map((item) => ({ "text/plain": item.value.name }))
    );
    const screen = await render(<Workbench getItems={getItems} />);

    await userEvent.tab();
    await userEvent.tab();
    await expect
      .element(screen.getByRole("button", { name: /^Drag Suburbs/ }))
      .toHaveFocus();
    await userEvent.keyboard("{Enter}");

    expect(getItems).toHaveBeenCalled();
    const items = getItems.mock.lastCall?.[1] ?? [];
    expect(items.map((item) => item.value.name)).toEqual(["Suburbs"]);
    await userEvent.keyboard("{Escape}");
  });

  it("names the dragged rows as text when getItems gives only its own types", async () => {
    const onDrop = vi.fn<(event: DropEvent) => void>();
    const screen = await render(
      <>
        <Workbench
          getItems={(keys) =>
            [...keys].map((key) => ({ "terria/layer": String(key) }))
          }
        />
        <DropZone aria-label="Elsewhere" onDrop={onDrop} />
      </>
    );

    await userEvent.tab();
    await userEvent.tab();
    await expect
      .element(screen.getByRole("button", { name: /^Drag Suburbs/ }))
      .toHaveFocus();
    await userEvent.keyboard("{Enter}");
    // Past the tree's own drop targets, to the zone
    for (let target = 0; target < 10 && !onDrop.mock.calls.length; target++) {
      if (document.activeElement?.closest(".react-aria-DropZone")) {
        await userEvent.keyboard("{Enter}");
      } else {
        await userEvent.tab();
      }
    }

    const [item] = onDrop.mock.lastCall?.[0].items ?? [];
    expect(item?.kind).toBe("text");
    expect(
      item?.kind === "text" ? await item.getText("text/plain") : undefined
    ).toBe("Suburbs");
  });

  it("moves a row into the row it's dropped on", async () => {
    const screen = await render(<Workbench />);

    await userEvent.tab();
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    // Past "Insert between Suburbs and Roads", to "Drop on Roads"
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Enter}");
    await screen.getByRole("button", { name: "Expand Roads" }).click();

    await expect
      .element(screen.getByRole("row", { name: "Suburbs" }))
      .toHaveAttribute("aria-level", "2");
  });

  it("skips the drop targets it doesn't accept", async () => {
    await render(<Workbench layersTakeLayers={false} />);

    await userEvent.tab();
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    // Past "Insert between Suburbs and Roads"; "Drop on Roads" is skipped
    await userEvent.keyboard("{ArrowDown}");

    expect(document.activeElement?.getAttribute("aria-label")).toBe(
      "Insert between Roads and Rivers"
    );
  });

  it("previews a drag of several rows with the first's name and a count", async () => {
    let hooks: DragAndDropHooks | undefined;
    const Captured = ({
      onHooks
    }: {
      onHooks: (hooks: DragAndDropHooks) => void;
    }): null => {
      const tree = useTreeData({ initialItems: LAYERS });
      const { dragAndDropHooks } = useTreeDragAndDrop({ tree });
      useEffect(() => {
        onHooks(dragAndDropHooks);
      }, [dragAndDropHooks, onHooks]);
      return null;
    };
    await render(
      <Captured
        onHooks={(captured) => {
          hooks = captured;
        }}
      />
    );

    const screen = await render(
      <>
        {hooks?.renderDragPreview?.([
          { "text/plain": "Suburbs" },
          { "text/plain": "Roads" },
          { "text/plain": "Rivers" }
        ])}
      </>
    );

    await expect.element(screen.getByText("Suburbs")).toBeVisible();
    await expect.element(screen.getByText("3")).toBeVisible();
    expect(screen.container.textContent).not.toContain("Roads");
  });
});
