import { describe, expect, it } from "vitest";
import { render, type RenderResult } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Disclosure, type DisclosureProps } from ".";
import { Button } from "../Button";

const renderDisclosure = (
  props: Partial<DisclosureProps> = {}
): Promise<RenderResult> =>
  render(
    <Disclosure {...props}>
      <Disclosure.Heading>
        <Disclosure.Trigger>
          Layer details
          <Disclosure.Indicator />
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>
        <Disclosure.Body>Data from the 2021 census</Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>
  );

describe("Disclosure", () => {
  it("puts its trigger button inside a level 3 heading", async () => {
    const screen = await renderDisclosure();

    const heading = screen.getByRole("heading", { level: 3 });
    await expect.element(heading).toHaveTextContent("Layer details");
    await expect
      .element(heading.getByRole("button", { name: "Layer details" }))
      .toHaveAttribute("aria-expanded", "false");
  });

  it("takes another heading level", async () => {
    const screen = await render(
      <Disclosure>
        <Disclosure.Heading level={2}>
          <Disclosure.Trigger>Layer details</Disclosure.Trigger>
        </Disclosure.Heading>
        <Disclosure.Content>
          <Disclosure.Body>Data</Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    );

    await expect
      .element(screen.getByRole("heading", { level: 2 }))
      .toBeInTheDocument();
  });

  it("shows its content, named by the trigger, only while expanded", async () => {
    const screen = await renderDisclosure();
    const trigger = screen.getByRole("button", { name: "Layer details" });

    // Collapsed, the content is hidden from the accessibility tree
    await expect
      .element(screen.getByRole("group", { name: "Layer details" }))
      .not.toBeInTheDocument();

    await userEvent.click(trigger);
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
    await expect
      .element(screen.getByRole("group", { name: "Layer details" }))
      .toHaveTextContent("Data from the 2021 census");

    await userEvent.click(trigger);
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
    await expect
      .element(screen.getByText("Data from the 2021 census"))
      .not.toBeVisible();
  });

  it("toggles from the keyboard", async () => {
    const screen = await renderDisclosure();

    await userEvent.tab();
    await userEvent.keyboard("{Enter}");

    await expect
      .element(screen.getByRole("button", { name: "Layer details" }))
      .toHaveAttribute("aria-expanded", "true");
  });

  it("hides its indicator from assistive technology and flips it while expanded", async () => {
    const screen = await renderDisclosure();
    const indicator = (): Element | null =>
      screen.container.querySelector('[data-tds="disclosure-indicator"]');

    expect(indicator()?.getAttribute("aria-hidden")).toBe("true");
    expect(indicator()?.hasAttribute("data-expanded")).toBe(false);

    await userEvent.click(
      screen.getByRole("button", { name: "Layer details" })
    );

    await expect.poll(indicator).toHaveAttribute("data-expanded");
  });

  it("keeps the indicator still while expanded with isStatic", async () => {
    const screen = await render(
      <Disclosure defaultExpanded>
        <Disclosure.Heading>
          <Disclosure.Trigger>
            Layer details
            <Disclosure.Indicator isStatic />
          </Disclosure.Trigger>
        </Disclosure.Heading>
        <Disclosure.Content>
          <Disclosure.Body>Data</Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    );

    const indicator = screen.container.querySelector(
      '[data-tds="disclosure-indicator"]'
    );
    if (!indicator) throw new Error("indicator not rendered");
    expect(indicator.hasAttribute("data-expanded")).toBe(true);
    expect(getComputedStyle(indicator).rotate).toBe("none");
  });

  it("can't be toggled while disabled", async () => {
    const screen = await renderDisclosure({ isDisabled: true });

    await expect
      .element(screen.getByRole("button", { name: "Layer details" }))
      .toBeDisabled();
  });

  it("starts expanded with defaultExpanded", async () => {
    const screen = await renderDisclosure({ defaultExpanded: true });

    await expect
      .element(screen.getByText("Data from the 2021 census"))
      .toBeVisible();
  });

  it("marks the full-width layout", async () => {
    const screen = await renderDisclosure({ fullWidth: true });

    const root = screen.container.querySelector('[data-tds="disclosure"]');
    expect(root?.hasAttribute("data-tds-full-width")).toBe(true);
  });

  it("draws Disclosure.Trigger as a plain button, not a Button", async () => {
    const screen = await renderDisclosure();

    const trigger = screen.getByRole("button", { name: "Layer details" });
    await expect
      .element(trigger)
      .toHaveAttribute("data-tds", "disclosure-trigger");
    await expect.element(trigger).not.toHaveAttribute("data-tds-variant");
  });

  it("takes any Button as its trigger", async () => {
    const screen = await render(
      <Disclosure>
        <Disclosure.Heading>
          <Button slot="trigger" variant="ghost">
            Plain trigger
          </Button>
        </Disclosure.Heading>
        <Disclosure.Content>
          <Disclosure.Body>Data</Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    );
    const trigger = screen.getByRole("button", { name: "Plain trigger" });

    await userEvent.click(trigger);

    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  });
});
