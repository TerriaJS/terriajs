import { ChevronRightIcon } from "@terria/design-system-icons";
import { createContext, forwardRef, useContext, type ReactNode } from "react";
import {
  Breadcrumb as AriaBreadcrumb,
  Breadcrumbs as AriaBreadcrumbs,
  type BreadcrumbProps as AriaBreadcrumbProps,
  type BreadcrumbsProps as AriaBreadcrumbsProps
} from "react-aria-components/Breadcrumbs";
import {
  Link as AriaLink,
  type LinkProps as AriaLinkProps
} from "react-aria-components/Link";
import "./Breadcrumbs.css";
import { useLocalizedStrings } from "../../i18n/useLocalizedStrings";

const SeparatorContext = createContext<ReactNode>(null);

type BreadcrumbsProps = Omit<AriaBreadcrumbsProps<object>, "children"> & {
  children: ReactNode;
  /** Shown between items; a chevron unless set */
  separator?: ReactNode;
};

// A navigation landmark, named "Breadcrumbs" (localized) unless given an aria-label, around
// the list of items. The last item is the current page
const BreadcrumbsRoot = forwardRef<HTMLOListElement, BreadcrumbsProps>(
  ({ "aria-label": ariaLabel, separator, ...props }, ref) => {
    const strings = useLocalizedStrings();

    return (
      <nav aria-label={ariaLabel ?? strings.format("breadcrumbs.label")}>
        <SeparatorContext.Provider value={separator}>
          <AriaBreadcrumbs {...props} ref={ref} data-tds="breadcrumbs" />
        </SeparatorContext.Provider>
      </nav>
    );
  }
);

BreadcrumbsRoot.displayName = "Breadcrumbs";

type BreadcrumbsItemProps = Pick<
  AriaBreadcrumbProps,
  "id" | "className" | "style"
> &
  Omit<AriaLinkProps, "children" | "className" | "style"> & {
    children: ReactNode;
  };

// A link to a level above, or the current page as the last item. Without an
// href it's pressed like a button; the trail's onAction gets its id
const BreadcrumbsItem = forwardRef<HTMLLIElement, BreadcrumbsItemProps>(
  ({ id, className, style, children, ...linkProps }, ref) => {
    const separator = useContext(SeparatorContext);

    return (
      <AriaBreadcrumb
        id={id}
        className={className}
        style={style}
        ref={ref}
        data-tds="breadcrumbs-item"
      >
        {({ isCurrent }) => (
          <>
            <AriaLink {...linkProps} data-tds="breadcrumbs-link">
              {children}
            </AriaLink>
            {!isCurrent && (
              <span aria-hidden data-tds="breadcrumbs-separator">
                {separator ?? <ChevronRightIcon size={12} />}
              </span>
            )}
          </>
        )}
      </AriaBreadcrumb>
    );
  }
);

BreadcrumbsItem.displayName = "Breadcrumbs.Item";

export { BreadcrumbsRoot, BreadcrumbsItem };
export type { BreadcrumbsProps, BreadcrumbsItemProps };
