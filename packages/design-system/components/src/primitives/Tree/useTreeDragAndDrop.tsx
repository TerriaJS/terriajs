import type { DragItem } from "react-aria";
import type { DropTarget, Key } from "react-aria-components";
import {
  DropIndicator as AriaDropIndicator,
  useDragAndDrop,
  type DragAndDropHooks,
  type DragAndDropOptions
} from "react-aria-components/useDragAndDrop";
import type { TreeData } from "react-stately";
import { Chip } from "../Chip";
import { dataAttr } from "../../utils/dataAttr";
import "./Tree.css";

type TreeDropTarget = Extract<DropTarget, { type: "item" }>;

// A row's node in the tree's data, as the Tree renders it: its key, value
// and children
type TreeDataNode<T extends object> = TreeData<T>["items"][number];

// React Aria's options, such as shouldAcceptItemDrop, getDropOperation and
// acceptedDragTypes to limit where rows can go, apart from those this sets
type UseTreeDragAndDropOptions<T extends object> = Omit<
  DragAndDropOptions<TreeDataNode<T>>,
  "getItems" | "onMove" | "renderDropIndicator"
> & {
  /** The tree's data, from useTreeData, which the rows are moved in */
  tree: TreeData<T>;
  /**
   * What a drag carries out of the tree, from the dragged rows' keys and
   * nodes. By default each row's name as screen readers read it, taken from
   * the page: a row out of view in a virtualized tree isn't there, so its key
   * stands in. Name rows from their data here to cover those too. An item
   * without text, carrying only the app's own types, gets the row's name as
   * text, which the preview shows
   */
  getItems?: (keys: Set<Key>, items: TreeDataNode<T>[]) => DragItem[];
  /** Called once rows have moved */
  onMove?: (keys: Set<Key>, target: TreeDropTarget) => void;
};

// A row's name, as screen readers read it, from the tree being dragged from:
// the one holding focus, which pressing or the keyboard put on a row, else
// any on the page. A row out of view in a virtualized tree isn't rendered,
// so its key stands in
const rowName = (key: Key): string => {
  const selector = `[role="row"][data-key="${CSS.escape(String(key))}"]`;
  const row =
    document.activeElement
      ?.closest('[role="treegrid"]')
      ?.querySelector(selector) ?? document.querySelector(selector);
  return row?.getAttribute("aria-label") ?? String(key);
};

// The row grabbed comes first, as the preview names it; the rest follow in
// selection order
const rowNames = (keys: Set<Key>): DragItem[] => {
  const grabbed = document.activeElement
    ?.closest('[role="row"]')
    ?.getAttribute("data-key");
  return [...keys]
    .sort(
      (a, b) => Number(String(b) === grabbed) - Number(String(a) === grabbed)
    )
    .map((key) => ({ "text/plain": rowName(key) }));
};

// What follows the pointer: the first row's name, and how many rows go with
// it, on a card stacked behind it. React Aria otherwise shows only the row
// pressed. The browser pictures only the preview's own box, so the stack is
// drawn inside it, not with shadows around it
const renderRowsPreview = (items: DragItem[]): React.ReactElement => (
  <div
    data-tds="tree-drag-preview"
    data-tds-stacked={dataAttr(items.length > 1)}
  >
    <div data-tds="tree-drag-preview-card">
      <span data-tds="tree-drag-preview-label">{items[0]?.["text/plain"]}</span>
      {items.length > 1 && (
        <Chip size="sm" variant="primary" color="accent">
          {items.length}
        </Chip>
      )}
    </div>
  </div>
);

// Rows dragged within the tree move before, after or into others, with a
// line showing where they'll land. Pass the result to a Tree, whose rows
// each hold a Tree.DragHandle. Where rows can go is limited with React Aria's
// options: give rows a drag type in getItems, then reject targets with
// shouldAcceptItemDrop (into a row) or getDropOperation (any target)
const useTreeDragAndDrop = <T extends object>({
  tree,
  getItems = rowNames,
  renderDragPreview = renderRowsPreview,
  onMove,
  ...options
}: UseTreeDragAndDropOptions<T>): { dragAndDropHooks: DragAndDropHooks } =>
  useDragAndDrop<TreeDataNode<T>>({
    ...options,
    // The preview names each row by its text, so a row given none gets its
    // name
    getItems: (keys, items) => {
      const ordered = [...keys];
      return getItems(keys, items).map((item, index) => ({
        "text/plain": rowName(ordered[index] ?? ""),
        ...item
      }));
    },
    renderDragPreview,
    onMove: ({ keys, target }) => {
      if (target.dropPosition === "before") {
        tree.moveBefore(target.key, keys);
      } else if (target.dropPosition === "after") {
        tree.moveAfter(target.key, keys);
      } else {
        // Into the group, after its children
        const index = tree.getItem(target.key)?.children?.length ?? 0;
        [...keys].forEach((key, offset) => {
          tree.move(key, target.key, index + offset);
        });
      }
      onMove?.(keys, target);
    },
    renderDropIndicator: (target) => (
      // React Aria's tree passes on only a class, not data attributes
      <AriaDropIndicator target={target} className="tds-tree-drop-indicator" />
    )
  });

export { useTreeDragAndDrop };
export type { TreeDataNode, TreeDropTarget, UseTreeDragAndDropOptions };
