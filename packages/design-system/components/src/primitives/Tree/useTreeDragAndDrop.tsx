import type { DragItem } from "react-aria";
import type { DropTarget, Key } from "react-aria-components";
import {
  DropIndicator as AriaDropIndicator,
  useDragAndDrop,
  type DragAndDropHooks,
  type DragAndDropOptions
} from "react-aria-components/useDragAndDrop";
import type { TreeData } from "react-stately";

type TreeDropTarget = Extract<DropTarget, { type: "item" }>;

// React Aria's options, such as shouldAcceptItemDrop, getDropOperation and
// acceptedDragTypes to limit where rows can go, apart from those this sets
type UseTreeDragAndDropOptions<T extends object> = Omit<
  DragAndDropOptions<T>,
  "getItems" | "onMove" | "renderDropIndicator"
> & {
  /** The tree's data, from useTreeData, which the rows are moved in */
  tree: TreeData<T>;
  /** What a drag carries out of the tree. By default each key, as text */
  getItems?: (keys: Set<Key>) => DragItem[];
  /** Called once rows have moved */
  onMove?: (keys: Set<Key>, target: TreeDropTarget) => void;
};

const keysAsText = (keys: Set<Key>): DragItem[] =>
  [...keys].map((key) => ({ "text/plain": String(key) }));

// Rows dragged within the tree move before, after or into others, with a
// line showing where they'll land. Pass the result to a Tree, whose rows
// each hold a Tree.DragHandle. Where rows can go is limited with React Aria's
// options: give rows a drag type in getItems, then reject targets with
// shouldAcceptItemDrop (into a row) or getDropOperation (any target)
const useTreeDragAndDrop = <T extends object>({
  tree,
  getItems = keysAsText,
  onMove,
  ...options
}: UseTreeDragAndDropOptions<T>): { dragAndDropHooks: DragAndDropHooks } =>
  useDragAndDrop({
    ...options,
    getItems,
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
export type { TreeDropTarget, UseTreeDragAndDropOptions };
