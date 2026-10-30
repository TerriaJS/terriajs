import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { snap } from "../../../visual";
import { Label } from "../../Field";
import {
  ProgressBar,
  type ProgressBarColor,
  type ProgressBarProps,
  type ProgressBarSize
} from "..";
import "../progress-bar.stories.css";

const COLORS: ProgressBarColor[] = [
  "accent",
  "default",
  "success",
  "warning",
  "danger"
];
const SIZES: ProgressBarSize[] = ["sm", "md", "lg"];

// A labelled bar with its value, at the stories' width
const storage = (props: ProgressBarProps): React.ReactElement => (
  <div className="progress-bar-stories-stack">
    <ProgressBar {...props}>
      <Label>Storage</Label>
      <ProgressBar.Output />
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar>
  </div>
);

describe("ProgressBar", () => {
  it.each([0, 60, 100])("value %i", async (value) => {
    await render(storage({ value }));
    await snap();
  });

  it.each(COLORS)("color %s", async (color) => {
    await render(storage({ value: 60, color }));
    await snap();
  });

  it.each(SIZES)("size %s", async (size) => {
    await render(storage({ value: 60, size }));
    await snap();
  });

  it("custom value label", async () => {
    await render(
      storage({ value: 6.2, maxValue: 10, valueLabel: "6.2 of 10 GB" })
    );
    await snap();
  });

  // Animations are stopped for screenshots, so the sliding part rests at
  // the track's start
  it("indeterminate", async () => {
    await render(
      <div className="progress-bar-stories-stack">
        <ProgressBar isIndeterminate>
          <Label>Loading layers</Label>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </div>
    );
    await snap();
  });

  it("track only", async () => {
    await render(
      <div className="progress-bar-stories-stack">
        <ProgressBar aria-label="Upload progress" value={60}>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </div>
    );
    await snap();
  });
});
