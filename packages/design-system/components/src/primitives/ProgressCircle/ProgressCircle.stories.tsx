import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  ProgressCircle,
  ProgressCircleFillCircle,
  ProgressCircleTrack,
  ProgressCircleTrackCircle
} from ".";
import { figmaDesign } from "../../figma";

const meta = {
  title: "Example/ProgressCircle",
  component: ProgressCircle,
  parameters: figmaDesign("ProgressCircle"),
  subcomponents: {
    ProgressCircleTrack,
    ProgressCircleTrackCircle,
    ProgressCircleFillCircle
  },
  args: {
    "aria-label": "Loading",
    children: (
      <ProgressCircle.Track>
        <ProgressCircle.TrackCircle />
        <ProgressCircle.FillCircle />
      </ProgressCircle.Track>
    )
  }
} satisfies Meta<typeof ProgressCircle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 60
  }
};

export const Indeterminate: Story = {
  args: {
    isIndeterminate: true
  }
};

export const Small: Story = {
  args: {
    value: 60,
    size: "sm"
  }
};

export const Large: Story = {
  args: {
    value: 60,
    size: "lg"
  }
};

export const Success: Story = {
  args: {
    value: 100,
    color: "success"
  }
};

export const Danger: Story = {
  args: {
    value: 30,
    color: "danger"
  }
};
