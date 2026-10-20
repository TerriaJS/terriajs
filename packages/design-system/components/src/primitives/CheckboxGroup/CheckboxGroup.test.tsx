import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Checkbox } from "../Checkbox";
import { Description, FieldError, Label } from "../Field";
import { CheckboxGroup, type CheckboxGroupProps } from ".";

const renderGroup = (
  props: Partial<CheckboxGroupProps> = {}
): ReturnType<typeof render> =>
  render(
    <CheckboxGroup {...props}>
      <Label>Layers</Label>
      <Description>Shown on the map</Description>
      <Checkbox value="suburbs">Suburbs</Checkbox>
      <Checkbox value="roads" variant="primary">
        Roads
      </Checkbox>
      <FieldError>Choose at least one layer</FieldError>
    </CheckboxGroup>
  );

describe("CheckboxGroup", () => {
  it("is a group named by its label and described by its description", async () => {
    const screen = await renderGroup();

    await expect
      .element(screen.getByRole("group", { name: "Layers" }))
      .toHaveAccessibleDescription("Shown on the map");
  });

  it("reports the values of its checked checkboxes", async () => {
    const onChange = vi.fn();
    const screen = await renderGroup({ onChange });

    await screen.getByText("Suburbs").click();
    await screen.getByText("Roads").click();

    expect(onChange).toHaveBeenLastCalledWith(["suburbs", "roads"]);
  });

  it("marks every checkbox invalid and shows its error while invalid", async () => {
    const screen = await renderGroup({ isInvalid: true });

    await expect
      .element(screen.getByRole("group", { name: "Layers" }))
      .toHaveAccessibleDescription(/Choose at least one layer/);
    await expect
      .element(screen.getByRole("checkbox", { name: "Suburbs" }))
      .toBeInvalid();
  });

  it("keeps its description visible next to the error while invalid", async () => {
    const screen = await renderGroup({ isInvalid: true });

    await expect.element(screen.getByText("Shown on the map")).toBeVisible();
  });

  it("disables every checkbox while disabled", async () => {
    const screen = await renderGroup({ isDisabled: true });

    await expect
      .element(screen.getByRole("checkbox", { name: "Suburbs" }))
      .toBeDisabled();
  });

  it("gives its variant to checkboxes that don't set their own", async () => {
    const screen = await renderGroup({ variant: "secondary" });
    const field = (name: string): Element | null | undefined =>
      screen
        .getByRole("checkbox", { name })
        .element()
        .closest("[data-tds='checkbox']");

    expect(field("Suburbs")?.getAttribute("data-tds-variant")).toBe(
      "secondary"
    );
    expect(field("Roads")?.getAttribute("data-tds-variant")).toBe("primary");
  });
});
