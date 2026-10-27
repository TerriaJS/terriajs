import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton, type SkeletonProps } from ".";
import { Card } from "../Card";
import { figmaDesign } from "../../figma";
import "./skeleton.stories.css";

const meta = {
  title: "Example/Skeleton",
  component: Skeleton,
  parameters: {
    ...figmaDesign("Skeleton"),
    docs: {
      description: {
        component:
          "Placeholder shapes shown where content is loading, in the layout the content will take, such as a catalogue item's card, a dataset's description or a list of layers. Each Skeleton is sized and shaped by its own class; one holding others draws just them and animates them as one. It shimmers by default, or pulses, or keeps still; an app sets its default for every skeleton with --terria-ds-skeleton-animation. Mark the region that's loading with aria-busy. For a task whose progress is known, use a ProgressBar; for a short wait on one control, a Spinner."
      }
    }
  },
  args: { animationType: "shimmer" },
  // On the app's page colour, as cards are
  decorators: [
    (Story) => (
      <div className="skeleton-stories-page">
        <Story />
      </div>
    )
  ],
  argTypes: {
    animationType: {
      control: "inline-radio",
      options: ["shimmer", "pulse", "none"]
    }
  }
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

// The design's skeletons, each in the card whose content is loading, marked
// busy: a white one, as the skeletons' colour is the default card's. Called as functions, not rendered as components, so a story's code
// shows the markup they return
const loading = (content: React.ReactElement): React.ReactElement => (
  <Card aria-busy="true" variant="secondary" className="skeleton-stories-frame">
    {content}
  </Card>
);

const card = (props: SkeletonProps): React.ReactElement =>
  loading(
    <Skeleton {...props} className="skeleton-stories-card">
      <Skeleton className="skeleton-stories-image" />
      <Skeleton className="skeleton-stories-line skeleton-stories-w-60" />
      <Skeleton className="skeleton-stories-line skeleton-stories-w-70" />
      <Skeleton className="skeleton-stories-line skeleton-stories-w-45" />
    </Skeleton>
  );

/** A catalogue item's card: its image and three lines of text */
export const CatalogueCard: Story = {
  render: (args) => card(args)
};

/** A paragraph that's loading */
export const TextContent: Story = {
  render: (args) =>
    loading(
      <Skeleton {...args} className="skeleton-stories-text">
        <Skeleton className="skeleton-stories-line" />
        <Skeleton className="skeleton-stories-line skeleton-stories-w-80" />
        <Skeleton className="skeleton-stories-line skeleton-stories-w-60" />
        <Skeleton className="skeleton-stories-line" />
        <Skeleton className="skeleton-stories-line skeleton-stories-w-45" />
      </Skeleton>
    )
};

/** A user's avatar and name */
export const UserProfile: Story = {
  render: (args) =>
    loading(
      <Skeleton {...args} className="skeleton-stories-profile">
        <Skeleton className="skeleton-stories-avatar" />
        <div className="skeleton-stories-lines">
          <Skeleton className="skeleton-stories-line" />
          <Skeleton className="skeleton-stories-line skeleton-stories-w-70" />
        </div>
      </Skeleton>
    )
};

/** Rows of a list, each an icon and two lines */
export const ListItems: Story = {
  render: (args) =>
    loading(
      <Skeleton {...args} className="skeleton-stories-list">
        {[1, 2, 3].map((row) => (
          <div key={row} className="skeleton-stories-row">
            <Skeleton className="skeleton-stories-icon" />
            <div className="skeleton-stories-lines">
              <Skeleton className="skeleton-stories-line" />
              <Skeleton className="skeleton-stories-line skeleton-stories-w-80" />
            </div>
          </div>
        ))}
      </Skeleton>
    )
};

/** Shapes side by side, each its own skeleton with its own shimmer */
export const Grid: Story = {
  render: (args) =>
    loading(
      <div className="skeleton-stories-grid">
        {[1, 2, 3].map((tile) => (
          <Skeleton key={tile} {...args} className="skeleton-stories-tile" />
        ))}
      </div>
    )
};

/** Shimmer, pulse and still, side by side */
export const AnimationTypes: Story = {
  render: (args) => (
    <div className="skeleton-stories-row">
      {(["shimmer", "pulse", "none"] as const).map((animationType) => (
        <div key={animationType}>{card({ ...args, animationType })}</div>
      ))}
    </div>
  )
};
