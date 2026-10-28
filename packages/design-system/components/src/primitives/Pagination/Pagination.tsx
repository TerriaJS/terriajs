import { ChevronLeftIcon, ChevronRightIcon } from "@terria/design-system-icons";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps
} from "react-aria-components/Button";
import { dataAttr } from "../../utils/dataAttr";
import "./Pagination.css";

type PaginationSize = "sm" | "md" | "lg";

type PaginationProps = ComponentPropsWithoutRef<"nav"> & {
  size?: PaginationSize;
};

// A Summary of what's shown, and the Content: Items holding Previous, the
// page Links and Ellipses, and Next. It only shows the pages; the app keeps
// the current one and decides which to list
const PaginationRoot = forwardRef<HTMLElement, PaginationProps>(
  ({ size = "md", ...props }, ref) => {
    return (
      <nav
        aria-label="pagination"
        {...props}
        ref={ref}
        data-tds="pagination"
        data-tds-size={size}
      />
    );
  }
);

PaginationRoot.displayName = "Pagination";

type PaginationSummaryProps = ComponentPropsWithoutRef<"div">;

// What's shown, such as 1 to 5 of 50 layers. Its direction comes from its own
// text, so a right-to-left page doesn't reorder the numbers and words
const PaginationSummary = forwardRef<HTMLDivElement, PaginationSummaryProps>(
  (props, ref) => {
    return (
      <div dir="auto" {...props} ref={ref} data-tds="pagination-summary" />
    );
  }
);

PaginationSummary.displayName = "Pagination.Summary";

type PaginationContentProps = ComponentPropsWithoutRef<"ul">;

const PaginationContent = forwardRef<HTMLUListElement, PaginationContentProps>(
  (props, ref) => {
    return <ul {...props} ref={ref} data-tds="pagination-content" />;
  }
);

PaginationContent.displayName = "Pagination.Content";

type PaginationItemProps = ComponentPropsWithoutRef<"li">;

const PaginationItem = forwardRef<HTMLLIElement, PaginationItemProps>(
  (props, ref) => {
    return <li {...props} ref={ref} data-tds="pagination-item" />;
  }
);

PaginationItem.displayName = "Pagination.Item";

type PaginationLinkProps = AriaButtonProps & {
  /** The page shown now */
  isActive?: boolean;
};

const PaginationLink = forwardRef<HTMLButtonElement, PaginationLinkProps>(
  ({ isActive, ...props }, ref) => {
    return (
      <AriaButton
        aria-current={isActive ? "page" : undefined}
        {...props}
        ref={ref}
        data-tds="pagination-link"
        data-active={dataAttr(isActive)}
      />
    );
  }
);

PaginationLink.displayName = "Pagination.Link";

type PaginationPreviousProps = AriaButtonProps;

const PaginationPrevious = forwardRef<
  HTMLButtonElement,
  PaginationPreviousProps
>((props, ref) => {
  return (
    <AriaButton
      {...props}
      ref={ref}
      data-tds="pagination-link"
      data-tds-nav="previous"
    />
  );
});

PaginationPrevious.displayName = "Pagination.Previous";

type PaginationNextProps = AriaButtonProps;

const PaginationNext = forwardRef<HTMLButtonElement, PaginationNextProps>(
  (props, ref) => {
    return (
      <AriaButton
        {...props}
        ref={ref}
        data-tds="pagination-link"
        data-tds-nav="next"
      />
    );
  }
);

PaginationNext.displayName = "Pagination.Next";

type PaginationIconProps = ComponentPropsWithoutRef<"span">;

// A chevron pointing back, unless children replace it; it turns round right
// to left
const PaginationPreviousIcon = forwardRef<HTMLSpanElement, PaginationIconProps>(
  ({ children, ...props }, ref) => {
    return (
      <span
        aria-hidden="true"
        {...props}
        ref={ref}
        data-tds="pagination-previous-icon"
      >
        {children ?? <ChevronLeftIcon />}
      </span>
    );
  }
);

PaginationPreviousIcon.displayName = "Pagination.PreviousIcon";

const PaginationNextIcon = forwardRef<HTMLSpanElement, PaginationIconProps>(
  ({ children, ...props }, ref) => {
    return (
      <span
        aria-hidden="true"
        {...props}
        ref={ref}
        data-tds="pagination-next-icon"
      >
        {children ?? <ChevronRightIcon />}
      </span>
    );
  }
);

PaginationNextIcon.displayName = "Pagination.NextIcon";

type PaginationEllipsisProps = Omit<
  ComponentPropsWithoutRef<"span">,
  "children"
>;

// Pages left out between the listed ones
const PaginationEllipsis = forwardRef<HTMLSpanElement, PaginationEllipsisProps>(
  (props, ref) => {
    return (
      <span
        aria-hidden="true"
        {...props}
        ref={ref}
        data-tds="pagination-ellipsis"
      >
        &hellip;
      </span>
    );
  }
);

PaginationEllipsis.displayName = "Pagination.Ellipsis";

export {
  PaginationRoot,
  PaginationSummary,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationPreviousIcon,
  PaginationNext,
  PaginationNextIcon,
  PaginationEllipsis
};
export type {
  PaginationSize,
  PaginationProps,
  PaginationSummaryProps,
  PaginationContentProps,
  PaginationItemProps,
  PaginationLinkProps,
  PaginationPreviousProps,
  PaginationNextProps,
  PaginationIconProps,
  PaginationEllipsisProps
};
