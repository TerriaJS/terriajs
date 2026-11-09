import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { parseDate } from "@internationalized/date";
import { CalendarIcon } from "@terria/design-system-icons";
import { DateField } from "../../DateField";
import { Label } from "../../Field";
import { focusVisible, hover, snap } from "../../../visual";
import {
  DateInputGroupInput,
  DateInputGroupInputContainer,
  DateInputGroupPrefix,
  DateInputGroupRoot,
  DateInputGroupSegment,
  DateInputGroupSuffix
} from "..";

// The group needs a DateField (or TimeField) around it for its segments
type Affixes = { prefix?: boolean; suffix?: boolean; isDivided?: boolean };

const group = ({ prefix, suffix, isDivided }: Affixes): React.ReactElement => (
  <DateField defaultValue={parseDate("2025-12-16")}>
    <Label>Survey date</Label>
    <DateInputGroupRoot isDivided={isDivided}>
      {prefix && (
        <DateInputGroupPrefix>
          <CalendarIcon />
        </DateInputGroupPrefix>
      )}
      <DateInputGroupInput>
        {(segment) => <DateInputGroupSegment segment={segment} />}
      </DateInputGroupInput>
      {suffix && <DateInputGroupSuffix>UTC</DateInputGroupSuffix>}
    </DateInputGroupRoot>
  </DateField>
);

describe("DateInputGroup", () => {
  it("segments alone", async () => {
    await render(group({}));
    await snap();
  });

  it("prefix", async () => {
    await render(group({ prefix: true }));
    await snap();
  });

  it("suffix", async () => {
    await render(group({ suffix: true }));
    await snap();
  });

  it("prefix and suffix", async () => {
    await render(group({ prefix: true, suffix: true }));
    await snap();
  });

  it("prefix and suffix, divided", async () => {
    await render(group({ prefix: true, suffix: true, isDivided: true }));
    await snap();
  });

  it("hovered", async () => {
    const screen = await render(group({ prefix: true, suffix: true }));
    await hover(screen.getByRole("spinbutton", { name: /year/ }));
    await snap();
  });

  it("first segment focused beside a prefix", async () => {
    const screen = await render(group({ prefix: true }));
    await focusVisible(screen.getByRole("spinbutton", { name: /month/ }));
    await snap();
  });

  it("last segment focused beside a suffix", async () => {
    const screen = await render(group({ suffix: true }));
    await focusVisible(screen.getByRole("spinbutton", { name: /year/ }));
    await snap();
  });

  it("in an input container", async () => {
    await render(
      <DateField defaultValue={parseDate("2025-12-16")}>
        <Label>Survey date</Label>
        <DateInputGroupRoot>
          <DateInputGroupInputContainer>
            <DateInputGroupInput>
              {(segment) => <DateInputGroupSegment segment={segment} />}
            </DateInputGroupInput>
          </DateInputGroupInputContainer>
        </DateInputGroupRoot>
      </DateField>
    );
    await snap();
  });
});
