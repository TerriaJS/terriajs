import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronRightIcon } from "@terria/design-system-icons";
import { fn } from "storybook/test";
import { Link } from ".";
import { figmaDesign } from "../../figma";

const meta = {
  title: "Example/Link",
  component: Link,
  parameters: figmaDesign("Link"),
  subcomponents: { "Link.Icon": Link.Icon },
  args: {
    href: "https://terria.io",
    target: "_blank",
    isDisabled: false
  },
  // Its props are React Aria's, which the docs don't list, so the controls
  // are listed here
  argTypes: {
    href: {
      control: "text",
      description: "Where it goes",
      table: { type: { summary: "string" } }
    },
    target: {
      control: "inline-radio",
      options: ["_self", "_blank"],
      description: "Where it opens",
      table: { type: { summary: "string" } }
    },
    isDisabled: {
      control: "boolean",
      description: "Can't be followed",
      table: { type: { summary: "boolean" } }
    }
  },
  render: (args) => (
    <Link {...args}>
      Call to action
      <Link.Icon />
    </Link>
  )
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Link.Icon shows an external-link arrow, as for a link that opens
 * elsewhere */
export const Default: Story = {};

/** In a sentence, the link takes the text's size */
export const InText: Story = {
  render: (args) => (
    <p>
      Data from the{" "}
      <Link {...args} href="https://www.abs.gov.au">
        Australian Bureau of Statistics
      </Link>
      , updated every five years.
    </p>
  )
};

/** Link.Icon's children replace the arrow */
export const CustomIcon: Story = {
  args: { href: "#legend", target: "_self" },
  render: (args) => (
    <Link {...args}>
      Open legend
      <Link.Icon>
        <ChevronRightIcon />
      </Link.Icon>
    </Link>
  )
};

/** Without an href, onPress does what the link does */
export const OnPress: Story = {
  args: { href: undefined, onPress: fn() },
  render: (args) => <Link {...args}>Show all layers</Link>
};

export const Disabled: Story = { args: { isDisabled: true } };
