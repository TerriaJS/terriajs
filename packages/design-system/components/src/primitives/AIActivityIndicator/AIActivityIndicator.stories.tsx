import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AIActivityIndicator,
  type AIActivityIndicatorSize,
  type AIActivityIndicatorSparkles
} from ".";
import { Button } from "../Button";
import { Description, Label } from "../Field";
import { SearchField } from "../SearchField";
import "./ai-activity-indicator.stories.css";

const meta = {
  title: "Example/AIActivityIndicator",
  component: AIActivityIndicator,
  args: { "aria-label": "Thinking", size: "md", sparkles: 6 },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    sparkles: { control: "inline-radio", options: [4, 5, 6] }
  }
} satisfies Meta<typeof AIActivityIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** AI at work, with no known progress: sparkles along a wave pulse one after
 * another, and stand still for people who reduce motion. It has no visible
 * label, so it needs an aria-label */
export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="tds-row tds-items-center tds-flex-gap-lg">
      {(["sm", "md", "lg"] as AIActivityIndicatorSize[]).map((size) => (
        <AIActivityIndicator key={size} {...args} size={size} />
      ))}
    </div>
  )
};

/** At the size the design shows it, 320px wide, to check its geometry and
 * motion; switch the sparkles with the controls */
export const Large: Story = {
  args: { className: "ai-activity-indicator-stories-large" }
};

/** Fewer sparkles are drawn larger, filling the same width */
export const SparkleCounts: Story = {
  render: (args) => (
    <div className="tds-row tds-items-center tds-flex-gap-lg">
      {([4, 5, 6] as AIActivityIndicatorSparkles[]).map((count) => (
        <AIActivityIndicator key={count} {...args} sparkles={count} />
      ))}
    </div>
  )
};

/** Beside text that says what's happening, the text is the status: it's
 * announced as it changes, and the indicator is only decoration */
export const WithStatus: Story = {
  render: (args) => (
    <div className="ai-activity-indicator-stories-status">
      <AIActivityIndicator {...args} aria-hidden />
      <span role="status">Finding pages with geometry…</span>
    </div>
  )
};

/** In a button, in place of an icon, while the action it started runs */
export const InButton: Story = {
  render: () => (
    <Button variant="outline">
      <AIActivityIndicator aria-hidden size="sm" />
      Generating
    </Button>
  )
};

/** In a search field, in the search icon's place while a search runs; its
 * description says what's happening, and is announced as it changes */
export const InSearchField: Story = {
  render: () => (
    <SearchField defaultValue="Roads">
      <Label>Search the catalogue</Label>
      <SearchField.Group>
        <SearchField.SearchIcon>
          <AIActivityIndicator aria-hidden />
        </SearchField.SearchIcon>
        <SearchField.Input />
        <SearchField.ClearButton />
      </SearchField.Group>
      <Description role="status">Finding pages with geometry…</Description>
    </SearchField>
  )
};
