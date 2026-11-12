import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { Button } from "../../Button";
import { Popover } from "../../Popover";
import { ButtonGroup } from "..";

// A separator's line is drawn by the button after it, at its start edge
const line = (button: Element): CSSStyleDeclaration | null => {
  const style = getComputedStyle(button, "::before");
  return style.content === "none" ? null : style;
};

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
  it("draws a separator placed between two buttons where they meet, keeping them joined", async () => {
    const screen = await render(
      <ButtonGroup aria-label="Map tools">
        <Button>Zoom in</Button>
        <ButtonGroup.Separator />
        <Button>Zoom out</Button>
      </ButtonGroup>
    );
    const zoomIn = screen.getByRole("button", { name: "Zoom in" }).element();
    const zoomOut = screen.getByRole("button", { name: "Zoom out" }).element();

    expect(zoomOut.getBoundingClientRect().left).toBe(
      zoomIn.getBoundingClientRect().right
    );
    expect(line(zoomIn)).toBeNull();
    expect(line(zoomOut)).toMatchObject({ width: "1px", left: "-1px" });
  });

  it("draws a separator between stacked buttons across them", async () => {
    const screen = await render(
      <ButtonGroup aria-label="Zoom" orientation="vertical">
        <Button>In</Button>
        <ButtonGroup.Separator />
        <Button>Out</Button>
      </ButtonGroup>
    );
    const zoomIn = screen.getByRole("button", { name: "In" }).element();
    const zoomOut = screen.getByRole("button", { name: "Out" }).element();

    expect(zoomOut.getBoundingClientRect().top).toBe(
      zoomIn.getBoundingClientRect().bottom
    );
    expect(line(zoomOut)).toMatchObject({ height: "1px", top: "-1px" });
  });

  // A button left out, as when a feature is off, leaves its separator with
  // nothing to divide
  it("draws no separator at either end, and one for several together", async () => {
    const screen = await render(
      <ButtonGroup aria-label="Map tools">
        <ButtonGroup.Separator />
        <Button>Zoom in</Button>
        <ButtonGroup.Separator />
        <ButtonGroup.Separator />
        <Button>Zoom out</Button>
        <ButtonGroup.Separator />
      </ButtonGroup>
    );

    expect(
      ["Zoom in", "Zoom out"].map(
        (name) => line(screen.getByRole("button", { name }).element()) !== null
      )
    ).toEqual([false, true]);
  });

  // Their shared border divides them already
  it("draws no separator between outline buttons", async () => {
    const screen = await render(
      <ButtonGroup aria-label="Map tools" variant="outline">
        <Button>Zoom in</Button>
        <ButtonGroup.Separator />
        <Button>Zoom out</Button>
      </ButtonGroup>
    );

    expect(
      line(screen.getByRole("button", { name: "Zoom out" }).element())
    ).toBeNull();
  });

  it("rounds its end buttons' outer corners only, among separators", async () => {
    const screen = await render(
      <ButtonGroup aria-label="Map tools">
        <ButtonGroup.Separator />
        <Button>Zoom in</Button>
        <ButtonGroup.Separator />
        <Button>Reset</Button>
        <ButtonGroup.Separator />
        <Button>Zoom out</Button>
        <ButtonGroup.Separator />
      </ButtonGroup>
    );
    const corners = (name: string): [string, string] => {
      const style = getComputedStyle(
        screen.getByRole("button", { name }).element()
      );
      return [style.borderTopLeftRadius, style.borderTopRightRadius];
    };

    expect(corners("Zoom in")[0]).not.toBe("0px");
    expect(corners("Zoom in")[1]).toBe("0px");
    expect(corners("Reset")).toEqual(["0px", "0px"]);
    expect(corners("Zoom out")[0]).toBe("0px");
    expect(corners("Zoom out")[1]).not.toBe("0px");
  });
});
