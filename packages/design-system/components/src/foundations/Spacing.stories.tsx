import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { TokenName, Usage } from "./docs";
import { customProperties, readTokens, token, tokenPixels } from "./tokens";
import "./docs.stories.css";
import "./Spacing.stories.css";

const meta = {
  title: "Foundations/Spacing",
  // Spacing.mdx is the docs page
  tags: ["!autodocs"]
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// One size: its name, its token, and a bar as long as it is
const Size = ({ label, name }: { label: string; name: string }): ReactNode => (
  <li className="spacing-size">
    <span className="spacing-label">{label}</span>
    <TokenName name={name} />
    <span
      className="spacing-bar"
      style={customProperties({ "--_size": token(name) })}
    />
  </li>
);

const SEMANTIC = ["2xs", "xs", "sm", "md", "lg", "xl", "2xl"];

// Shown in Spacing.mdx only, not in the sidebar
const docsOnly = ["!dev"];

export const Semantic: Story = {
  tags: docsOnly,
  render: () => (
    <div className="tds-flow">
      <ul className="spacing-sizes">
        {SEMANTIC.map((size) => (
          <Size key={size} label={size} name={`space-${size}`} />
        ))}
      </ul>
      <Usage
        code={`.card {
  display: grid;
  gap: var(--terria-ds-space-sm);
  padding: var(--terria-ds-space-lg);
}`}
      />
    </div>
  )
};

// An example with its padding or gaps hatched, so the space shows, and the
// token that sets it
const Demo = ({
  label,
  name,
  property,
  layout,
  children
}: {
  label: string;
  name: string;
  property: "padding" | "gap";
  layout: "row" | "column";
  children: ReactNode;
}): ReactNode => (
  <figure className="spacing-demo tds-flow">
    <div className="spacing-demo-stage">
      <div
        className="spacing-demo-box"
        data-layout={layout}
        style={customProperties({
          [property === "padding" ? "--_padding" : "--_gap"]: token(name)
        })}
      >
        {children}
      </div>
    </div>
    <figcaption className="tds-flow">
      <span className="spacing-label">{label}</span>
      <TokenName name={name} />
    </figcaption>
  </figure>
);

// What the space surrounds
const Item = ({
  children,
  kind = "text"
}: {
  children?: ReactNode;
  // An icon-sized square, a field-like box, or text
  kind?: "icon" | "field" | "text";
}): ReactNode => (
  <span className="spacing-demo-item" data-kind={kind}>
    {children}
  </span>
);

export const PaddingAndGaps: Story = {
  tags: docsOnly,
  render: () => (
    <div className="tds-flow">
      <div className="spacing-demos">
        <Demo
          label="Icon and count"
          name="space-2xs"
          property="gap"
          layout="row"
        >
          <Item kind="icon" />
          <Item>12</Item>
        </Demo>
        <Demo
          label="Label and field"
          name="space-xs"
          property="gap"
          layout="column"
        >
          <Item>Layer name</Item>
          <Item kind="field" />
        </Demo>
        <Demo
          label="Icon and label"
          name="space-sm"
          property="gap"
          layout="row"
        >
          <Item kind="icon" />
          <Item>Add data</Item>
        </Demo>
        <Demo label="List item" name="space-md" property="padding" layout="row">
          <Item>Base map</Item>
        </Demo>
        <Demo
          label="Popover"
          name="space-lg"
          property="padding"
          layout="column"
        >
          <Item>Layer opacity</Item>
        </Demo>
        <Demo label="Dialog" name="space-xl" property="padding" layout="column">
          <Item>Remove layer?</Item>
        </Demo>
        <Demo label="Sections" name="space-2xl" property="gap" layout="column">
          <Item>Data sources</Item>
          <Item>Display</Item>
        </Demo>
      </div>
      <Usage
        code={`.field {
  display: grid;
  gap: var(--terria-ds-space-xs);
}

.button {
  display: inline-flex;
  gap: var(--terria-ds-space-sm);
}

.popover {
  padding: var(--terria-ds-space-lg);
}`}
      />
    </div>
  )
};

const SCALE = "dimensions-spacing-";

// The whole scale, read from the tokens and sorted by size
const Scale = (): ReactNode => {
  const [names] = useState(() =>
    readTokens(SCALE).sort((a, b) => tokenPixels(a) - tokenPixels(b))
  );
  return (
    <ul className="spacing-sizes">
      {names.map((name) => (
        <Size key={name} label={name.slice(SCALE.length)} name={name} />
      ))}
    </ul>
  );
};

export const SpacingScale: Story = {
  name: "Scale",
  tags: docsOnly,
  render: () => <Scale />
};
