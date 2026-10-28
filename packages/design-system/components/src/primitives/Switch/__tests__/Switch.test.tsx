import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Description, Label } from "../../Field";
import { Switch, SwitchPrimitive, type SwitchPrimitiveProps } from "..";

const renderSwitchPrimitive = (
  props: Partial<SwitchPrimitiveProps> = {}
): ReturnType<typeof render> =>
  render(
    <SwitchPrimitive {...props}>
      <SwitchPrimitive.Content>
        <SwitchPrimitive.Control>
          <SwitchPrimitive.Thumb />
        </SwitchPrimitive.Control>
        <Label>Show labels</Label>
      </SwitchPrimitive.Content>
      <Description>Draws place names on the map</Description>
    </SwitchPrimitive>
  );

describe("SwitchPrimitive", () => {
  it("is a switch named by its label and described by its description", async () => {
    const screen = await renderSwitchPrimitive();

    await expect
      .element(screen.getByRole("switch", { name: "Show labels" }))
      .toHaveAccessibleDescription("Draws place names on the map");
  });

  it("turns on and off when its label is pressed", async () => {
    const screen = await renderSwitchPrimitive();
    const control = screen.getByRole("switch", {
      name: "Show labels"
    });

    await screen.getByText("Show labels").click();
    await expect.element(control).toBeChecked();

    await screen.getByText("Show labels").click();
    await expect.element(control).not.toBeChecked();
  });

  it("stays put while disabled", async () => {
    const screen = await renderSwitchPrimitive({ isDisabled: true });

    await screen.getByText("Show labels").click({ force: true });

    await expect
      .element(screen.getByRole("switch", { name: "Show labels" }))
      .not.toBeChecked();
  });
});

describe("Switch", () => {
  it("names the switch and connects its description", async () => {
    const screen = await render(
      <Switch description="Draws place names on the map">Show labels</Switch>
    );

    await expect
      .element(screen.getByRole("switch", { name: "Show labels" }))
      .toHaveAccessibleDescription("Draws place names on the map");
  });

  it("can be reached with Tab and toggled with Space", async () => {
    const screen = await render(<Switch>Show labels</Switch>);
    const control = screen.getByRole("switch", { name: "Show labels" });

    await userEvent.tab();
    await expect.element(control).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect.element(control).toBeChecked();
    await userEvent.keyboard(" ");
    await expect.element(control).not.toBeChecked();
  });

  it("requests a change and waits for the controlled value to update", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <Switch isSelected={false} onChange={onChange}>
        Show labels
      </Switch>
    );
    const control = screen.getByRole("switch", { name: "Show labels" });

    await screen.getByText("Show labels").click();
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
    await expect.element(control).not.toBeChecked();

    await screen.rerender(
      <Switch isSelected onChange={onChange}>
        Show labels
      </Switch>
    );
    await expect.element(control).toBeChecked();
    await screen.getByText("Show labels").click();
    expect(onChange).toHaveBeenLastCalledWith(false);
    await expect.element(control).toBeChecked();
  });

  it.each([false, true])(
    "preserves disabled selection (%s) without emitting changes",
    async (isSelected) => {
      const onChange = vi.fn();
      const screen = await render(
        <Switch isDisabled defaultSelected={isSelected} onChange={onChange}>
          Show labels
        </Switch>
      );
      const control = screen.getByRole("switch", { name: "Show labels" });

      await expect.element(control).toBeDisabled();
      await screen.getByText("Show labels").click({ force: true });
      if (isSelected) {
        await expect.element(control).toBeChecked();
      } else {
        await expect.element(control).not.toBeChecked();
      }
      expect(onChange).not.toHaveBeenCalled();
    }
  );

  it("keeps a read-only switch focusable without changing its value", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <Switch isReadOnly defaultSelected onChange={onChange}>
        Show labels
      </Switch>
    );
    const control = screen.getByRole("switch", { name: "Show labels" });

    await userEvent.tab();
    await expect.element(control).toHaveFocus();
    await userEvent.keyboard(" ");
    await screen.getByText("Show labels").click();
    await expect.element(control).toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("supports an accessible name without a visible label", async () => {
    const screen = await render(
      <Switch aria-label="Show labels">{null}</Switch>
    );

    await expect
      .element(screen.getByRole("switch", { name: "Show labels" }))
      .not.toBeChecked();
  });

  it("connects an explicit validation error to the switch", async () => {
    const screen = await render(
      <Switch isInvalid errorMessage="Enable labels to continue">
        Show labels
      </Switch>
    );

    await expect
      .element(screen.getByText("Enable labels to continue"))
      .toBeVisible();
    await expect
      .element(screen.getByRole("switch", { name: "Show labels" }))
      .toHaveAccessibleDescription("Enable labels to continue");
  });
});

// React 18 drops `ref` from plain function components; each part forwards it
describe("SwitchPrimitive refs", () => {
  it("reaches the control, thumb and icon elements", async () => {
    const refs = {
      control: createRef<HTMLSpanElement>(),
      thumb: createRef<HTMLSpanElement>(),
      icon: createRef<HTMLSpanElement>()
    };
    await render(
      <SwitchPrimitive>
        <SwitchPrimitive.Content>
          <SwitchPrimitive.Control ref={refs.control}>
            <SwitchPrimitive.Thumb ref={refs.thumb}>
              <SwitchPrimitive.Icon ref={refs.icon}>☀</SwitchPrimitive.Icon>
            </SwitchPrimitive.Thumb>
          </SwitchPrimitive.Control>
          <Label>Dark mode</Label>
        </SwitchPrimitive.Content>
      </SwitchPrimitive>
    );

    expect(refs.control.current?.getAttribute("data-tds")).toBe(
      "switch-control"
    );
    expect(refs.thumb.current?.getAttribute("data-tds")).toBe("switch-thumb");
    expect(refs.icon.current?.getAttribute("data-tds")).toBe("switch-icon");
  });
});
