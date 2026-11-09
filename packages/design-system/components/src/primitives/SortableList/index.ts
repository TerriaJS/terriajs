import {
  SortableList as SortableListRoot,
  SortableListDragHandle
} from "./SortableList";

// Compound component, assembled here so SortableList.tsx only exports
// components
export const SortableList = Object.assign(SortableListRoot, {
  Root: SortableListRoot,
  DragHandle: SortableListDragHandle
});

export { SortableListDragHandle, SortableListRoot };
export { moveItems } from "./moveItems";
export type {
  SortableItemState,
  SortableListAxis,
  SortableListDragFrom,
  SortableListDragHandleProps,
  SortableListDropIndicator,
  SortableListProps
} from "./SortableList";
