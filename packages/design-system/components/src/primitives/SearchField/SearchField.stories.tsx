import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { SearchField, type SearchFieldProps } from ".";
import { Description, FieldError, Label } from "../Field";
import { InputGroup } from "../InputGroup";
import { Kbd } from "../Kbd";
import { figmaDesign } from "../../figma";
import "../InputGroup/input-group.stories.css";

const meta = {
  title: "Example/SearchField",
  component: SearchField,
  parameters: figmaDesign("SearchField"),
  args: { fullWidth: true },
  subcomponents: {
    "SearchField.Group": SearchField.Group,
    "SearchField.SearchIcon": SearchField.SearchIcon,
    "SearchField.Input": SearchField.Input,
    "SearchField.ClearButton": SearchField.ClearButton
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
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

// A labelled search field. Called as a function, not rendered as a component,
// so a story's code shows the markup it returns
const vehicle = (props: SearchFieldProps): React.ReactElement => (
  <SearchField {...props}>
    <Label>Vehicle</Label>
    <SearchField.Group>
      <SearchField.SearchIcon />
      <SearchField.Input placeholder="Search…" />
      <SearchField.ClearButton />
    </SearchField.Group>
    <Description>More than 20 brands</Description>
    <FieldError>Brand not found</FieldError>
  </SearchField>
);

/** Enter submits; Escape or the clear button empties it. The clear button
 * shows once there's text, and stays out of the tab order */
export const Default: Story = {
  render: (args) => vehicle(args)
};

export const Filled: Story = {
  args: { defaultValue: "Porsche" },
  render: (args) => vehicle(args)
};

export const Invalid: Story = {
  args: { defaultValue: "Apple", isInvalid: true },
  render: (args) => vehicle(args)
};

export const Disabled: Story = {
  parameters: {
    // Text in a disabled field has no contrast requirement (WCAG 1.4.3);
    // axe only knows that for labels, not descriptions or values
    a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } }
  },
  args: { isDisabled: true },
  render: (args) => vehicle(args)
};

/** A field hugs its group unless fullWidth fills its container */
export const FullWidth: Story = {
  parameters: { wide: true },
  render: (args) => (
    <div className="tds-stack tds-items-start">
      {vehicle({ ...args, fullWidth: false })}
      {vehicle({ ...args, fullWidth: true })}
    </div>
  )
};

/** Without a visible label it needs an aria-label */
export const WithoutLabel: Story = {
  args: { "aria-label": "Search layers" },
  render: (args) => (
    <SearchField {...args}>
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder="Search layers" />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  )
};

/** The Group is an InputGroup and takes its variant */
export const Secondary: Story = {
  args: { "aria-label": "Search layers", defaultValue: "Roads" },
  render: (args) => (
    <SearchField {...args}>
      <SearchField.Group variant="secondary">
        <SearchField.SearchIcon />
        <SearchField.Input placeholder="Search layers" />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  )
};

/** Other InputGroup parts fit in the group too. A shortcut hint shows while
 * the field is empty; once there's text the clear button takes its place */
export const WithShortcut: Story = {
  args: { "aria-label": "Search the catalogue" },
  render: (args) => (
    <SearchField {...args}>
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder="Search the catalogue" />
        <InputGroup.Suffix>
          <Kbd variant="default">
            <Kbd.Abbr keyValue="command" />
            <Kbd.Content>K</Kbd.Content>
          </Kbd>
        </InputGroup.Suffix>
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  )
};

const SubmitStory = (args: Story["args"]): React.ReactElement => {
  const [submitted, setSubmitted] = useState<string>();

  return (
    <div className="tds-stack">
      {vehicle({
        ...args,
        onSubmit: setSubmitted,
        onClear: () => {
          setSubmitted(undefined);
        }
      })}
      <output>
        {submitted ? `Searching for “${submitted}”` : "Press Enter to search"}
      </output>
    </div>
  );
};

/** onSubmit gets the text on Enter; onClear runs when it's cleared */
export const Submit: Story = {
  render: SubmitStory
};
