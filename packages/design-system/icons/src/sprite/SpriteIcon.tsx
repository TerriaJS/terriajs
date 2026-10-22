import { createContext, forwardRef, useContext, type ReactNode } from "react";
import type { IconProps } from "../IconProps";
import type { IconName } from "./names";

// Where the app serves sprite.svg. Without a provider, icons draw from a
// sprite inlined in the page
const SpriteHrefContext = createContext("");

export const IconSpriteProvider = ({
  href,
  children
}: {
  href: string;
  children: ReactNode;
}): ReactNode => (
  // .Provider, not the context itself: apps on React 18 don't have that
  <SpriteHrefContext.Provider value={href}>{children}</SpriteHrefContext.Provider>
);

// An icon drawn from the sprite: like the icon components, 24px unless given
// a size, hidden from assistive technology unless it has a label, and then
// an image with it
export const SpriteIcon = forwardRef<
  SVGSVGElement,
  IconProps & { name: IconName }
>(({ name, size = 24, ...props }, ref) => {
  const href = useContext(SpriteHrefContext);
  const isLabelled =
    props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined;
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden={isLabelled ? undefined : true}
      role={isLabelled ? "img" : undefined}
      {...props}
    >
      <use href={`${href}#${name}`} />
    </svg>
  );
});

SpriteIcon.displayName = "SpriteIcon";
