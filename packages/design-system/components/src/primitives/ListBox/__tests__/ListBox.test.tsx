import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Header } from "../../Header";
import { Separator } from "../../Separator";
import { ListBox } from "..";

describe("ListBox", () => {
  it("marks the pressed option as selected and shows its indicator", async () => {
    const screen = await render(
      <ListBox aria-label="Base map" selectionMode="single">
        <ListBox.Item id="osm" textValue="OpenStreetMap">
          OpenStreetMap
          <ListBox.ItemIndicator />
        </ListBox.Item>
        <ListBox.Item id="satellite" textValue="Satellite">
          Satellite
          <ListBox.ItemIndicator />
        </ListBox.Item>
      </ListBox>
    );

    const satellite = screen.getByRole("option", { name: "Satellite" });
    await satellite.click();

    await expect.element(satellite).toHaveAttribute("aria-selected", "true");
    expect(
      satellite.element().querySelector('[data-tds="list-box-item-indicator"]')
    ).toHaveAttribute("data-visible");
    expect(
      screen
        .getByRole("option", { name: "OpenStreetMap" })
        .element()
        .querySelector('[data-tds="list-box-item-indicator"]')
    ).not.toHaveAttribute("data-visible");
  });

  it("moves to an option typed, its text in several parts", async () => {
    const layers = [
      { name: "Roads", count: 2 },
      { name: "Suburbs", count: 5 }
    ];
    const screen = await render(
      <ListBox aria-label="Layers">
        {layers.map(({ name, count }) => (
          <ListBox.Item key={name} id={name}>
            {name} ({count})
          </ListBox.Item>
        ))}
      </ListBox>
    );

    await userEvent.tab();
    await userEvent.keyboard("s");

    await expect
      .element(screen.getByRole("option", { name: "Suburbs (5)" }))
      .toHaveFocus();
  });

  it("groups options in sections named by their header", async () => {
    const screen = await render(
      <ListBox aria-label="Layers">
        <ListBox.Section>
          <Header>Imagery</Header>
          <ListBox.Item>Satellite</ListBox.Item>
        </ListBox.Section>
        <Separator />
        <ListBox.Section>
          <Header>Boundaries</Header>
          <ListBox.Item>Suburbs</ListBox.Item>
        </ListBox.Section>
      </ListBox>
    );

    await expect
      .element(
        screen
          .getByRole("group", { name: "Boundaries" })
          .getByRole("option", { name: "Suburbs" })
      )
      .toBeVisible();
    await expect.element(screen.getByRole("separator")).toBeInTheDocument();
  });
});

describe("ListBox item indicator", () => {
  it("sits at the end after a plain-text label", async () => {
    const screen = await render(
      <ListBox
        aria-label="Layers"
        selectionMode="single"
        defaultSelectedKeys={["schools"]}
      >
        <ListBox.Item id="schools">
          Schools
          <ListBox.ItemIndicator />
        </ListBox.Item>
      </ListBox>
    );
    const item = screen.getByRole("option", { name: "Schools" }).element();
    const indicator = item.querySelector(
      '[data-tds="list-box-item-indicator"]'
    );
    if (!indicator) throw new Error("No indicator");

    // 12px in from the item's end, as the design has it
    expect(
      item.getBoundingClientRect().right -
        indicator.getBoundingClientRect().right
    ).toBeCloseTo(12, 0);
  });
});

// React 18 drops `ref` from plain function components; each part forwards it
describe("ListBox refs", () => {
  it("reaches the item indicator element", async () => {
    const indicator = createRef<HTMLSpanElement>();
    await render(
      <ListBox aria-label="Base map" selectionMode="single">
        <ListBox.Item id="osm" textValue="OpenStreetMap">
          OpenStreetMap
          <ListBox.ItemIndicator ref={indicator} />
        </ListBox.Item>
      </ListBox>
    );

    expect(indicator.current?.getAttribute("data-tds")).toBe(
      "list-box-item-indicator"
    );
  });
});
