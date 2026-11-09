import { forwardRef, type ComponentPropsWithoutRef } from "react";
import type { DOMRenderProps } from "react-aria-components";
import { Surface, type SurfaceProps } from "../Surface";
import "./Card.css";

// Like react-aria components, each part takes `render` to swap in a custom
// element of the same type, such as a title at another heading level
type PartProps<E extends "div" | "h3" | "p"> = ComponentPropsWithoutRef<E> &
  DOMRenderProps<E, undefined>;

type CardProps = SurfaceProps;

// A Surface laying out a header, content and footer, which are yours: an
// image, buttons, links. A CloseButton directly in it sits in the top corner
const CardRoot = forwardRef<HTMLDivElement, CardProps>((props, ref) => {
  return <Surface {...props} ref={ref} data-tds-card="" />;
});

CardRoot.displayName = "Card";

type CardHeaderProps = PartProps<"div">;

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ render, ...props }, ref) => {
    const headerProps = { ...props, ref, "data-tds": "card-header" };
    return render ? render(headerProps, undefined) : <div {...headerProps} />;
  }
);

CardHeader.displayName = "Card.Header";

type CardTitleProps = PartProps<"h3">;

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ render, children, ...props }, ref) => {
    const titleProps = { ...props, ref, "data-tds": "card-title" };
    return render ? (
      render({ ...titleProps, children }, undefined)
    ) : (
      <h3 {...titleProps}>{children}</h3>
    );
  }
);

CardTitle.displayName = "Card.Title";

type CardDescriptionProps = PartProps<"p">;

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ render, ...props }, ref) => {
    const descriptionProps = { ...props, ref, "data-tds": "card-description" };
    return render ? (
      render(descriptionProps, undefined)
    ) : (
      <p {...descriptionProps} />
    );
  }
);

CardDescription.displayName = "Card.Description";

type CardContentProps = PartProps<"div">;

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ render, ...props }, ref) => {
    const contentProps = { ...props, ref, "data-tds": "card-content" };
    return render ? render(contentProps, undefined) : <div {...contentProps} />;
  }
);

CardContent.displayName = "Card.Content";

type CardFooterProps = PartProps<"div">;

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ render, ...props }, ref) => {
    const footerProps = { ...props, ref, "data-tds": "card-footer" };
    return render ? render(footerProps, undefined) : <div {...footerProps} />;
  }
);

CardFooter.displayName = "Card.Footer";

export {
  CardRoot,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
};
export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps
};
