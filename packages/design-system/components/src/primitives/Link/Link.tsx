import { LinkExternalIcon } from "@terria/design-system-icons";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import {
  Link as AriaLink,
  type LinkProps as AriaLinkProps
} from "react-aria-components/Link";
import "./Link.css";

type LinkProps = AriaLinkProps;

// Goes to its href, or does what onPress does. It takes the text's size
// around it, so it sits in a sentence as in a panel
const LinkRoot = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  return <AriaLink {...props} ref={ref} data-tds="link" />;
});

LinkRoot.displayName = "Link";

type LinkIconProps = ComponentPropsWithoutRef<"span">;

// Decorative: an external-link arrow after the text, unless children
// replace it
const LinkIcon = forwardRef<HTMLSpanElement, LinkIconProps>(
  ({ children, ...props }, ref) => {
    return (
      <span {...props} ref={ref} aria-hidden data-tds="link-icon">
        {children ?? <LinkExternalIcon />}
      </span>
    );
  }
);

LinkIcon.displayName = "Link.Icon";

export { LinkRoot, LinkIcon };
export type { LinkProps, LinkIconProps };
