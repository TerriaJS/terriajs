import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Keyboard } from "react-aria-components/Keyboard";
import { KBD_KEYS, type KbdKey } from "./keys";
import "./Kbd.css";

export type KbdVariant = "default" | "light";

export type KbdProps = ComponentPropsWithoutRef<"kbd"> & {
  /** Default sits on a filled key; light has no fill, as in a menu */
  variant?: KbdVariant;
};

// A keyboard shortcut. In a Dropdown item, react-aria links it to the item
// as its description
export const KbdRoot = forwardRef<HTMLElement, KbdProps>(
  ({ variant = "default", ...props }, ref) => {
    return (
      <Keyboard
        {...props}
        ref={ref}
        data-tds="kbd"
        data-tds-variant={variant}
      />
    );
  }
);

KbdRoot.displayName = "Kbd";

export type KbdAbbrProps = Omit<
  ComponentPropsWithoutRef<"abbr">,
  "children" | "title"
> & {
  keyValue: KbdKey;
};

// A key's symbol, with its name as the title: a modifier, or a key like
// Enter or an arrow
export const KbdAbbr = forwardRef<HTMLElement, KbdAbbrProps>(
  ({ keyValue, ...props }, ref) => {
    const { symbol, title } = KBD_KEYS[keyValue];

    return (
      <abbr {...props} ref={ref} title={title} data-tds="kbd-abbr">
        {symbol}
      </abbr>
    );
  }
);

KbdAbbr.displayName = "Kbd.Abbr";

export type KbdContentProps = ComponentPropsWithoutRef<"span">;

// The key itself, after any modifiers
export const KbdContent = forwardRef<HTMLSpanElement, KbdContentProps>(
  (props, ref) => {
    return <span {...props} ref={ref} data-tds="kbd-content" />;
  }
);

KbdContent.displayName = "Kbd.Content";
