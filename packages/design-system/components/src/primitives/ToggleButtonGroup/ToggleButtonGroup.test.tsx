import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { userEvent, type Locator } from "vitest/browser";
import { render } from "vitest-browser-react";
import { ToggleButton } from "../ToggleButton";
import { ToggleButtonGroup } from ".";

const alignments = (
  props: Partial<Parameters<typeof ToggleButtonGroup>[0]> = {}
): ReactElement => (
  <ToggleButtonGroup aria-label="Alignment" {...props}>
    <ToggleButton id="left">Left</ToggleButton>
    <ToggleButton id="centre">
      <ToggleButtonGroup.Separator />
      Centre
    </ToggleButton>
    <ToggleButton id="right">
      <ToggleButtonGroup.Separator />
      Right
    </ToggleButton>
  </ToggleButtonGroup>
);

type Screen = Awaited<ReturnType<typeof render>>;

// One selection makes the group a radio group, its buttons radios; with
// several, they stay toggle buttons
const option = (screen: Screen, name: string): Locator =>
  screen.getByRole("radio", { name });

const checked = (screen: Screen): string[] =>
  ["Left", "Centre", "Right"].filter(
    (name) =>
      option(screen, name).element().getAttribute("aria-checked") === "true"
  );

const rect = (screen: Screen, name: string): DOMRect =>
  option(screen, name).element().getBoundingClientRect();

describe("ToggleButtonGroup", () => {
  it("turns on one button at a time by default, as a radio group", async () => {
    const screen = await render(alignments());

    await expect
      .element(screen.getByRole("radiogroup", { name: "Alignment" }))
      .toBeVisible();
    await userEvent.click(option(screen, "Left"));
    await userEvent.click(option(screen, "Right"));

    expect(checked(screen)).toEqual(["Right"]);
  });

  it("turns on several when it allows multiple", async () => {
    const screen = await render(alignments({ selectionMode: "multiple" }));

    await userEvent.click(screen.getByRole("button", { name: "Left" }));
    await userEvent.click(screen.getByRole("button", { name: "Right" }));

    expect(
      ["Left", "Centre", "Right"].filter(
        (name) =>
          screen
            .getByRole("button", { name })
            .element()
            .getAttribute("aria-pressed") === "true"
      )
    ).toEqual(["Left", "Right"]);
  });

  it("keeps one on when it doesn't allow none", async () => {
    const screen = await render(
      alignments({
        defaultSelectedKeys: ["centre"],
        disallowEmptySelection: true
      })
    );

    await userEvent.click(option(screen, "Centre"));

    expect(checked(screen)).toEqual(["Centre"]);
  });

  it("gives its buttons its size", async () => {
    const screen = await render(alignments({ size: "sm" }));

    expect(rect(screen, "Left").height).toBe(32);
  });

  it("joins its buttons, with separators between them", async () => {
    const screen = await render(alignments());

    expect(rect(screen, "Centre").left).toBe(rect(screen, "Left").right);
    expect(
      option(screen, "Centre")
        .element()
        .querySelector("[data-tds='button-group-separator']")
    ).not.toBeNull();
  });

  it("spaces its buttons apart when detached, each fully rounded", async () => {
    const screen = await render(alignments({ isDetached: true }));
    const centre = option(screen, "Centre").element();

    expect(rect(screen, "Centre").left - rect(screen, "Left").right).toBe(16);
    expect(getComputedStyle(centre).borderTopLeftRadius).not.toBe("0px");
    // Separators belong to joined buttons only
    const separator = centre.querySelector(
      "[data-tds='button-group-separator']"
    );
    expect(separator && getComputedStyle(separator).display).toBe("none");
  });

  it("stacks its buttons when vertical", async () => {
    const screen = await render(alignments({ orientation: "vertical" }));

    expect(rect(screen, "Centre").top).toBe(rect(screen, "Left").bottom);
    // One column: every button as wide as the widest
    expect(rect(screen, "Left").width).toBe(rect(screen, "Centre").width);
  });

  it("disables all its buttons", async () => {
    const screen = await render(alignments({ isDisabled: true }));

    for (const name of ["Left", "Centre", "Right"]) {
      await expect.element(option(screen, name)).toBeDisabled();
    }
  });
});
