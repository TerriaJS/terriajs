import {
  TableBody,
  TableCell,
  TableCollection,
  TableColumn,
  TableColumnResizer,
  TableContent,
  TableFooter,
  TableHeader,
  TableLoadMoreContent,
  TableLoadMoreItem,
  TableResizableContainer,
  TableRoot,
  TableRow,
  TableScrollContainer,
  TableSortableColumnHeader
} from "./Table";

// Compound component, assembled here so Table.tsx only exports components
export const Table = Object.assign(TableRoot, {
  Root: TableRoot,
  ScrollContainer: TableScrollContainer,
  Content: TableContent,
  Header: TableHeader,
  Column: TableColumn,
  ColumnResizer: TableColumnResizer,
  Body: TableBody,
  Row: TableRow,
  Cell: TableCell,
  Footer: TableFooter,
  Collection: TableCollection,
  LoadMore: TableLoadMoreItem,
  LoadMoreContent: TableLoadMoreContent,
  ResizableContainer: TableResizableContainer,
  SortableColumnHeader: TableSortableColumnHeader
});

export {
  TableBody,
  TableCell,
  TableCollection,
  TableColumn,
  TableColumnResizer,
  TableContent,
  TableFooter,
  TableHeader,
  TableLoadMoreContent,
  TableLoadMoreItem,
  TableResizableContainer,
  TableRoot,
  TableRow,
  TableScrollContainer,
  TableSortableColumnHeader
};
export type {
  TableBodyProps,
  TableCellProps,
  TableColumnProps,
  TableColumnResizerProps,
  TableContentProps,
  TableFooterProps,
  TableHeaderProps,
  TableLoadMoreContentProps,
  TableLoadMoreItemProps,
  TableProps,
  TableResizableContainerProps,
  TableRowProps,
  TableScrollContainerProps,
  TableSortableColumnHeaderProps,
  TableSortDirection,
  TableVariant
} from "./Table";
