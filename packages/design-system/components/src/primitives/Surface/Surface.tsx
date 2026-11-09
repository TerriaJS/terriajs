import { forwardRef, type ComponentPropsWithoutRef } from "react";
import "./Surface.css";

type SurfaceVariant = "default" | "secondary" | "tertiary" | "transparent";

type SurfaceProps = ComponentPropsWithoutRef<"div"> & {
  variant?: SurfaceVariant;
};

// A rounded background for grouped content, like a card or a panel's
// contents. It sets no padding: the content inside it does
const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  ({ variant = "default", ...props }, ref) => {
    return (
      <div {...props} ref={ref} data-tds="surface" data-tds-variant={variant} />
    );
  }
);

Surface.displayName = "Surface";

export { Surface };
export type { SurfaceProps, SurfaceVariant };
