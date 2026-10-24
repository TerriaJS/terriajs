import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  InfoCircleIcon,
  MapIcon,
  MinusIcon,
  PlusIcon,
  RulerMeasureIcon,
  StackFrontIcon
} from "@terria/design-system-icons";
import type { ReactNode } from "react";
import { Accordion, type AccordionProps } from ".";
import { figmaDesign } from "../../figma";
import "./accordion.stories.css";

const meta = {
  title: "Example/Accordion",
  component: Accordion,
  parameters: figmaDesign("Accordion"),
  subcomponents: {
    "Accordion.Item": Accordion.Item,
    "Accordion.Heading": Accordion.Heading,
    "Accordion.Trigger": Accordion.Trigger,
    "Accordion.Indicator": Accordion.Indicator,
    "Accordion.Panel": Accordion.Panel,
    "Accordion.Body": Accordion.Body
  },
  args: {
    variant: "default",
    allowsMultipleExpanded: false,
    hideSeparator: false
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "secondary"] }
  },
  decorators: [
    (Story) => (
      <div className="accordion-stories-width">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

type Item = { id: string; title: string; icon: ReactNode; body: string };

const ITEMS: Item[] = [
  {
    id: "layers",
    title: "Layers",
    icon: <StackFrontIcon aria-hidden />,
    body: "Add data from the catalogue, or drop a file on the map, to see it here."
  },
  {
    id: "legend",
    title: "Legend",
    icon: <MapIcon aria-hidden />,
    body: "Each layer's legend shows what its colours and symbols mean."
  },
  {
    id: "measure",
    title: "Measuring",
    icon: <RulerMeasureIcon aria-hidden />,
    body: "Draw a line or an area on the map to measure its length or size."
  },
  {
    id: "about",
    title: "About the data",
    icon: <InfoCircleIcon aria-hidden />,
    body: "Data comes from the agencies listed on each layer, under their licences."
  }
];

// The items, with or without their icons. Called as a function, not rendered
// as a component, so a story's code shows the markup it returns
const items = (
  props: AccordionProps,
  { withIcons = false } = {}
): React.ReactElement => (
  <Accordion {...props}>
    {ITEMS.map(({ id, title, icon, body }) => (
      <Accordion.Item key={id} id={id}>
        <Accordion.Heading>
          <Accordion.Trigger>
            {withIcons && icon}
            {title}
            <Accordion.Indicator />
          </Accordion.Trigger>
        </Accordion.Heading>
        <Accordion.Panel>
          <Accordion.Body>{body}</Accordion.Body>
        </Accordion.Panel>
      </Accordion.Item>
    ))}
  </Accordion>
);

/** Items that each show and hide their content, divided by lines. Opening
 * one closes the others. Each item needs an id */
export const Default: Story = {
  args: { defaultExpandedKeys: ["layers"] },
  render: (args) => items(args)
};

/** On a surface */
export const Secondary: Story = {
  args: { variant: "secondary", defaultExpandedKeys: ["layers"] },
  render: (args) => items(args)
};

/** hideSeparator leaves out the lines between items */
export const HideSeparator: Story = {
  args: { variant: "secondary", hideSeparator: true },
  render: (args) => items(args)
};

/** An icon before the title */
export const WithIcons: Story = {
  render: (args) => items(args, { withIcons: true })
};

/** A function as the indicator's children draws it for the item's state,
 * here plus and minus; isStatic stops it turning as well */
export const PlusMinusIndicator: Story = {
  args: { defaultExpandedKeys: ["layers"] },
  render: (args) => (
    <Accordion {...args}>
      {ITEMS.map(({ id, title, body }) => (
        <Accordion.Item key={id} id={id}>
          <Accordion.Heading>
            <Accordion.Trigger>
              {title}
              <Accordion.Indicator isStatic>
                {({ isExpanded }) =>
                  isExpanded ? <MinusIcon size={16} /> : <PlusIcon size={16} />
                }
              </Accordion.Indicator>
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>{body}</Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  )
};

/** allowsMultipleExpanded keeps the others open */
export const MultipleExpanded: Story = {
  args: {
    allowsMultipleExpanded: true,
    defaultExpandedKeys: ["layers", "measure"]
  },
  render: (args) => items(args)
};

export const Disabled: Story = {
  args: { isDisabled: true },
  render: (args) => items(args)
};

/** An item can be disabled on its own */
export const DisabledItem: Story = {
  render: (args) => (
    <Accordion {...args}>
      <Accordion.Item id="layers">
        <Accordion.Heading>
          <Accordion.Trigger>
            Layers
            <Accordion.Indicator />
          </Accordion.Trigger>
        </Accordion.Heading>
        <Accordion.Panel>
          <Accordion.Body>
            Add data from the catalogue to see it here.
          </Accordion.Body>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item id="private" isDisabled>
        <Accordion.Heading>
          <Accordion.Trigger>
            Private workspace
            <Accordion.Indicator />
          </Accordion.Trigger>
        </Accordion.Heading>
        <Accordion.Panel>
          <Accordion.Body>Only you can see this.</Accordion.Body>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  )
};
