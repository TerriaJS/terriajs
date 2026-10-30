import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { LineIcon, PolygonIcon, ShapeIcon } from "@terria/design-system-icons";
import { focusVisible, hover, press, snap } from "../../../visual";
import { ToggleButton } from "../../ToggleButton";
import { ToggleButtonGroup, type ToggleButtonGroupProps } from "..";

const views = (
  props: Omit<ToggleButtonGroupProps, "children"> = {}
): React.ReactElement => (
  <ToggleButtonGroup
    aria-label="Map view"
    defaultSelectedKeys={["2d"]}
    {...props}
  >
    <ToggleButton id="2d">2D</ToggleButton>
    <ToggleButton id="3d">
      <ToggleButtonGroup.Separator />
      3D
    </ToggleButton>
    <ToggleButton id="3d-smooth">
      <ToggleButtonGroup.Separator />
      3D smooth
    </ToggleButton>
  </ToggleButtonGroup>
);

describe.each([
  ["joined", {}],
  ["detached", { isDetached: true }]
] as const)("ToggleButtonGroup %s", (_, layout) => {
  it.each(["horizontal", "vertical"] as const)("%s", async (orientation) => {
    await render(views({ ...layout, orientation }));
    await snap();
  });

  it("with a button hovered", async () => {
    const screen = await render(views(layout));
    const button = screen.getByRole("radio", { name: "3D", exact: true });
    await hover(button);
    await expect.element(button).toHaveAttribute("data-hovered");
    await snap();
  });

  it("with the selected button hovered", async () => {
    const screen = await render(views(layout));
    const button = screen.getByRole("radio", { name: "2D" });
    await hover(button);
    await expect.element(button).toHaveAttribute("data-hovered");
    await snap();
  });

  it("with a button focused", async () => {
    const screen = await render(views(layout));
    const button = screen.getByRole("radio", { name: "2D" });
    await focusVisible(button);
    await expect.element(button).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("with a button pressed", async () => {
    const screen = await render(views(layout));
    const button = screen.getByRole("radio", { name: "3D", exact: true });
    await press(button);
    await expect.element(button).toHaveAttribute("data-pressed");
    await snap();
  });

  it("disabled", async () => {
    await render(views({ ...layout, isDisabled: true }));
    await snap();
  });
});

describe("ToggleButtonGroup", () => {
  // md is the default, already shown
  it.each(["sm", "lg"] as const)("size %s", async (size) => {
    await render(views({ size }));
    await snap();
  });

  it("several selected, icon only", async () => {
    await render(
      <ToggleButtonGroup
        aria-label="Drawing tools"
        selectionMode="multiple"
        defaultSelectedKeys={["line", "polygon"]}
      >
        <ToggleButton id="line" isIconOnly aria-label="Line">
          <LineIcon />
        </ToggleButton>
        <ToggleButton id="polygon" isIconOnly aria-label="Polygon">
          <ToggleButtonGroup.Separator />
          <PolygonIcon />
        </ToggleButton>
        <ToggleButton id="shape" isIconOnly aria-label="Shape">
          <ToggleButtonGroup.Separator />
          <ShapeIcon />
        </ToggleButton>
      </ToggleButtonGroup>
    );
    await snap();
  });
});
