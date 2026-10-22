import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { figmaDesign } from "../figma";
import { Themes, TokenName, Usage } from "./docs";
import { customProperties, token } from "./tokens";
import "./docs.stories.css";
import "./Effects.stories.css";

const meta = {
  title: "Foundations/Effects",
  parameters: figmaDesign("Effects"),
  // Effects.mdx is the docs page
  tags: ["!autodocs"]
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type EffectProps = {
  label: string;
  // The tokens the example uses, each one shown and copyable
  names: string[];
  // How the tile shows the effect
  kind: "shadow" | "blur" | "backdrop" | "opacity";
};

// A tile showing the effect, with its name and tokens
const Effect = ({ label, names, kind }: EffectProps): ReactNode => (
  <figure className="effect tds-flow">
    <span
      className="effect-tile"
      data-kind={kind}
      style={customProperties({
        [kind === "opacity" ? "--_opacity" : "--_effect"]: token(names[0] ?? "")
      })}
    />
    <figcaption className="tds-flow">
      <span className="effect-label">{label}</span>
      {names.map((name) => (
        <TokenName key={name} name={name} />
      ))}
    </figcaption>
  </figure>
);

const Effects = ({
  effects,
  usage
}: {
  effects: EffectProps[];
  usage: string;
}): ReactNode => (
  <div className="tds-flow">
    <Themes layout="rows">
      <div className="effects">
        {effects.map((effect) => (
          <Effect key={effect.label} {...effect} />
        ))}
      </div>
    </Themes>
    <Usage code={usage} />
  </div>
);

// Shown in Effects.mdx only, not in the sidebar
const docsOnly = ["!dev"];

export const Shadows: Story = {
  tags: docsOnly,
  render: () => (
    <Effects
      effects={[
        { label: "Inner", names: ["shadow-inner"], kind: "shadow" },
        { label: "Surface", names: ["shadow-surface"], kind: "shadow" },
        { label: "Field", names: ["shadow-field"], kind: "shadow" },
        { label: "Switch", names: ["shadow-switch"], kind: "shadow" },
        { label: "Tab", names: ["shadow-tab"], kind: "shadow" },
        { label: "Overlay", names: ["shadow-overlay"], kind: "shadow" }
      ]}
      usage={`.card {
  box-shadow: var(--terria-ds-shadow-surface);
}

.menu {
  box-shadow: var(--terria-ds-shadow-overlay);
}`}
    />
  )
};

export const Blur: Story = {
  tags: docsOnly,
  render: () => (
    <Effects
      effects={[
        { label: "Blur", names: ["backdrop-blur"], kind: "blur" },
        {
          label: "Backdrop",
          names: ["backdrop-blur", "backdrop"],
          kind: "backdrop"
        }
      ]}
      usage={`.toolbar {
  background-color: var(--terria-ds-surface-glass);
  backdrop-filter: var(--terria-ds-backdrop-blur);
}

.modal-backdrop {
  background-color: var(--terria-ds-backdrop);
  backdrop-filter: var(--terria-ds-backdrop-blur);
}`}
    />
  )
};

export const FocusRings: Story = {
  tags: docsOnly,
  render: () => (
    <Effects
      effects={[
        {
          label: "Focus ring",
          names: ["shadow-focus-ring-field"],
          kind: "shadow"
        },
        {
          label: "Focus ring shield",
          names: ["shadow-focus-ring"],
          kind: "shadow"
        }
      ]}
      usage={`button:focus-visible {
  box-shadow: var(--terria-ds-shadow-focus-ring);

  /* Shadows are dropped in forced-colors mode; this outline shows there */
  outline: var(--terria-ds-focus-ring-width) solid transparent;
}

input:focus-visible {
  box-shadow: var(--terria-ds-shadow-focus-ring-field);
}`}
    />
  )
};

export const Disabled: Story = {
  tags: docsOnly,
  render: () => (
    <Effects
      effects={[
        {
          label: "Disabled",
          names: ["effects-disabled-opacity"],
          kind: "opacity"
        }
      ]}
      usage={`button:disabled {
  opacity: var(--terria-ds-effects-disabled-opacity);
}`}
    />
  )
};
