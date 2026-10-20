import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { Header } from "../Header";
import { Separator } from "../Separator";
import { ListBox } from ".";

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
