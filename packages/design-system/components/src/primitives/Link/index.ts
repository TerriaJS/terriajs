import { LinkIcon, LinkRoot } from "./Link";

// Compound component, assembled here so Link.tsx only exports components
export const Link = Object.assign(LinkRoot, {
  Root: LinkRoot,
  Icon: LinkIcon
});

export { LinkIcon, LinkRoot };
export type { LinkIconProps, LinkProps } from "./Link";
