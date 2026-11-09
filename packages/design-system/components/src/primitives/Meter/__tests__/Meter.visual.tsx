import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { snap } from "../../../visual";
import { Label } from "../../Field";
import { Meter, type MeterColor, type MeterProps, type MeterSize } from "..";
import "../meter.stories.css";

const COLORS: MeterColor[] = [
  "accent",
  "default",
  "success",
  "warning",
  "danger"
];
const SIZES: MeterSize[] = ["sm", "md", "lg"];

// A labelled meter with its value, at the stories' width
const storage = (props: MeterProps): React.ReactElement => (
  <div className="meter-stories-stack">
    <Meter {...props}>
      <Label>Storage</Label>
      <Meter.Output />
      <Meter.Track>
        <Meter.Fill />
      </Meter.Track>
    </Meter>
  </div>
);

describe("Meter", () => {
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

  it("without label", async () => {
    await render(
      <div className="meter-stories-stack">
        <Meter aria-label="Storage used" value={45}>
          <Meter.Track>
            <Meter.Fill />
          </Meter.Track>
        </Meter>
      </div>
    );
    await snap();
  });
});
