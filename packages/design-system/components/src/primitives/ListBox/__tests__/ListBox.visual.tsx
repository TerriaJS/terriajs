import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MapIcon, TrashIcon, WorldIcon } from "@terria/design-system-icons";
import { hover, press, snap } from "../../../visual";
import { Description, Label } from "../../Field";
import { Header } from "../../Header";
import { Separator } from "../../Separator";
import { ListBox, type ListBoxItemVariant } from "..";

const BASE_MAPS = ["OpenStreetMap", "Satellite", "Terrain"];

const baseMaps = (
  variant: ListBoxItemVariant = "default"
): React.ReactElement => (
  <ListBox
    aria-label="Base map"
    selectionMode="single"
    defaultSelectedKeys={["satellite"]}
    disabledKeys={["terrain"]}
  >
    {BASE_MAPS.map((name) => (
      <ListBox.Item
        key={name}
        id={name.toLowerCase()}
        textValue={name}
        variant={variant}
      >
        {name}
        <ListBox.ItemIndicator />
      </ListBox.Item>
    ))}
  </ListBox>
);

describe.each(["default", "danger"] as const)("ListBox %s", (variant) => {
  it("default", async () => {
    await render(baseMaps(variant));
    await snap();
  });

  it("item hovered", async () => {
    const screen = await render(baseMaps(variant));
    await hover(screen.getByRole("option", { name: "OpenStreetMap" }));
    await snap();
  });

  it("item focused", async () => {
    const screen = await render(baseMaps(variant));
    const item = screen.getByRole("option", { name: "OpenStreetMap" });
    await userEvent.keyboard("{Tab}{Home}");
    await expect.element(item).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("item hovered and focused", async () => {
    const screen = await render(baseMaps(variant));
    const item = screen.getByRole("option", { name: "OpenStreetMap" });
    await hover(item);
    await userEvent.keyboard("{Tab}{Home}");
    await expect.element(item).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("item pressed", async () => {
    const screen = await render(baseMaps(variant));
    const item = screen.getByRole("option", { name: "OpenStreetMap" });
    await press(item);
    await expect.element(item).toHaveAttribute("data-pressed");
    await snap();
  });

  it("selected item hovered", async () => {
    const screen = await render(baseMaps(variant));
    await hover(screen.getByRole("option", { name: "Satellite" }));
    await snap();
  });

  it("selected item focused", async () => {
    const screen = await render(baseMaps(variant));
    const item = screen.getByRole("option", { name: "Satellite" });
    // Tabbing in lands on the selected item
    await userEvent.keyboard("{Tab}");
    await expect.element(item).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("disabled item hovered", async () => {
    const screen = await render(baseMaps(variant));
    await hover(screen.getByRole("option", { name: "Terrain" }));
    await snap();
  });
});

describe("ListBox", () => {
  it("selected by pressing", async () => {
    const screen = await render(baseMaps());
    const item = screen.getByRole("option", { name: "OpenStreetMap" });
    await userEvent.click(item);
    await expect.element(item).toHaveAttribute("aria-selected", "true");
    await snap();
  });

  it("dot indicator", async () => {
    await render(
      <ListBox
        aria-label="Base map"
        selectionMode="single"
        defaultSelectedKeys={["satellite"]}
      >
        {BASE_MAPS.map((name) => (
          <ListBox.Item key={name} id={name.toLowerCase()} textValue={name}>
            {name}
            <ListBox.ItemIndicator type="dot" />
          </ListBox.Item>
        ))}
      </ListBox>
    );
    await snap();
  });

  it("multiple selection", async () => {
    await render(
      <ListBox
        aria-label="Base map"
        selectionMode="multiple"
        defaultSelectedKeys={["openstreetmap", "terrain"]}
      >
        {BASE_MAPS.map((name) => (
          <ListBox.Item key={name} id={name.toLowerCase()} textValue={name}>
            {name}
            <ListBox.ItemIndicator />
          </ListBox.Item>
        ))}
      </ListBox>
    );
    await snap();
  });

  it("with icons and descriptions", async () => {
    const screen = await render(
      <ListBox aria-label="Layer actions" onAction={() => undefined}>
        <ListBox.Item textValue="Zoom to layer">
          <MapIcon aria-hidden size={20} />
          <div>
            <div>
              <Label>Zoom to layer</Label>
            </div>
            <Description>Fit the map to its extent</Description>
          </div>
        </ListBox.Item>
        <ListBox.Item textValue="Show as satellite">
          <WorldIcon aria-hidden size={20} />
          <div>
            <div>
              <Label>Show as satellite</Label>
            </div>
            <Description>Aerial imagery</Description>
          </div>
        </ListBox.Item>
        <ListBox.Item textValue="Remove layer" variant="danger">
          <TrashIcon aria-hidden size={20} />
          <div>
            <div>
              <Label>Remove layer</Label>
            </div>
            <Description>Removes it from the workbench</Description>
          </div>
        </ListBox.Item>
      </ListBox>
    );
    await hover(screen.getByRole("option", { name: "Zoom to layer" }));
    await snap();
  });

  it("sections and separator", async () => {
    await render(
      <ListBox aria-label="Layers" onAction={() => undefined}>
        <ListBox.Section>
          <Header>Imagery</Header>
          <ListBox.Item>Satellite</ListBox.Item>
          <ListBox.Item>Aerial</ListBox.Item>
        </ListBox.Section>
        <Separator />
        <ListBox.Section>
          <Header>Danger zone</Header>
          <ListBox.Item variant="danger">Remove all layers</ListBox.Item>
        </ListBox.Section>
      </ListBox>
    );
    await snap();
  });

  it("static items not hovered", async () => {
    const screen = await render(
      <ListBox aria-label="Base map">
        {BASE_MAPS.map((name) => (
          <ListBox.Item key={name}>{name}</ListBox.Item>
        ))}
      </ListBox>
    );
    await hover(screen.getByRole("option", { name: "Satellite" }));
    await snap();
  });
});
