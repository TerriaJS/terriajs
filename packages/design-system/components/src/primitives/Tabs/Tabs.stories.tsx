import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Category2Icon,
  ShareIcon,
  StackFrontIcon
} from "@terria/design-system-icons";
import { useState } from "react";
import type { Key } from "react-aria-components";
import { Tabs } from ".";
import { figmaDesign } from "../../figma";

const TABS = [
  { id: "layers", label: "Layers", icon: <StackFrontIcon size={16} /> },
  { id: "legend", label: "Legend", icon: <Category2Icon size={16} /> },
  { id: "share", label: "Share", icon: <ShareIcon size={16} /> }
] as const;

const meta = {
  title: "Example/Tabs",
  component: Tabs,
  parameters: figmaDesign("Tabs"),
  args: { variant: "primary", fullWidth: false, orientation: "horizontal" },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary"] },
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"]
    }
  },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 420 }}>
        <Story />
      </div>
    )
  ],
  render: (args) => (
    <Tabs {...args}>
      <Tabs.List aria-label="Map tools">
        {TABS.map((tab) => (
          <Tabs.Tab key={tab.id} id={tab.id}>
            {tab.label}
            <Tabs.Indicator />
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {TABS.map((tab) => (
        <Tabs.Panel key={tab.id} id={tab.id}>
          {tab.label} panel
        </Tabs.Panel>
      ))}
    </Tabs>
  )
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Secondary: Story = { args: { variant: "secondary" } };

export const FullWidth: Story = { args: { fullWidth: true } };

export const SecondaryFullWidth: Story = {
  args: { variant: "secondary", fullWidth: true }
};

export const Vertical: Story = { args: { orientation: "vertical" } };

export const SecondaryVertical: Story = {
  args: { variant: "secondary", orientation: "vertical" }
};

// Icons before or after the label, as the design's prefix and suffix
export const WithIcons: Story = {
  render: (args) => (
    <Tabs {...args}>
      <Tabs.List aria-label="Map tools">
        {TABS.map((tab) => (
          <Tabs.Tab key={tab.id} id={tab.id}>
            {tab.icon}
            {tab.label}
            <Tabs.Indicator />
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {TABS.map((tab) => (
        <Tabs.Panel key={tab.id} id={tab.id}>
          {tab.label} panel
        </Tabs.Panel>
      ))}
    </Tabs>
  )
};

// Dividers between tabs, hidden beside the selected one
export const WithSeparators: Story = {
  render: (args) => (
    <Tabs {...args}>
      <Tabs.List aria-label="Map tools">
        {TABS.map((tab, index) => (
          <Tabs.Tab key={tab.id} id={tab.id}>
            {index > 0 && <Tabs.Separator />}
            {tab.label}
            <Tabs.Indicator />
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {TABS.map((tab) => (
        <Tabs.Panel key={tab.id} id={tab.id}>
          {tab.label} panel
        </Tabs.Panel>
      ))}
    </Tabs>
  )
};

const MANY = [
  "Layers",
  "Legend",
  "Share",
  "Print",
  "Measure",
  "Story",
  "Settings",
  "Help"
];

// More tabs than fit: the list scrolls, and the selected tab scrolls into
// view with the arrow keys
export const Overflow: Story = {
  render: (args) => (
    <Tabs {...args}>
      <Tabs.List aria-label="Map tools">
        {MANY.map((name) => (
          <Tabs.Tab key={name} id={name}>
            {name}
            <Tabs.Indicator />
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {MANY.map((name) => (
        <Tabs.Panel key={name} id={name}>
          {name} panel
        </Tabs.Panel>
      ))}
    </Tabs>
  )
};

export const SecondaryOverflow: Story = {
  ...Overflow,
  args: { variant: "secondary" }
};

export const VerticalOverflow: Story = {
  ...Overflow,
  args: { orientation: "vertical" },
  decorators: [
    (Story) => (
      <div style={{ blockSize: 200, display: "flex" }}>
        <Story />
      </div>
    )
  ]
};

// Arrow keys only move focus; Enter or Space selects. For panels that are
// slow to switch to. The focus ring stays on the focused tab throughout
export const ManualActivation: Story = {
  args: { keyboardActivation: "manual" }
};

export const DisabledTab: Story = { args: { disabledKeys: ["share"] } };

export const Controlled: Story = {
  render: function Render(args) {
    const [selected, setSelected] = useState<Key>("legend");
    return (
      <>
        {meta.render({
          ...args,
          selectedKey: selected,
          onSelectionChange: setSelected
        })}
        <p>Selected: {String(selected)}</p>
      </>
    );
  }
};

// Keyboard focus, for visual tests: the ring rides on the selected pill
export const KeyboardFocus: Story = {
  tags: ["!autodocs"],
  play: async ({ userEvent }) => {
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
  }
};

// With manual activation the ring stays on the focused tab, not the selected one
export const ManualActivationFocus: Story = {
  args: { keyboardActivation: "manual" },
  tags: ["!autodocs"],
  play: async ({ userEvent }) => {
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
  }
};
