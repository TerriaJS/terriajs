import { Collection } from "react-aria-components/Collection";
import { useTreeData } from "react-stately";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Tree } from "..";
import { useTreeDragAndDrop } from "../useTreeDragAndDrop";

type Layer = { id: string; name: string; children?: Layer[] };

const LAYERS: Layer[] = [
  { id: "suburbs", name: "Suburbs" },
  { id: "roads", name: "Roads" },
  { id: "rivers", name: "Rivers" }
];

// A workbench whose layers are reordered by dragging; layers can be kept
// from taking others into them
const Workbench = ({
  layersTakeLayers = true
}: {
  layersTakeLayers?: boolean;
}): React.ReactElement => {
  const tree = useTreeData({
    initialItems: LAYERS,
    getKey: (layer) => layer.id,
    getChildren: (layer) => layer.children ?? []
  });
  const { dragAndDropHooks } = useTreeDragAndDrop({
    tree,
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
});
