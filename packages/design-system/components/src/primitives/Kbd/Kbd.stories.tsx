import type { Meta, StoryObj } from "@storybook/react-vite";
import { KBD_KEYS, Kbd, KbdAbbr, KbdContent, type KbdKey } from ".";
import { figmaDesign } from "../../figma";
import "./kbd.stories.css";

const meta = {
  title: "Example/Kbd",
  component: Kbd,
  parameters: figmaDesign("Kbd"),
  subcomponents: { KbdAbbr, KbdContent },
  args: { variant: "default" },
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "light"] }
  }
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Kbd {...args}>
      <Kbd.Abbr keyValue="command" />
      <Kbd.Content>K</Kbd.Content>
    </Kbd>
  )
};

const MODIFIERS: KbdKey[] = ["command", "windows", "ctrl", "option", "shift"];

/** The modifiers in the design; hovering one shows its name */
export const Modifiers: Story = {
  render: (args) => (
    <div className="kbd-stories-stack">
      {MODIFIERS.map((key) => (
        <Kbd key={key} {...args}>
          <Kbd.Abbr keyValue={key} />
          <Kbd.Content>K</Kbd.Content>
        </Kbd>
      ))}
      <Kbd {...args}>
        <Kbd.Content>K</Kbd.Content>
      </Kbd>
    </div>
  )
};

/** Every key Kbd.Abbr draws, by its keyValue */
export const AllKeys: Story = {
  render: (args) => (
    <div className="kbd-stories-grid">
      {(Object.keys(KBD_KEYS) as KbdKey[]).map((key) => (
        <div key={key} className="kbd-stories-key">
          <Kbd {...args}>
            <Kbd.Abbr keyValue={key} />
          </Kbd>
          <code>{key}</code>
        </div>
      ))}
    </div>
  )
};

/** Without the fill, for menus and other filled surfaces */
export const Light: Story = { ...Default, args: { variant: "light" } };

/** Several modifiers before one key */
export const Combination: Story = {
  render: (args) => (
    <Kbd {...args}>
      <Kbd.Abbr keyValue="command" />
      <Kbd.Abbr keyValue="shift" />
      <Kbd.Content>K</Kbd.Content>
    </Kbd>
  )
};

/** Inside text, as in a hint or help copy */
export const Inline: Story = {
  args: { variant: "default" },
  render: (args) => (
    <p className="kbd-stories-text">
      Press{" "}
      <Kbd {...args}>
        <Kbd.Abbr keyValue="command" />
        <Kbd.Content>K</Kbd.Content>
      </Kbd>{" "}
      to search the catalogue, or{" "}
      <Kbd {...args}>
        <Kbd.Abbr keyValue="escape" />
      </Kbd>{" "}
      to close it. Move between results with{" "}
      <Kbd {...args}>
        <Kbd.Abbr keyValue="up" />
      </Kbd>{" "}
      and{" "}
      <Kbd {...args}>
        <Kbd.Abbr keyValue="down" />
      </Kbd>
      .
    </p>
  )
};
