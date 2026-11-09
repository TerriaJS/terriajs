import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { EyeClosedIcon, EyeIcon } from "@terria/design-system-icons";
import { focusVisible, snap } from "../../../visual";
import { Label } from "../../Field";
import { Switch, SwitchPrimitive, type SwitchSize } from "..";

const SIZES: SwitchSize[] = ["sm", "md", "lg"];

const CASES = SIZES.flatMap((size) =>
  (["off", "on"] as const).map((state) => [size, state] as const)
);

// No hovered or pressed look: the track only changes when on, focused or
// disabled
describe.each(CASES)("Switch %s %s", (size, state) => {
  const isOn = state === "on";

  it("default", async () => {
    await render(
      <Switch size={size} defaultSelected={isOn}>
        Show labels
      </Switch>
    );
    await snap();
  });

  it("focused", async () => {
    const screen = await render(
      <Switch size={size} defaultSelected={isOn}>
        Show labels
      </Switch>
    );
    await focusVisible(screen.getByRole("switch"));
    await expect
      .element(screen.getByText("Show labels"))
      .toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("disabled", async () => {
    await render(
      <Switch size={size} defaultSelected={isOn} isDisabled>
        Show labels
      </Switch>
    );
    await snap();
  });
});

describe("Switch", () => {
  it("with a description", async () => {
    await render(
      <Switch description="Draws place names on the map">Show labels</Switch>
    );
    await snap();
  });

  it("invalid", async () => {
    await render(
      <Switch isInvalid errorMessage="Enable labels to continue">
        Show labels
      </Switch>
    );
    await snap();
  });

  it.each(["off", "on"] as const)(
    "primitive with an icon, %s",
    async (state) => {
      await render(
        <SwitchPrimitive defaultSelected={state === "on"}>
          {({ isSelected }) => (
            <SwitchPrimitive.Content>
              <SwitchPrimitive.Control>
                <SwitchPrimitive.Thumb>
                  <SwitchPrimitive.Icon>
                    {isSelected ? <EyeIcon /> : <EyeClosedIcon />}
                  </SwitchPrimitive.Icon>
                </SwitchPrimitive.Thumb>
              </SwitchPrimitive.Control>
              <Label>Show layer</Label>
            </SwitchPrimitive.Content>
          )}
        </SwitchPrimitive>
      );
      await snap();
    }
  );

  it("primitive without a label", async () => {
    await render(
      <SwitchPrimitive aria-label="Show labels" defaultSelected>
        <SwitchPrimitive.Content>
          <SwitchPrimitive.Control>
            <SwitchPrimitive.Thumb />
          </SwitchPrimitive.Control>
        </SwitchPrimitive.Content>
      </SwitchPrimitive>
    );
    await snap();
  });
});
