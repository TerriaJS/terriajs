import type { Meta, StoryObj } from "@storybook/react-vite";
import { ZoomIcon, ZoomOutIcon } from "@terria/design-system-icons";
import { NumberField, type NumberFieldProps } from ".";
import { Description, FieldError, Label } from "../Field";
import { figmaDesign } from "../../figma";
import "../InputGroup/input-group.stories.css";

const meta = {
  title: "Example/NumberField",
  component: NumberField,
  parameters: figmaDesign("NumberField"),
  subcomponents: {
    "NumberField.Group": NumberField.Group,
    "NumberField.Input": NumberField.Input,
    "NumberField.DecrementButton": NumberField.DecrementButton,
    "NumberField.IncrementButton": NumberField.IncrementButton
  },
  args: { defaultValue: 1, minValue: 0, fullWidth: true },
  argTypes: {
    minValue: { control: "number" },
    maxValue: { control: "number" },
    step: { control: "number" },
    // A few Intl.NumberFormat options to pick from
    formatOptions: {
      control: "select",
      options: ["decimal", "percent", "currency", "kilometres"],
      mapping: {
        decimal: { style: "decimal" },
        percent: { style: "percent" },
        currency: { style: "currency", currency: "AUD" },
        kilometres: { style: "unit", unit: "kilometer" }
      }
    }
  },
  decorators: [
    // parameters.wide gives a story a wider container
    (Story, { parameters }) => (
      <div
        className={
          parameters["wide"] === true
            ? "input-group-stories-wide"
            : "input-group-stories-width"
        }
      >
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

// A labelled field with both buttons. Called as a function, not rendered as a
// component, so a story's code shows the markup it returns
const amount = (props: NumberFieldProps): React.ReactElement => (
  <NumberField {...props}>
    <Label>Amount</Label>
    <NumberField.Group>
      <NumberField.DecrementButton />
      <NumberField.Input />
      <NumberField.IncrementButton />
    </NumberField.Group>
    <Description>Description text</Description>
    <FieldError>Only 10 left in stock</FieldError>
  </NumberField>
);

/** The buttons and the arrow keys step the value; typing is limited to
 * numbers. Controls set the range, step and format */
export const Default: Story = {
  render: (args) => amount(args)
};

/** The value is formatted as it's shown: percent stores 0.25 as 25% */
export const Formatted: Story = {
  args: {
    defaultValue: 0.25,
    step: 0.05,
    maxValue: 1,
    formatOptions: { style: "percent" }
  },
  render: (args) => amount(args)
};

/** At a limit, the button that would pass it is disabled */
export const Range: Story = {
  args: { defaultValue: 10, minValue: 0, maxValue: 10 },
  render: (args) => amount(args)
};

export const Invalid: Story = {
  args: { defaultValue: 100, isInvalid: true },
  render: (args) => amount(args)
};

export const Disabled: Story = {
  args: { isDisabled: true },
  render: (args) => amount(args)
};

/** The Group is an InputGroup and takes its variant */
export const Secondary: Story = {
  render: (args) => (
    <NumberField {...args}>
      <Label>Amount</Label>
      <NumberField.Group variant="secondary">
        <NumberField.DecrementButton />
        <NumberField.Input />
        <NumberField.IncrementButton />
      </NumberField.Group>
    </NumberField>
  )
};

/** A field hugs its group unless fullWidth fills its container */
export const FullWidth: Story = {
  parameters: { wide: true },
  render: (args) => (
    <div className="tds-stack tds-items-start">
      {amount({ ...args, fullWidth: false })}
      {amount({ ...args, fullWidth: true })}
    </div>
  )
};

/** Children replace the minus and plus. The buttons keep their names,
 * "Decrease" and "Increase" with the field's label, whatever they show */
export const CustomIcons: Story = {
  args: { defaultValue: 10, minValue: 1, maxValue: 20 },
  render: (args) => (
    <NumberField {...args}>
      <Label>Zoom level</Label>
      <NumberField.Group>
        <NumberField.DecrementButton>
          <ZoomOutIcon aria-hidden size={16} />
        </NumberField.DecrementButton>
        <NumberField.Input />
        <NumberField.IncrementButton>
          <ZoomIcon aria-hidden size={16} />
        </NumberField.IncrementButton>
      </NumberField.Group>
    </NumberField>
  )
};

/** Both buttons after the input; the input can also stand alone */
export const ButtonsAfter: Story = {
  render: (args) => (
    <NumberField {...args}>
      <Label>Opacity</Label>
      <NumberField.Group>
        <NumberField.Input />
        <NumberField.DecrementButton />
        <NumberField.IncrementButton />
      </NumberField.Group>
    </NumberField>
  )
};
