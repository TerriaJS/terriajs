import type { Meta, StoryObj } from "@storybook/react-vite";
import { Check, Copy } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "../primitives/Button";
import { figmaDesign } from "../figma";
import "./docs.stories.css";
import "./Colors.stories.css";

const meta = {
  title: "Foundations/Colors",
  parameters: figmaDesign("Colors"),
  // Colors.mdx is the docs page
  tags: ["!autodocs"]
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const token = (name: string): string => `var(--terria-ds-${name})`;

// Which token a swatch shows is data, so it goes in as custom properties for
// Colors.stories.css to style with
const colors = (properties: Record<string, string>): CSSProperties =>
  properties;

// Copies text to the clipboard. Shows a check once it has, until the pointer
// or focus moves on
const CopyButton = ({
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
      {isCopied ? <Check /> : <Copy />}
    </Button>
  );
};

// Long names, so code that wraps at its hyphens rather than a chip. Copying
// gives the whole var(), the way to use it
const TokenName = ({ name }: { name: string }): ReactNode => (
  <span className="color-token">
    <code>{name}</code>
    <CopyButton text={token(name)} label={token(name)} />
  </span>
);

// A short CSS example of a section's tokens in use
const Usage = ({ code }: { code: string }): ReactNode => (
  <figure className="docs-usage">
    <pre>
      <code>{code}</code>
    </pre>
    <CopyButton text={code} label="the example" />
  </figure>
);

// The same colours twice, in a light and a dark region
const Themes = ({
  layout,
  children
}: {
  // Side by side, or one above the other for long rows of swatches
  layout: "columns" | "rows";
  children: ReactNode;
}): ReactNode => (
  <div className="color-themes" data-layout={layout}>
    {(["light", "dark"] as const).map((theme) => (
      <section
        key={theme}
        data-theme={theme}
        className="color-theme tds-flow"
        aria-label={theme === "light" ? "Light theme" : "Dark theme"}
      >
        <p className="docs-caption">{theme === "light" ? "Light" : "Dark"}</p>
        {children}
      </section>
    ))}
  </div>
);

// A role's colour with its hover and foreground colours on it, as the Figma
// page shows them
const Role = ({ name, base }: { name: string; base: string }): ReactNode => (
  <figure className="color-role tds-flow">
    <div
      className="color-role-card"
      style={colors({
        "--_role": token(base),
        "--_role-hover": token(`${base}-hover`),
        "--_role-foreground": token(`${base}-foreground`)
      })}
    >
      <span>{name}</span>
      <span className="color-role-hover">Hover</span>
      <span className="color-role-foreground">Foreground</span>
    </div>
    <figcaption>
      <TokenName name={base} />
    </figcaption>
  </figure>
);

const roleUsage = (base: string, selector: string): string => `${selector} {
  background-color: ${token(base)};
  color: ${token(`${base}-foreground`)};
}

${selector}:hover {
  background-color: ${token(`${base}-hover`)};
}

${selector}-subtle {
  background-color: ${token(`${base}-soft`)};
  color: ${token(`${base}-soft-foreground`)};
}`;

const Roles = ({
  name,
  base,
  selector
}: {
  name: string;
  base: string;
  // What the usage example styles
  selector: string;
}): ReactNode => (
  <div className="tds-flow">
    <Themes layout="columns">
      <div className="color-roles">
        <Role name={name} base={base} />
        <Role name={`${name} soft`} base={`${base}-soft`} />
      </div>
    </Themes>
    <Usage code={roleUsage(base, selector)} />
  </div>
);

type SwatchProps = { name: string; token: string };

const Swatch = ({ name, token: tokenName }: SwatchProps): ReactNode => (
  <figure className="color-swatch tds-flow">
    <span
      className="color-swatch-chip"
      style={colors({ "--_swatch": token(tokenName) })}
    />
    <figcaption className="tds-flow">
      <span className="color-swatch-name">{name}</span>
      <TokenName name={tokenName} />
    </figcaption>
  </figure>
);

const Swatches = ({
  swatches,
  usage
}: {
  swatches: SwatchProps[];
  usage: string;
}): ReactNode => (
  <div className="tds-flow">
    <Themes layout="rows">
      <div className="color-swatches">
        {swatches.map((swatch) => (
          <Swatch key={swatch.token} {...swatch} />
        ))}
      </div>
    </Themes>
    <Usage code={usage} />
  </div>
);

// Shown in Colors.mdx only, not in the sidebar
const docsOnly = ["!dev"];

export const Accent: Story = {
  tags: docsOnly,
  render: () => (
    <Roles name="Accent" base="primary" selector=".primary-action" />
  )
};

export const Default: Story = {
  tags: docsOnly,
  render: () => <Roles name="Default" base="neutral" selector=".tag" />
};

export const Success: Story = {
  tags: docsOnly,
  render: () => (
    <Roles name="Success" base="success" selector=".success-message" />
  )
};

export const Warning: Story = {
  tags: docsOnly,
  render: () => (
    <Roles name="Warning" base="warning" selector=".warning-message" />
  )
};

export const Danger: Story = {
  tags: docsOnly,
  render: () => <Roles name="Danger" base="danger" selector=".error-message" />
};

export const Foreground: Story = {
  tags: docsOnly,
  render: () => (
    <Swatches
      swatches={[
        { name: "Foreground", token: "text-foreground" },
        { name: "Muted", token: "text-muted" },
        { name: "Disabled", token: "text-disabled" },
        { name: "Segment", token: "text-segment" },
        { name: "Inverse", token: "text-inverse" },
        { name: "Link", token: "text-link" }
      ]}
      usage={`.caption {
  color: var(--terria-ds-text-muted);
}

a {
  color: var(--terria-ds-text-link);
}`}
    />
  )
};

export const Background: Story = {
  tags: docsOnly,
  render: () => (
    <Swatches
      swatches={[
        { name: "Background", token: "surface-bg" },
        { name: "Inverse", token: "surface-inverse" }
      ]}
      usage={`body {
  background-color: var(--terria-ds-surface-bg);
  color: var(--terria-ds-text-foreground);
}`}
    />
  )
};

export const Surface: Story = {
  tags: docsOnly,
  render: () => (
    <Swatches
      swatches={[
        { name: "Surface", token: "surface-default" },
        { name: "Raised", token: "surface-raised" },
        { name: "Overlay", token: "surface-overlay" },
        { name: "Tint", token: "surface-tint" },
        { name: "Tint strong", token: "surface-tint-strong" },
        { name: "Glass", token: "surface-glass" },
        { name: "Transparent", token: "surface-transparent" }
      ]}
      usage={`.card {
  background-color: var(--terria-ds-surface-default);
}

.menu {
  background-color: var(--terria-ds-surface-overlay);
}`}
    />
  )
};

export const FormField: Story = {
  tags: docsOnly,
  render: () => (
    <Swatches
      swatches={[
        { name: "Background", token: "field-background" },
        { name: "Hover", token: "field-background-hover" },
        { name: "Focus", token: "field-background-focus" },
        { name: "Foreground", token: "field-foreground" },
        { name: "Placeholder", token: "field-placeholder" },
        { name: "Border", token: "field-border" },
        { name: "Border hover", token: "field-border-hover" },
        { name: "Border focus", token: "field-border-focus" },
        { name: "Border error", token: "field-border-error" }
      ]}
      usage={`.field {
  border: var(--terria-ds-border-width-default) solid
    var(--terria-ds-field-border);
  background-color: var(--terria-ds-field-background);
  color: var(--terria-ds-field-foreground);
}

.field:hover {
  border-color: var(--terria-ds-field-border-hover);
}

.field::placeholder {
  color: var(--terria-ds-field-placeholder);
}`}
    />
  )
};

export const Separator: Story = {
  tags: docsOnly,
  render: () => (
    <Swatches
      swatches={[
        { name: "Subtle", token: "border-color-subtle" },
        { name: "Default", token: "border-color-default" },
        { name: "Strong", token: "border-color-strong" },
        { name: "Accent", token: "border-color-primary" },
        { name: "Success", token: "border-color-success" },
        { name: "Warning", token: "border-color-warning" },
        { name: "Danger", token: "border-color-danger" }
      ]}
      usage={`hr {
  border: 0;
  border-block-start: var(--terria-ds-border-width-default) solid
    var(--terria-ds-border-color-subtle);
}`}
    />
  )
};

export const Other: Story = {
  tags: docsOnly,
  render: () => (
    <Swatches
      swatches={[
        { name: "Border", token: "border" },
        { name: "Backdrop", token: "backdrop" },
        { name: "Overlay", token: "overlay" },
        { name: "Segment", token: "segment" },
        { name: "Focus ring", token: "focus-ring" },
        { name: "Focus halo", token: "focus-ring-halo" }
      ]}
      usage={`.modal-backdrop {
  background-color: var(--terria-ds-backdrop);
}

:focus-visible {
  box-shadow: var(--terria-ds-shadow-focus-ring);
}`}
    />
  )
};

const PRIMITIVE = "--terria-ds-colors-";

// Every primitive colour, in the order tokens.css declares them, read from the
// loaded stylesheet so the palette can't drift from it
const readPrimitives = (): string[] => {
  const names = new Set<string>();
  const visit = (rules: CSSRuleList): void => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        for (const property of Array.from(rule.style)) {
          if (property.startsWith(PRIMITIVE)) {
            names.add(property.slice(PRIMITIVE.length));
          }
        }
      }
      // Layers, and rules nested in rules
      if (rule instanceof CSSGroupingRule) visit(rule.cssRules);
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      visit(sheet.cssRules);
    } catch {
      // A cross-origin stylesheet can't be read, and holds no tokens
    }
  }
  return [...names];
};

type Family = { name: string; colors: { name: string; label: string }[] };

// gray-500 belongs to gray, as 500; a colour without a step (white, or
// alpha-transparent) goes in with the base or alpha colours, by its name
const groupPrimitives = (names: string[]): Family[] => {
  const families = new Map<string, Family>();
  for (const name of names) {
    const step = /-(\d+)$/.exec(name);
    const family = step
      ? name.slice(0, step.index)
      : name.startsWith("alpha-")
        ? "alpha"
        : "base";
    const label = step?.[1] ?? name.replace(/^alpha-/, "");
    const entry = families.get(family) ?? { name: family, colors: [] };
    entry.colors.push({ name, label });
    families.set(family, entry);
  }
  return [...families.values()];
};

// A family's place on the page: base colours, then the near-greys (tinted
// ones like slate included), then the
// rest around the colour wheel by hue (from rose and red through to pink),
// then the alpha colours. Read from each family's middle step, so new
// families sort themselves
const placeFamily = (family: Family): [number, number] => {
  if (family.name === "base") return [0, 0];
  if (family.name.startsWith("alpha")) return [3, 0];
  const middle = family.colors[Math.floor(family.colors.length / 2)];
  const value = middle
    ? getComputedStyle(document.documentElement).getPropertyValue(
        `${PRIMITIVE}${middle.name}`
      )
    : "";
  const [, chroma = "0", hue = "0"] =
    /oklch\([\d.]+%?\s+([\d.]+)\s+([\d.]+)/.exec(value) ?? [];
  return [Number(chroma) < 0.06 ? 1 : 2, Number(hue)];
};

const sortFamilies = (families: Family[]): Family[] =>
  families
    .map((family) => ({ family, place: placeFamily(family) }))
    .sort((a, b) => a.place[0] - b.place[0] || a.place[1] - b.place[1])
    .map(({ family }) => family);

const PaletteFamily = ({ family }: { family: Family }): ReactNode => (
  <div className="color-family">
    <div className="color-family-name">
      <span>{family.name}</span>
    </div>
    <ul className="color-family-steps">
      {family.colors.map((color) => (
        <li key={color.name} title={`${PRIMITIVE}${color.name}`}>
          <span
            className="color-step"
            style={colors({ "--_swatch": token(`colors-${color.name}`) })}
          />
          <span className="color-step-label">{color.label}</span>
        </li>
      ))}
    </ul>
  </div>
);

const Palette = (): ReactNode => {
  const [families] = useState(() =>
    sortFamilies(groupPrimitives(readPrimitives()))
  );
  return (
    <div className="color-palette">
      {families.map((family) => (
        <PaletteFamily key={family.name} family={family} />
      ))}
    </div>
  );
};

export const Primitives: Story = {
  tags: docsOnly,
  render: () => <Palette />
};
