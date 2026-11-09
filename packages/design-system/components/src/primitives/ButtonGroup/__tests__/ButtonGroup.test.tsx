import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { Button } from "../../Button";
import { Popover } from "../../Popover";
import { ButtonGroup } from "..";

describe("ButtonGroup", () => {
  it("groups its buttons under one name", async () => {
    const screen = await render(
      <ButtonGroup aria-label="Map tools">
        <Button>Zoom in</Button>
        <Button>Zoom out</Button>
      </ButtonGroup>
    );

    const group = screen.getByRole("group", { name: "Map tools" });
    await expect
      .element(group.getByRole("button", { name: "Zoom in" }))
      .toBeVisible();
    await expect
      .element(group.getByRole("button", { name: "Zoom out" }))
      .toBeVisible();
  });

  it("gives its buttons its size and variant unless they set their own", async () => {
    const screen = await render(
      <ButtonGroup aria-label="Map tools" size="sm" variant="outline">
        <Button>Zoom in</Button>
        <Button variant="danger">Reset</Button>
      </ButtonGroup>
    );

    const zoom = screen.getByRole("button", { name: "Zoom in" });
    await expect.element(zoom).toHaveAttribute("data-tds-size", "sm");
    await expect.element(zoom).toHaveAttribute("data-tds-variant", "outline");
    await expect
      .element(screen.getByRole("button", { name: "Reset" }))
      .toHaveAttribute("data-tds-variant", "danger");
  });

  it("disables all its buttons", async () => {
    const screen = await render(
      <ButtonGroup aria-label="Map tools" isDisabled>
        <Button>Zoom in</Button>
        <Button>Zoom out</Button>
      </ButtonGroup>
    );

    await expect
      .element(screen.getByRole("button", { name: "Zoom in" }))
      .toBeDisabled();
    await expect
      .element(screen.getByRole("button", { name: "Zoom out" }))
      .toBeDisabled();
  });

  it("doesn't style buttons inside a popover opened from the group", async () => {
    const screen = await render(
      <ButtonGroup aria-label="Map tools" variant="outline">
        <Popover>
          <Button>More</Button>
          <Popover.Content>
            <Popover.Dialog aria-label="More tools">
              <Button>Measure</Button>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      </ButtonGroup>
    );

    await screen.getByRole("button", { name: "More" }).click();

    await expect
      .element(screen.getByRole("button", { name: "Measure" }))
      .toHaveAttribute("data-tds-variant", "primary");
  });

  it("forwards its ref to the group element", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <ButtonGroup ref={ref} aria-label="Map tools">
        <Button>Zoom in</Button>
      </ButtonGroup>
    );

    expect(ref.current?.getAttribute("role")).toBe("group");
  });

  it("makes its buttons one width when vertical", async () => {
    const screen = await render(
      <ButtonGroup aria-label="Map tools" orientation="vertical">
        <Button>In</Button>
        <Button>Reset view</Button>
      </ButtonGroup>
    );
    const width = (name: string): number =>
      screen.getByRole("button", { name }).element().getBoundingClientRect()
        .width;

    expect(width("In")).toBe(width("Reset view"));
  });
});
