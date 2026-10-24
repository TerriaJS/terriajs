import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  CaretUpDownIcon,
  ChevronRightIcon,
  StackFrontIcon
} from "@terria/design-system-icons";
import { Disclosure, type DisclosureProps } from ".";
import { Button } from "../Button";
import { Chip } from "../Chip";
import { Surface } from "../Surface";
import { figmaDesign } from "../../figma";
import "./disclosure.stories.css";

const meta = {
  title: "Example/Disclosure",
  component: Disclosure,
  parameters: figmaDesign("Disclosure"),
  subcomponents: {
    "Disclosure.Heading": Disclosure.Heading,
    "Disclosure.Trigger": Disclosure.Trigger,
    "Disclosure.Indicator": Disclosure.Indicator,
    "Disclosure.Content": Disclosure.Content,
    "Disclosure.Body": Disclosure.Body
  },
  args: { fullWidth: false },
  decorators: [
    // parameters.inPanel renders the story as it is, in its own panel
    (Story, { parameters }) =>
      parameters["inPanel"] === true ? (
        <Story />
      ) : (
        <div className="disclosure-stories-width">
          <Story />
        </div>
      )
  ]
} satisfies Meta<typeof Disclosure>;

export default meta;
type Story = StoryObj<typeof meta>;

// The content shown in every example, on a Surface as in the design: the
// card is the example's choice, not the disclosure's. Called as a function,
// not rendered as a component, so a story's code shows the markup it returns
const body = (): React.ReactElement => (
  <Surface>
    <Disclosure.Body>
      <p>
        Population counts by suburb from the 2021 census, updated every five
        years.
      </p>
      <Button size="sm">Add to the map</Button>
    </Disclosure.Body>
  </Surface>
);

// The design's look: a tertiary Button as the trigger, the content on a
// Surface
const layerDetails = (props: DisclosureProps): React.ReactElement => (
  <Disclosure {...props}>
    <Disclosure.Heading>
      <Button slot="trigger" variant="tertiary">
        <StackFrontIcon aria-hidden />
        Layer details
        <Disclosure.Indicator />
      </Button>
    </Disclosure.Heading>
    <Disclosure.Content>{body()}</Disclosure.Content>
  </Disclosure>
);

/** The design's look: a tertiary Button with slot="trigger" in the heading
 * shows and hides the content, on a Surface. The heading is level 3 unless
 * Disclosure.Heading's level says otherwise */
export const Default: Story = {
  render: (args) => layerDetails(args)
};

/** Disclosure.Trigger on its own is a plain button the width of the heading,
 * in the heading's text: here tds-h6 sizes it. Without a Surface the content
 * needs no Body; it sits under the title as it is */
export const PlainTrigger: Story = {
  args: { defaultExpanded: true },
  render: (args) => (
    <Disclosure {...args}>
      <Disclosure.Heading className="tds-h6">
        <Disclosure.Trigger>
          Layer details
          <Disclosure.Indicator />
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>
        <p>
          Population counts by suburb from the 2021 census, updated every five
          years.
        </p>
      </Disclosure.Content>
    </Disclosure>
  )
};

export const DefaultExpanded: Story = {
  args: { defaultExpanded: true },
  render: (args) => layerDetails(args)
};

/** fullWidth: the trigger spans the width with its content at the start,
 * and the content attaches to it. Here the indicator leads and a Chip
 * follows the title */
export const FullWidth: Story = {
  args: { fullWidth: true, defaultExpanded: true },
  render: (args) => (
    <Disclosure {...args}>
      <Disclosure.Heading>
        <Button slot="trigger" variant="tertiary">
          <Disclosure.Indicator />
          Selected layers
          <Chip variant="primary" color="accent">
            1
          </Chip>
        </Button>
      </Disclosure.Heading>
      <Disclosure.Content>{body()}</Disclosure.Content>
    </Disclosure>
  )
};

export const Disabled: Story = {
  args: { isDisabled: true },
  render: (args) => layerDetails(args)
};

/** Children replace the chevron; it still flips while expanded */
export const CustomIndicator: Story = {
  render: (args) => (
    <Disclosure {...args}>
      <Disclosure.Heading>
        <Button slot="trigger" variant="tertiary">
          <Disclosure.Indicator>
            <ChevronRightIcon />
          </Disclosure.Indicator>
          Layer details
        </Button>
      </Disclosure.Heading>
      <Disclosure.Content>{body()}</Disclosure.Content>
    </Disclosure>
  )
};

/** isStatic keeps the indicator still while expanded, for an icon that
 * doesn't point */
export const StaticIndicator: Story = {
  render: (args) => (
    <Disclosure {...args}>
      <Disclosure.Heading>
        <Button slot="trigger" variant="tertiary">
          <Disclosure.Indicator isStatic>
            <CaretUpDownIcon />
          </Disclosure.Indicator>
          Layer details
        </Button>
      </Disclosure.Heading>
      <Disclosure.Content>{body()}</Disclosure.Content>
    </Disclosure>
  )
};

/** Any Button with slot="trigger" in the heading toggles the content, in any
 * variant */
export const ButtonVariant: Story = {
  render: (args) => (
    <Disclosure {...args}>
      <Disclosure.Heading>
        <Button slot="trigger" variant="ghost">
          Layer details
          <Disclosure.Indicator />
        </Button>
      </Disclosure.Heading>
      <Disclosure.Content>{body()}</Disclosure.Content>
    </Disclosure>
  )
};

/** In a panel, laid out from the top left rather than centred in the canvas:
 * the default pill centres in the panel's width, the full-width one spans
 * it, and opening either pushes what follows down */
export const InAPanel: Story = {
  parameters: { layout: "padded", inPanel: true },
  render: (args) => (
    <section className="disclosure-stories-panel tds-stack">
      <h2 className="tds-h5">Workbench</h2>
      <p>Layers on the map, newest first.</p>
      {layerDetails(args)}
      <Disclosure {...args} fullWidth>
        <Disclosure.Heading>
          <Button slot="trigger" variant="tertiary">
            <Disclosure.Indicator />
            Selected layers
            <Chip variant="primary" color="accent">
              1
            </Chip>
          </Button>
        </Disclosure.Heading>
        <Disclosure.Content>{body()}</Disclosure.Content>
      </Disclosure>
      <p>Drag a layer to change its order.</p>
    </section>
  )
};
