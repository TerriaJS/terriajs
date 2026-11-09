import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Breadcrumbs } from ".";
import { figmaDesign } from "../../figma";

const meta = {
  title: "Example/Breadcrumbs",
  component: Breadcrumbs,
  parameters: figmaDesign("Breadcrumbs"),
  subcomponents: { "Breadcrumbs.Item": Breadcrumbs.Item }
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Links to the levels above; the last item is the current page. It's a
 * navigation landmark, named "Breadcrumbs" unless given an aria-label */
export const Default: Story = {
  args: { children: null },
  render: (args) => (
    <Breadcrumbs {...args}>
      <Breadcrumbs.Item href="#home">Home</Breadcrumbs.Item>
      <Breadcrumbs.Item href="#version-3">Version 3</Breadcrumbs.Item>
      <Breadcrumbs.Item href="#components">Components</Breadcrumbs.Item>
      <Breadcrumbs.Item href="#breadcrumbs">Breadcrumbs</Breadcrumbs.Item>
    </Breadcrumbs>
  )
};

export const Levels: Story = {
  args: { children: null },
  render: (args) => (
    <div className="tds-stack">
      <Breadcrumbs {...args} aria-label="Three levels">
        <Breadcrumbs.Item href="#home">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item href="#version-3">Version 3</Breadcrumbs.Item>
        <Breadcrumbs.Item href="#components">Components</Breadcrumbs.Item>
      </Breadcrumbs>
      <Breadcrumbs {...args} aria-label="Two levels">
        <Breadcrumbs.Item href="#home">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item href="#version-3">Version 3</Breadcrumbs.Item>
      </Breadcrumbs>
    </div>
  )
};

/** separator replaces the chevron */
export const CustomSeparator: Story = {
  args: { children: null, separator: "/" },
  render: Default.render
};

export const DisabledItem: Story = {
  args: { children: null },
  render: (args) => (
    <Breadcrumbs {...args}>
      <Breadcrumbs.Item href="#home">Home</Breadcrumbs.Item>
      <Breadcrumbs.Item href="#private" isDisabled>
        Private workspace
      </Breadcrumbs.Item>
      <Breadcrumbs.Item href="#roads">Roads</Breadcrumbs.Item>
    </Breadcrumbs>
  )
};

const CATALOGUE_PATH = ["Data catalogue", "Transport", "Roads", "Speed zones"];

const CataloguePathStory = (args: Story["args"]): React.ReactElement => {
  const [depth, setDepth] = useState(CATALOGUE_PATH.length);

  return (
    <div className="tds-stack">
      <Breadcrumbs
        {...args}
        aria-label="Catalogue path"
        onAction={(key) => {
          setDepth(CATALOGUE_PATH.indexOf(String(key)) + 1);
        }}
      >
        {CATALOGUE_PATH.slice(0, depth).map((name) => (
          <Breadcrumbs.Item key={name} id={name}>
            {name}
          </Breadcrumbs.Item>
        ))}
      </Breadcrumbs>
      <button
        type="button"
        onClick={() => {
          setDepth(CATALOGUE_PATH.length);
        }}
      >
        Reset
      </button>
    </div>
  );
};

/** Without hrefs, items are pressed like buttons and onAction gets their
 * id: here pressing one goes back up to it */
export const WithActions: Story = {
  args: { children: null },
  render: CataloguePathStory
};
