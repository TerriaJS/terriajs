import { CheckIcon, CopyIcon } from "@terria/design-system-icons";
import { useState, type ReactNode } from "react";
import { Button } from "../primitives/Button";
import { token } from "./tokens";

// Copies text to the clipboard. Shows a check once it has, until the pointer
// or focus moves on
export const CopyButton = ({
  text,
  label
}: {
  text: string;
  label: string;
}): ReactNode => {
  const [isCopied, setIsCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      isIconOnly
      className="docs-copy"
      aria-label={isCopied ? `Copied ${label}` : `Copy ${label}`}
      onPress={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setIsCopied(true);
        });
      }}
      onHoverEnd={() => {
        setIsCopied(false);
      }}
      onBlur={() => {
        setIsCopied(false);
      }}
    >
      {isCopied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  );
};

// A token's name, as code that wraps at its hyphens, with a button that
// copies the whole var(), the way to use it
export const TokenName = ({ name }: { name: string }): ReactNode => (
  <span className="docs-token">
    <code>{name}</code>
    <CopyButton text={token(name)} label={token(name)} />
  </span>
);

// A short CSS example of a section's tokens in use
export const Usage = ({ code }: { code: string }): ReactNode => (
  <figure className="docs-usage">
    <pre>
      <code>{code}</code>
    </pre>
    <CopyButton text={code} label="the example" />
  </figure>
);

// The same examples twice, in a light and a dark region
export const Themes = ({
  layout,
  children
}: {
  // Side by side, or one above the other for long rows
  layout: "columns" | "rows";
  children: ReactNode;
}): ReactNode => (
  <div className="docs-themes" data-layout={layout}>
    {(["light", "dark"] as const).map((theme) => (
      <section
        key={theme}
        data-theme={theme}
        className="docs-theme tds-flow"
        aria-label={theme === "light" ? "Light theme" : "Dark theme"}
      >
        <p className="docs-caption">{theme === "light" ? "Light" : "Dark"}</p>
        {children}
      </section>
    ))}
  </div>
);
