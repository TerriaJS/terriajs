import { describe, expect, it, onTestFinished } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Button } from "../Button";
import { Tooltip, TooltipPrimitive } from ".";

describe("TooltipPrimitive", () => {
  it("describes its trigger while the trigger has keyboard focus", async () => {
    const screen = await render(
      <TooltipPrimitive>
        <Button aria-label="Zoom in">+</Button>
        <TooltipPrimitive.Content>Zoom in one level</TooltipPrimitive.Content>
      </TooltipPrimitive>
    );

    await userEvent.tab();

    await expect
      .element(screen.getByRole("tooltip"))
      .toHaveTextContent("Zoom in one level");
    await expect
      .element(screen.getByRole("button", { name: "Zoom in" }))
      .toHaveAccessibleDescription("Zoom in one level");
  });

  it("opens on hover after its delay", async () => {
    const screen = await render(
      <TooltipPrimitive delay={0}>
        <Button>Zoom in</Button>
        <TooltipPrimitive.Content>Zoom in one level</TooltipPrimitive.Content>
      </TooltipPrimitive>
    );

    // Hover only opens tooltips once the last interaction was a pointer, and
    // the keyboard tests before this one leave it on the keyboard
    await userEvent.click(document.body);
    await screen.getByRole("button", { name: "Zoom in" }).hover();

    await expect
      .element(screen.getByRole("tooltip"))
      .toHaveTextContent("Zoom in one level");
  });

  it("waits the page's --terria-ds-tooltip-delay before opening", async () => {
    document.documentElement.style.setProperty(
      "--terria-ds-tooltip-delay",
      "0ms"
    );
    onTestFinished(() => {
      document.documentElement.style.removeProperty(
        "--terria-ds-tooltip-delay"
      );
    });
    const screen = await render(
      <TooltipPrimitive>
        <Button>Zoom in</Button>
        <TooltipPrimitive.Content>Zoom in one level</TooltipPrimitive.Content>
      </TooltipPrimitive>
    );

    await userEvent.click(document.body);
    await screen.getByRole("button", { name: "Zoom in" }).hover();

    await expect
      .element(screen.getByRole("tooltip"), { timeout: 500 })
      .toHaveTextContent("Zoom in one level");
  });

  it("lets its delay prop override the page's", async () => {
    document.documentElement.style.setProperty(
      "--terria-ds-tooltip-delay",
      "60s"
    );
    onTestFinished(() => {
      document.documentElement.style.removeProperty(
        "--terria-ds-tooltip-delay"
      );
    });
    const screen = await render(
      <TooltipPrimitive delay={0}>
        <Button>Zoom in</Button>
        <TooltipPrimitive.Content>Zoom in one level</TooltipPrimitive.Content>
      </TooltipPrimitive>
    );

    await userEvent.click(document.body);
    await screen.getByRole("button", { name: "Zoom in" }).hover();

    await expect
      .element(screen.getByRole("tooltip"))
      .toHaveTextContent("Zoom in one level");
  });

  it("closes on Escape", async () => {
    const screen = await render(
      <TooltipPrimitive>
        <Button>Zoom in</Button>
        <TooltipPrimitive.Content>Zoom in one level</TooltipPrimitive.Content>
      </TooltipPrimitive>
    );

    await userEvent.tab();
    await expect.element(screen.getByRole("tooltip")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");

    await expect.element(screen.getByRole("tooltip")).not.toBeInTheDocument();
  });

  it("makes content that isn't a button focusable through Tooltip.Trigger", async () => {
    const screen = await render(
      <TooltipPrimitive>
        <TooltipPrimitive.Trigger aria-label="Layer status">
          ●
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Content>Layer is loading</TooltipPrimitive.Content>
      </TooltipPrimitive>
    );

    await userEvent.tab();

    await expect
      .element(screen.getByRole("button", { name: "Layer status" }))
      .toHaveFocus();
    await expect
      .element(screen.getByRole("tooltip"))
      .toHaveTextContent("Layer is loading");
  });

  it("forwards its ref to Tooltip.Trigger's element", async () => {
    const ref = { current: null as HTMLDivElement | null };
    await render(
      <TooltipPrimitive>
        <TooltipPrimitive.Trigger ref={ref}>●</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Content>Layer is loading</TooltipPrimitive.Content>
      </TooltipPrimitive>
    );

    expect(ref.current?.getAttribute("data-tds")).toBe("tooltip-trigger");
  });
});

describe("Tooltip", () => {
  it("describes its trigger with its content while focused", async () => {
    const screen = await render(
      <Tooltip content="Zoom in one level">
        <Button aria-label="Zoom in">+</Button>
      </Tooltip>
    );

    await userEvent.tab();

    await expect
      .element(screen.getByRole("button", { name: "Zoom in" }))
      .toHaveAccessibleDescription("Zoom in one level");
  });

  it("points an arrow at its trigger unless told not to", async () => {
    const screen = await render(
      <>
        <Tooltip content="With arrow" isOpen>
          <Button>One</Button>
        </Tooltip>
        <Tooltip content="Without arrow" isOpen showArrow={false}>
          <Button>Two</Button>
        </Tooltip>
      </>
    );
    const arrowIn = (text: string): Element | null | undefined =>
      screen
        .getByText(text)
        .element()
        .closest("[data-tds='tooltip']")
        ?.querySelector("[data-tds='tooltip-arrow']");

    await expect.element(screen.getByText("With arrow")).toBeVisible();
    expect(arrowIn("With arrow")).not.toBeNull();
    expect(arrowIn("Without arrow")).toBeNull();
  });
});
