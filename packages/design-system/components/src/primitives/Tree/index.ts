import {
  TreeDragHandle,
  TreeIndicator,
  TreeItem,
  TreeItemContent,
  TreeItemLabel,
  TreeLoadMoreItem,
  TreeRoot
} from "./Tree";
import { useTreeDragAndDrop } from "./useTreeDragAndDrop";
import { useTreeItems } from "./useTreeItems";

// Compound component, assembled here so Tree.tsx only exports components
export const Tree = Object.assign(TreeRoot, {
  Root: TreeRoot,
  Item: TreeItem,
  ItemContent: TreeItemContent,
  Indicator: TreeIndicator,
  DragHandle: TreeDragHandle,
  ItemLabel: TreeItemLabel,
  LoadMoreItem: TreeLoadMoreItem
});

export {
  TreeDragHandle,
  TreeIndicator,
  TreeItem,
  TreeItemContent,
  TreeItemLabel,
  TreeLoadMoreItem,
  TreeRoot,
  useTreeDragAndDrop,
  useTreeItems
};
export type {
  TreeDragHandleProps,
  TreeIndicatorProps,
  TreeItemContentProps,
  TreeItemLabelProps,
  TreeItemProps,
  TreeLoadMoreItemProps,
  TreeProps,
  TreeSize,
  TreeVariant
} from "./Tree";
export type {
  TreeItemNode,
  TreeItems,
  UseTreeItemsOptions
} from "./useTreeItems";
export type {
  TreeDataNode,
  TreeDropTarget,
  UseTreeDragAndDropOptions
} from "./useTreeDragAndDrop";
