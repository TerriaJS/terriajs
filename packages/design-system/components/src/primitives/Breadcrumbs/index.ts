import { BreadcrumbsItem, BreadcrumbsRoot } from "./Breadcrumbs";

// Compound component, assembled here so Breadcrumbs.tsx only exports components
export const Breadcrumbs = Object.assign(BreadcrumbsRoot, {
  Root: BreadcrumbsRoot,
  Item: BreadcrumbsItem
});

export { BreadcrumbsItem, BreadcrumbsRoot };
export type { BreadcrumbsItemProps, BreadcrumbsProps } from "./Breadcrumbs";
