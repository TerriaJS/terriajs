import {
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationNextIcon,
  PaginationPrevious,
  PaginationPreviousIcon,
  PaginationRoot,
  PaginationSummary
} from "./Pagination";

// Compound component, assembled here so Pagination.tsx only exports
// components
export const Pagination = Object.assign(PaginationRoot, {
  Root: PaginationRoot,
  Summary: PaginationSummary,
  Content: PaginationContent,
  Item: PaginationItem,
  Link: PaginationLink,
  Previous: PaginationPrevious,
  PreviousIcon: PaginationPreviousIcon,
  Next: PaginationNext,
  NextIcon: PaginationNextIcon,
  Ellipsis: PaginationEllipsis
});

export {
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationNextIcon,
  PaginationPrevious,
  PaginationPreviousIcon,
  PaginationRoot,
  PaginationSummary
};
export type {
  PaginationContentProps,
  PaginationEllipsisProps,
  PaginationIconProps,
  PaginationItemProps,
  PaginationLinkProps,
  PaginationNextProps,
  PaginationPreviousProps,
  PaginationProps,
  PaginationSize,
  PaginationSummaryProps
} from "./Pagination";
