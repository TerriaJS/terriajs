import { describe, expect, it } from "vitest";
import { page, userEvent, type Locator } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  parseDate,
  parseDateTime,
  type DateValue
} from "@internationalized/date";
import type { ReactNode } from "react";
import { focusVisible, hover, snap, viewport } from "../../../visual";
import { Calendar } from "../../Calendar";
import { DateField } from "../../DateField";
import { Description, FieldError, Label } from "../../Field";
import { TimeField } from "../../TimeField";
import { DatePicker, type DatePickerProps } from "..";
import "../date-picker.stories.css";

// Done animating in: no data-entering left, every animation finished, and
// two frames drawn since, so nothing is caught on a layer of its own
const settled = async (): Promise<void> => {
  await expect.poll(() => document.querySelector("[data-entering]")).toBeNull();
  await Promise.all(
    document.getAnimations().map((animation) => animation.finished)
  );
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
};

const calendar = (
  <Calendar aria-label="Survey date">
    <Calendar.Header>
      <Calendar.YearPickerTrigger>
        <Calendar.YearPickerTriggerHeading />
        <Calendar.YearPickerTriggerIndicator />
      </Calendar.YearPickerTrigger>
      <Calendar.NavButton slot="previous" />
      <Calendar.NavButton slot="next" />
    </Calendar.Header>
    <Calendar.Grid>
      <Calendar.GridHeader>
        {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
      </Calendar.GridHeader>
      <Calendar.GridBody>
        {(date) => <Calendar.Cell date={date} />}
      </Calendar.GridBody>
    </Calendar.Grid>
    <Calendar.YearPickerGrid>
      <Calendar.YearPickerGridBody>
        {({ year }) => <Calendar.YearPickerCell year={year} />}
      </Calendar.YearPickerGridBody>
    </Calendar.YearPickerGrid>
  </Calendar>
);

const picker = <T extends DateValue>(
  props: DatePickerProps<T>,
  popover: ReactNode = calendar
): React.ReactElement => (
  <DatePicker {...props}>
    <Label>Survey date</Label>
    <DateField.Group fullWidth>
      <DateField.Input>
        {(segment) => <DateField.Segment segment={segment} />}
      </DateField.Input>
      <DateField.Suffix>
        <DatePicker.Trigger>
          <DatePicker.TriggerIndicator />
        </DatePicker.Trigger>
      </DateField.Suffix>
    </DateField.Group>
    <Description>When the survey was flown</Description>
    <FieldError>Enter a date</FieldError>
    <DatePicker.Popover>{popover}</DatePicker.Popover>
  </DatePicker>
);

const DATE = parseDate("2025-12-16");

const trigger = (): Locator => page.getByRole("button", { name: /Calendar/ });

const group = (): Locator => {
  const element = document.querySelector<HTMLElement>(
    '[data-tds="input-group"]'
  );
  if (!element) throw new Error("No field");
  return page.elementLocator(element);
};

// Open, placed, and done animating in
const opened = async (): Promise<void> => {
  await expect.element(page.getByRole("grid")).toBeVisible();
  await settled();
};

describe("DatePicker", () => {
  it("empty", async () => {
    await render(picker({}));
    await snap();
  });

  it("with a value", async () => {
    await render(picker({ defaultValue: DATE }));
    await snap();
  });

  it("hovered", async () => {
    await render(picker({ defaultValue: DATE }));
    await hover(group());
    await snap();
  });

  it("segment focused", async () => {
    await render(picker({ defaultValue: DATE }));
    await focusVisible(page.getByRole("spinbutton", { name: /day/ }));
    await snap();
  });

  it("trigger focused", async () => {
    await render(picker({ defaultValue: DATE }));
    await focusVisible(trigger());
    await snap();
  });

  it("invalid", async () => {
    await render(picker({ defaultValue: DATE, isInvalid: true }));
    await snap();
  });

  it("disabled", async () => {
    await render(picker({ defaultValue: DATE, isDisabled: true }));
    await snap();
  });

  it("open", async () => {
    await render(picker({ defaultValue: DATE }));
    await userEvent.click(trigger());
    await opened();
    await snap(viewport());
  });

  it("open, day hovered", async () => {
    await render(picker({ defaultValue: DATE }));
    await userEvent.click(trigger());
    await opened();
    await hover(page.getByRole("button", { name: /December 10, 2025/ }));
    await snap(viewport());
  });

  it("open from the keyboard, day focused", async () => {
    await render(picker({ defaultValue: DATE }));
    await focusVisible(trigger());
    await userEvent.keyboard("{Enter}");
    await opened();
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .element(page.getByRole("button", { name: /December 17, 2025/ }))
      .toHaveAttribute("data-focus-visible");
    await snap(viewport());
  });

  it("open, picking a year", async () => {
    await render(picker({ defaultValue: DATE }));
    await userEvent.click(trigger());
    await opened();
    await userEvent.click(page.getByRole("button", { name: /December 2025/ }));
    await expect.element(page.getByText("2024", { exact: true })).toBeVisible();
    await snap(viewport());
  });

  it("open, with a time", async () => {
    await render(
      picker(
        {
          defaultValue: parseDateTime("2025-12-16T10:30"),
          granularity: "minute"
        },
        <div className="date-picker-stories-popover">
          {calendar}
          <TimeField
            className="date-picker-stories-time"
            defaultValue={parseDateTime("2025-12-16T10:30")}
          >
            <Label>Time</Label>
            <TimeField.Group variant="secondary">
              <TimeField.Input>
                {(segment) => <TimeField.Segment segment={segment} />}
              </TimeField.Input>
            </TimeField.Group>
          </TimeField>
        </div>
      )
    );
    await userEvent.click(trigger());
    await opened();
    await snap(viewport());
  });
});
