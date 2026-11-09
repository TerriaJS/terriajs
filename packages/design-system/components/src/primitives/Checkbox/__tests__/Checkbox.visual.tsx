import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { XIcon } from "@terria/design-system-icons";
import { focusVisible, hover, snap } from "../../../visual";
import { Label } from "../../Field";
import { Checkbox, CheckboxPrimitive } from "..";

const SELECTIONS = {
  unselected: {},
  selected: { defaultSelected: true },
  indeterminate: { isIndeterminate: true }
} as const;

// Secondary only changes the unticked box: ticked and mixed are filled alike
const CASES = [
  ...(Object.keys(SELECTIONS) as (keyof typeof SELECTIONS)[]).map(
    (selection) => ["primary", selection] as const
  ),
  ["secondary", "unselected"] as const
];

describe.each(CASES)("Checkbox %s %s", (variant, selection) => {
  const checkbox = (
    props: { isDisabled?: boolean; isInvalid?: boolean } = {}
  ): React.ReactElement => (
    <Checkbox variant={variant} {...SELECTIONS[selection]} {...props}>
      Show suburbs
    </Checkbox>
  );

  it("default", async () => {
    await render(checkbox());
    await snap();
  });

  it("hovered", async () => {
    const screen = await render(checkbox());
    const label = screen.getByText("Show suburbs");
    await hover(label);
    await expect.element(label).toHaveAttribute("data-hovered");
    await snap();
  });

  it("focused", async () => {
    const screen = await render(checkbox());
    await focusVisible(screen.getByRole("checkbox"));
    await expect
      .element(screen.getByText("Show suburbs"))
      .toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("hovered and focused", async () => {
    const screen = await render(checkbox());
    const label = screen.getByText("Show suburbs");
    await focusVisible(screen.getByRole("checkbox"));
    await hover(label);
    await expect.element(label).toHaveAttribute("data-focus-visible");
    await expect.element(label).toHaveAttribute("data-hovered");
    await snap();
  });

  it("disabled", async () => {
    await render(checkbox({ isDisabled: true }));
    await snap();
  });

  it("invalid", async () => {
    await render(checkbox({ isInvalid: true }));
    await snap();
  });
});

describe("Checkbox", () => {
  it("with a description", async () => {
    await render(
      <Checkbox description="Draws suburb boundaries on the map">
        Show suburbs
      </Checkbox>
    );
    await snap();
  });

  it("invalid with a description and an error", async () => {
    await render(
      <Checkbox
        isInvalid
        description="Draws suburb boundaries on the map"
        errorMessage="Choose at least one layer"
      >
        Show suburbs
      </Checkbox>
    );
    await snap();
  });

  it("primitive with a custom indicator", async () => {
    await render(
      <CheckboxPrimitive defaultSelected>
        {({ isSelected }) => (
          <CheckboxPrimitive.Content>
            <CheckboxPrimitive.Control>
              <CheckboxPrimitive.Indicator>
                {isSelected ? <XIcon /> : null}
              </CheckboxPrimitive.Indicator>
            </CheckboxPrimitive.Control>
            <Label>Hide this layer</Label>
          </CheckboxPrimitive.Content>
        )}
      </CheckboxPrimitive>
    );
    await snap();
  });
});
