import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { figmaDesign } from "../figma";
import { TokenName, Usage } from "./docs";
import { customProperties, readTokens, token } from "./tokens";
import "./docs.stories.css";
import "./Radius.stories.css";

const meta = {
  title: "Foundations/Radius",
  parameters: figmaDesign("Radius"),
  // Radius.mdx is the docs page
  tags: ["!autodocs"]
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// A tile with the radius, its name and its token
const Corner = ({
  label,
  name
}: {
  label: string;
  name: string;
}): ReactNode => (
  <figure className="radius-corner tds-flow">
    <span
      className="radius-tile"
      style={customProperties({ "--_radius": token(name) })}
    />
    <figcaption className="tds-flow">
      <span className="radius-label">{label}</span>
      <TokenName name={name} />
    </figcaption>
  </figure>
);

// Shown in Radius.mdx only, not in the sidebar
const docsOnly = ["!dev"];

export const Semantic: Story = {
  tags: docsOnly,
  render: () => (
    <div className="tds-flow">
      <div className="radius-corners">
        <Corner label="None" name="radius-none" />
        <Corner label="Small" name="radius-sm" />
        <Corner label="Medium" name="radius-md" />
        <Corner label="Large" name="radius-lg" />
        <Corner label="Full" name="radius-full" />
        <Corner label="Field" name="field-radius" />
      </div>
      <Usage
        code={`.card {
  border-radius: var(--terria-ds-radius-lg);
}

.field {
  border-radius: var(--terria-ds-field-radius);
}`}
      />
    </div>
  )
};

const SCALE = "dimensions-radius-rounded-";

// The whole scale, read from the tokens, None to Full as tokens.css has it
const Scale = (): ReactNode => {
  const [names] = useState(() => readTokens(SCALE));
  return (
    <div className="radius-corners">
      {names.map((name) => (
        <Corner key={name} label={name.slice(SCALE.length)} name={name} />
      ))}
    </div>
  );
};

export const RadiusScale: Story = {
  name: "Scale",
  tags: docsOnly,
  render: () => <Scale />
};
