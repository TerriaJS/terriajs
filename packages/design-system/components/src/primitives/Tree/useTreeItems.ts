import { useMemo } from "react";
import type { Key } from "react-aria-components";

type TreeItemNode<T> = {
  id: Key;
  children?: readonly T[];
};

type UseTreeItemsOptions<T extends TreeItemNode<T>> = {
  /** The tree's data; each node has an id and maybe children */
  items: readonly T[];
  /** Whether a node is a leaf. By default, one without children; pass your
   * own when a group's children load later */
  isLeaf?: (node: T) => boolean;
};

type TreeItems<T> = {
  /** Every group's id, to expand them all */
  expandableKeys: Key[];
  /** The leaves at any depth, in order */
  leaves: T[];
  /** The leaves that match, and the groups holding them; groups left empty
   * are dropped */
  filterTree: (predicate: (node: T) => boolean) => T[];
};

const hasNoChildren = <T extends TreeItemNode<T>>(node: T): boolean =>
  (node.children?.length ?? 0) === 0;

// Expand-all keys, leaves and filtering for a Tree's items, as a catalog
// search needs: filter the tree, then expand what's left
const useTreeItems = <T extends TreeItemNode<T>>({
  items,
  isLeaf = hasNoChildren
}: UseTreeItemsOptions<T>): TreeItems<T> =>
  useMemo(() => {
    const expandableKeys = (nodes: readonly T[]): Key[] =>
      nodes.flatMap((node) =>
        isLeaf(node) ? [] : [node.id, ...expandableKeys(node.children ?? [])]
      );

    const leaves = (nodes: readonly T[]): T[] =>
      nodes.flatMap((node) =>
        isLeaf(node) ? [node] : leaves(node.children ?? [])
      );

    const filterTree = (
      nodes: readonly T[],
      predicate: (node: T) => boolean
    ): T[] =>
      nodes.flatMap((node) => {
        if (isLeaf(node)) return predicate(node) ? [node] : [];
        const children = filterTree(node.children ?? [], predicate);
        return children.length > 0 ? [{ ...node, children }] : [];
      });

    return {
      expandableKeys: expandableKeys(items),
      leaves: leaves(items),
      filterTree: (predicate) => filterTree(items, predicate)
    };
  }, [items, isLeaf]);

export { useTreeItems };
export type { TreeItemNode, TreeItems, UseTreeItemsOptions };
