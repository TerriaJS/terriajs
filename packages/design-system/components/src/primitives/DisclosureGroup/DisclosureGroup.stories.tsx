import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  InfoCircleIcon,
  MapIcon,
  StackFrontIcon
} from "@terria/design-system-icons";
import { Fragment } from "react";
import { DisclosureGroup, type DisclosureGroupProps } from ".";
import { Button } from "../Button";
import { Disclosure } from "../Disclosure";
import { Separator } from "../Separator";
import { figmaDesign } from "../../figma";
import "./disclosure-group.stories.css";

const meta = {
  title: "Example/DisclosureGroup",
  component: DisclosureGroup,
  parameters: figmaDesign("DisclosureGroup"),
  args: { allowsMultipleExpanded: false },
  decorators: [
    (Story) => (
      <div className="disclosure-group-stories-width">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof DisclosureGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const SECTIONS = [
  {
    id: "layer",
    title: "Layer details",
    icon: <StackFrontIcon aria-hidden />,
    body: "Population counts by suburb from the 2021 census, updated every five years."
  },
  {
    id: "source",
    title: "Data source",
    icon: <InfoCircleIcon aria-hidden />,
    body: "Australian Bureau of Statistics, published under CC BY 4.0."
  },
  {
    id: "map",
    title: "Map settings",
    icon: <MapIcon aria-hidden />,
    body: "Shown between zoom levels 8 and 16, at 80% opacity."
  }
];

// The three sections in a group, Separators between them as in the design.
// Called as a function, not rendered as a component, so a story's code shows
// the markup it returns
const sections = (props: DisclosureGroupProps): React.ReactElement => (
  <DisclosureGroup {...props} className="tds-stack tds-flex-gap-sm">
    {SECTIONS.map(({ id, title, icon, body }, index) => (
      <Fragment key={id}>
        {index > 0 && <Separator />}
        <Disclosure id={id}>
          <Disclosure.Heading>
            <Button slot="trigger" variant="ghost" fullWidth>
              {icon}
              {title}
              <Disclosure.Indicator />
            </Button>
          </Disclosure.Heading>
          <Disclosure.Content>
            <Disclosure.Body>
              <p>{body}</p>
              <Button size="sm" variant="secondary">
                More
              </Button>
            </Disclosure.Body>
          </Disclosure.Content>
        </Disclosure>
      </Fragment>
    ))}
  </DisclosureGroup>
);

/** Disclosures as sections of one list: opening one closes the others. As
 * in the design, each trigger is a full-width ghost Button with
 * slot="trigger", Separators divide the sections, and tds-stack spaces
 * them. Each Disclosure needs an id */
export const Default: Story = {
  args: { defaultExpandedKeys: ["layer"] },
  render: (args) => sections(args)
};

/** allowsMultipleExpanded keeps the others open */
export const MultipleExpanded: Story = {
  args: { allowsMultipleExpanded: true, defaultExpandedKeys: ["layer", "map"] },
  render: (args) => sections(args)
};

export const Disabled: Story = {
  args: { isDisabled: true },
  render: (args) => sections(args)
};

/** A section can still be disabled on its own */
export const DisabledSection: Story = {
  render: (args) => (
    <DisclosureGroup {...args} className="tds-stack tds-flex-gap-sm">
      <Disclosure id="layer">
        <Disclosure.Heading>
          <Button slot="trigger" variant="ghost" fullWidth>
            Layer details
            <Disclosure.Indicator />
          </Button>
        </Disclosure.Heading>
        <Disclosure.Content>
          <Disclosure.Body>Population counts by suburb.</Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
      <Separator />
      <Disclosure id="private" isDisabled>
        <Disclosure.Heading>
          <Button slot="trigger" variant="ghost" fullWidth>
            Private workspace
            <Disclosure.Indicator />
          </Button>
        </Disclosure.Heading>
        <Disclosure.Content>
          <Disclosure.Body>Only you can see this.</Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    </DisclosureGroup>
  )
};
