import { ChevronUpIcon } from "@terria/design-system-icons";
import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactNode
} from "react";
import {
  Cell as AriaCell,
  Collection as AriaCollection,
  Column as AriaColumn,
  ColumnResizer as AriaColumnResizer,
  ResizableTableContainer as AriaResizableTableContainer,
  Row as AriaRow,
  Table as AriaTable,
  TableBody as AriaTableBody,
  TableHeader as AriaTableHeader,
  TableLoadMoreItem as AriaTableLoadMoreItem,
  type CellProps as AriaCellProps,
  type ColumnProps as AriaColumnProps,
  type ColumnResizerProps as AriaColumnResizerProps,
  type ResizableTableContainerProps as AriaResizableTableContainerProps,
  type RowProps as AriaRowProps,
  type TableBodyProps as AriaTableBodyProps,
  type TableHeaderProps as AriaTableHeaderProps,
  type TableLoadMoreItemProps as AriaTableLoadMoreItemProps,
  type TableProps as AriaTableProps
} from "react-aria-components/Table";
import "./Table.css";

type TableVariant = "primary" | "secondary";

type TableProps = ComponentPropsWithoutRef<"div"> & {
  /** Primary: a card around the header and rows, which sit on their own
   * panel. Secondary: the header is a card of its own, the rows open */
  variant?: TableVariant;
};

// The frame: a ScrollContainer, or ResizableContainer, holding the Content,
// and a Footer below it
const TableRoot = forwardRef<HTMLDivElement, TableProps>(
  ({ variant = "primary", ...props }, ref) => {
    return (
      <div {...props} ref={ref} data-tds="table" data-tds-variant={variant} />
    );
  }
);

TableRoot.displayName = "Table";

type TableScrollContainerProps = ComponentPropsWithoutRef<"div">;

// Scrolls a table wider than its frame, while the footer stays the frame's
// width
const TableScrollContainer = forwardRef<
  HTMLDivElement,
  TableScrollContainerProps
>((props, ref) => {
  return <div {...props} ref={ref} data-tds="table-scroll-container" />;
});

TableScrollContainer.displayName = "Table.ScrollContainer";

type TableContentProps = AriaTableProps;

// The table itself: a Header and a Body. Tab moves out of it, and the arrow
// keys move within it
const TableContent = forwardRef<HTMLTableElement, TableContentProps>(
  ({ keyboardNavigationBehavior = "tab", ...props }, ref) => {
    return (
      <AriaTable
        keyboardNavigationBehavior={keyboardNavigationBehavior}
        {...props}
        ref={ref}
        data-tds="table-content"
      />
    );
  }
);

TableContent.displayName = "Table.Content";

type TableHeaderProps<T extends object> = AriaTableHeaderProps<T>;

const TableHeader = <T extends object>(
  props: TableHeaderProps<T>
): React.ReactElement => {
  return <AriaTableHeader<T> {...props} data-tds="table-header" />;
};

TableHeader.displayName = "Table.Header";

type RenderColumn = (...args: never[]) => unknown;

// A column drawn by a function has no text to name it by, so it's given one:
// screen readers say it when the table is sorted by it
type TableColumnProps =
  | (AriaColumnProps & {
      children?: Exclude<AriaColumnProps["children"], RenderColumn>;
    })
  | (AriaColumnProps & {
      children: Extract<AriaColumnProps["children"], RenderColumn>;
      textValue: string;
    });

const TableColumn = forwardRef<HTMLTableCellElement, TableColumnProps>(
  (props, ref) => {
    return <AriaColumn {...props} ref={ref} data-tds="table-column" />;
  }
);

TableColumn.displayName = "Table.Column";

type TableBodyProps<T extends object> = AriaTableBodyProps<T>;

const TableBody = <T extends object>(
  props: TableBodyProps<T>
): React.ReactElement => {
  return <AriaTableBody<T> {...props} data-tds="table-body" />;
};

TableBody.displayName = "Table.Body";

type TableRowProps<T extends object> = AriaRowProps<T>;

const TableRow = <T extends object>(
  props: TableRowProps<T>
): React.ReactElement => {
  return <AriaRow<T> {...props} data-tds="table-row" />;
};

TableRow.displayName = "Table.Row";

type TableCellProps = AriaCellProps;

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  (props, ref) => {
    return <AriaCell {...props} ref={ref} data-tds="table-cell" />;
  }
);

TableCell.displayName = "Table.Cell";

type TableFooterProps = ComponentPropsWithoutRef<"div">;

// Below the table, outside it: totals, or Pagination
const TableFooter = forwardRef<HTMLDivElement, TableFooterProps>(
  (props, ref) => {
    return <div {...props} ref={ref} data-tds="table-footer" />;
  }
);

TableFooter.displayName = "Table.Footer";

type TableResizableContainerProps = AriaResizableTableContainerProps;

// In place of the ScrollContainer, for columns with a ColumnResizer
const TableResizableContainer = forwardRef<
  HTMLDivElement,
  TableResizableContainerProps
>((props, ref) => {
  return (
    <AriaResizableTableContainer
      {...props}
      ref={ref}
      data-tds="table-resizable-container"
    />
  );
});

TableResizableContainer.displayName = "Table.ResizableContainer";

type TableColumnResizerProps = AriaColumnResizerProps;

// Dragged, or moved with the arrow keys, to widen or narrow its column; it
// takes the place of the separator at the column's end
const TableColumnResizer = forwardRef<HTMLDivElement, TableColumnResizerProps>(
  (props, ref) => {
    return (
      <AriaColumnResizer {...props} ref={ref} data-tds="table-column-resizer" />
    );
  }
);

TableColumnResizer.displayName = "Table.ColumnResizer";

type TableLoadMoreItemProps = AriaTableLoadMoreItemProps;

// The last row, while there are more to load: calls onLoadMore as it scrolls
// into view
const TableLoadMoreItem = forwardRef<
  HTMLTableRowElement,
  TableLoadMoreItemProps
>((props, ref) => {
  return (
    <AriaTableLoadMoreItem {...props} ref={ref} data-tds="table-load-more" />
  );
});

TableLoadMoreItem.displayName = "Table.LoadMore";

type TableLoadMoreContentProps = ComponentPropsWithoutRef<"div">;

// What LoadMore shows while loading, such as a Spinner
const TableLoadMoreContent = forwardRef<
  HTMLDivElement,
  TableLoadMoreContentProps
>((props, ref) => {
  return <div {...props} ref={ref} data-tds="table-load-more-content" />;
});

TableLoadMoreContent.displayName = "Table.LoadMoreContent";

type TableSortDirection = "ascending" | "descending";

type TableSortableColumnHeaderProps = ComponentPropsWithoutRef<"span"> & {
  /** The column's sortDirection, from Table.Column's render function */
  sortDirection?: TableSortDirection;
  /** Shows the indicator while the column is sorted */
  showIndicator?: boolean;
  /** Replaces the chevron; it's given data-direction */
  indicator?: ReactNode;
};

// A sortable column's label, and a chevron while it's sorted: up ascending,
// down descending
const TableSortableColumnHeader = forwardRef<
  HTMLSpanElement,
  TableSortableColumnHeaderProps
>(
  (
    { children, sortDirection, showIndicator = true, indicator, ...props },
    ref
  ) => {
    const marks = {
      "data-tds": "table-sort-indicator",
      "data-direction": sortDirection
    };
    const mark =
      indicator === undefined ? (
        <ChevronUpIcon aria-hidden {...marks} />
      ) : isValidElement(indicator) ? (
        // eslint-disable-next-line @eslint-react/no-clone-element -- Marks a custom indicator, as the default chevron is, so it turns and sizes the same
        cloneElement(indicator, marks)
      ) : (
        indicator
      );

    return (
      <span
        {...props}
        ref={ref}
        data-tds="table-sort-header"
        data-direction={sortDirection}
      >
        {children}
        {showIndicator && sortDirection !== undefined && mark}
      </span>
    );
  }
);

TableSortableColumnHeader.displayName = "Table.SortableColumnHeader";

// Dynamic cells within a row, beside static ones like a selection checkbox
const TableCollection = AriaCollection;

export {
  TableRoot,
  TableScrollContainer,
  TableContent,
  TableHeader,
  TableColumn,
  TableColumnResizer,
  TableBody,
  TableRow,
  TableCell,
  TableFooter,
  TableCollection,
  TableLoadMoreItem,
  TableLoadMoreContent,
  TableResizableContainer,
  TableSortableColumnHeader
};
export type {
  TableVariant,
  TableProps,
  TableScrollContainerProps,
  TableContentProps,
  TableHeaderProps,
  TableColumnProps,
  TableColumnResizerProps,
  TableBodyProps,
  TableRowProps,
  TableCellProps,
  TableFooterProps,
  TableLoadMoreItemProps,
  TableLoadMoreContentProps,
  TableResizableContainerProps,
  TableSortableColumnHeaderProps,
  TableSortDirection
};
