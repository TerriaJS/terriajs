import {
  TreeIndicator,
  TreeItem,
  TreeItemContent,
  TreeItemLabel,
  TreeLoadMoreItem,
  TreeRoot
} from "./Tree";

// Compound component, assembled here so Tree.tsx only exports components
export const Tree = Object.assign(TreeRoot, {
  Root: TreeRoot,
  Item: TreeItem,
  ItemContent: TreeItemContent,
  Indicator: TreeIndicator,
  ItemLabel: TreeItemLabel,
  LoadMoreItem: TreeLoadMoreItem
});

export {
  TreeIndicator,
  TreeItem,
  TreeItemContent,
  TreeItemLabel,
  TreeLoadMoreItem,
  TreeRoot
};
export type {
  TreeIndicatorProps,
  TreeItemContentProps,
  TreeItemLabelProps,
  TreeItemProps,
  TreeLoadMoreItemProps,
  TreeProps,
  TreeSize,
  TreeVariant
} from "./Tree";
