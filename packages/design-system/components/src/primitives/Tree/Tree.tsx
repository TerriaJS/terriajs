import { ChevronRightIcon } from "@terria/design-system-icons";
import {
  createContext,
  forwardRef,
  useContext,
  useRef,
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type ReactNode
} from "react";
import {
  Button as AriaButton,
  Tree as AriaTree,
  TreeItem as AriaTreeItem,
  TreeItemContent as AriaTreeItemContent,
  TreeLoadMoreItem as AriaTreeLoadMoreItem,
  type ButtonProps as AriaButtonProps,
  type Key,
  type TreeItemContentRenderProps,
  type TreeItemProps as AriaTreeItemProps,
  type TreeLoadMoreItemProps as AriaTreeLoadMoreItemProps,
  type TreeProps as AriaTreeProps
} from "react-aria-components/Tree";
import { Spinner } from "../Spinner";
import { dataAttr } from "../../utils/dataAttr";
import { useAnimatedExpansion } from "./useAnimatedExpansion";
import "./Tree.css";

// Groups whose rows are animating shut, which their indicators already show
// as collapsed
const TreeCollapsingContext = createContext<ReadonlySet<Key>>(new Set());

type TreeSize = "sm" | "md" | "lg";
type TreeVariant = "primary" | "secondary";

type TreeProps<T extends object> = AriaTreeProps<T> & {
  /** @default "md" */
  size?: TreeSize;
  /** A card of its own, or open on the page. @default "primary" */
  variant?: TreeVariant;
  /** Lines down from each group to its children, always or while hovered.
   * @default true */
  showGuideLines?: boolean | "hover";
};

// Nested rows. Buttons and other controls in a row are reached with Tab, as
// arrow keys move between rows and expand or collapse them. Groups animate
// open and shut
const TreeRoot = <T extends object>({
  size = "md",
  variant = "primary",
  showGuideLines = true,
  keyboardNavigationBehavior = "tab",
  expandedKeys: expandedKeysProp,
  defaultExpandedKeys,
  onExpandedChange,
  ...props
}: TreeProps<T>): React.ReactElement => {
  const treeRef = useRef<HTMLDivElement>(null);
  const { expandedKeys, setExpandedKeys, collapsingKeys } =
    useAnimatedExpansion(treeRef, {
      expandedKeys: expandedKeysProp,
      defaultExpandedKeys,
      onExpandedChange
    });

  return (
    <TreeCollapsingContext.Provider value={collapsingKeys}>
      <AriaTree
        {...props}
        ref={treeRef}
        expandedKeys={expandedKeys}
        onExpandedChange={setExpandedKeys}
        keyboardNavigationBehavior={keyboardNavigationBehavior}
        data-tds="tree"
        data-tds-size={size}
        data-tds-variant={variant}
        data-tds-guide-lines={
          showGuideLines === "hover" ? "hover" : dataAttr(showGuideLines)
        }
      />
    </TreeCollapsingContext.Provider>
  );
};

TreeRoot.displayName = "Tree";

type TreeItemProps<T extends object> = AriaTreeItemProps<T>;

// A row, holding a Tree.ItemContent and any child rows
const TreeItem = <T extends object>(
  props: TreeItemProps<T>
): React.ReactElement => {
  return <AriaTreeItem {...props} data-tds="tree-item" />;
};

TreeItem.displayName = "Tree.Item";

const TreeItemStateContext = createContext<TreeItemContentRenderProps | null>(
  null
);

type TreeItemContentProps = {
  children:
    | ReactNode
    | ((renderProps: TreeItemContentRenderProps) => ReactNode);
};

// What the row shows, laid out in a line in the order given
const TreeItemContent = ({ children }: TreeItemContentProps): ReactNode => {
  return (
    <AriaTreeItemContent>
      {(renderProps) => (
        <TreeItemStateContext.Provider value={renderProps}>
          {typeof children === "function" ? children(renderProps) : children}
        </TreeItemStateContext.Provider>
      )}
    </AriaTreeItemContent>
  );
};

TreeItemContent.displayName = "Tree.ItemContent";

type TreeIndicatorProps = Omit<AriaButtonProps, "children" | "slot"> & {
  /** Replaces the chevron, which turns to point down while expanded */
  children?: ReactNode;
};

// Expands and collapses its row, at the start or end, wherever it's placed.
// A row without children keeps its space, so labels line up
const TreeIndicator = forwardRef<HTMLButtonElement, TreeIndicatorProps>(
  ({ children, ...props }, ref) => {
    const state = useContext(TreeItemStateContext);
    const collapsingKeys = useContext(TreeCollapsingContext);

    if (!state?.hasChildItems) {
      return <span data-tds="tree-indicator" aria-hidden="true" />;
    }

    return (
      <AriaButton
        {...props}
        ref={ref}
        slot="chevron"
        data-tds="tree-indicator"
        data-expanded={dataAttr(
          state.isExpanded && !collapsingKeys.has(state.id)
        )}
      >
        <span data-tds="tree-indicator-icon">
          {children ?? <ChevronRightIcon size={16} />}
        </span>
      </AriaButton>
    );
  }
);

TreeIndicator.displayName = "Tree.Indicator";

type TreeItemLabelProps = ComponentPropsWithoutRef<"span">;

// The row's name, cut short with an ellipsis when it doesn't fit
const TreeItemLabel = forwardRef<HTMLSpanElement, TreeItemLabelProps>(
  (props, ref) => {
    return <span {...props} ref={ref} data-tds="tree-item-label" />;
  }
);

TreeItemLabel.displayName = "Tree.ItemLabel";

type TreeLoadMoreItemProps = AriaTreeLoadMoreItemProps;

// A row at the end of a level that loads more of it when scrolled into view,
// showing a spinner while it does. As a group's only child, it loads the
// group's children when the group expands
const TreeLoadMoreItem = ({
  children,
  style,
  ...props
}: TreeLoadMoreItemProps): React.ReactElement => {
  return (
    <AriaTreeLoadMoreItem
      {...props}
      // react-aria sets the level variable on items, not on this row
      style={(renderProps) =>
        ({
          "--tree-item-level": renderProps.level,
          ...(typeof style === "function" ? style(renderProps) : style)
        }) as CSSProperties
      }
      data-tds="tree-load-more-item"
    >
      {children ?? <Spinner size="sm" aria-label="Loading…" />}
    </AriaTreeLoadMoreItem>
  );
};

TreeLoadMoreItem.displayName = "Tree.LoadMoreItem";

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
};
