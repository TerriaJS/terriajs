import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import {
  MapIcon,
  MapPinIcon,
  WorldIcon,
  WorldMapIcon
} from "@terria/design-system-icons";
import { focusVisible, hover, snap } from "../../../visual";
import { Description, ErrorMessage, Label } from "../../Field";
import { Tag, TagGroup, type TagGroupProps, type TagVariant } from "..";

const LAYERS = ["Suburbs", "Schools", "Hospitals", "Bike paths"];

const layers = (
  props: Omit<TagGroupProps, "children"> = {},
  after?: React.ReactNode
): React.ReactElement => (
  <TagGroup selectionMode="single" {...props}>
    <Label>Layers</Label>
    <TagGroup.List>
      {LAYERS.map((layer) => (
        <Tag key={layer} id={layer}>
          {layer}
        </Tag>
      ))}
    </TagGroup.List>
    {after}
  </TagGroup>
);

const noop = (): void => undefined;

const VARIANTS: TagVariant[] = ["default", "surface"];

const CASES = VARIANTS.flatMap((variant) =>
  (["unselected", "selected"] as const).map(
    (selection) => [variant, selection] as const
  )
);

// The first tag in each state
describe.each(CASES)("Tag %s %s", (variant, selection) => {
  const group = (
    props: Omit<TagGroupProps, "children"> = {}
  ): React.ReactElement =>
    layers({
      variant,
      defaultSelectedKeys: selection === "selected" ? ["Suburbs"] : [],
      ...props
    });

  it("default", async () => {
    await render(group());
    await snap();
  });

  it("hovered", async () => {
    const screen = await render(group());
    const tag = screen.getByRole("row", { name: "Suburbs" });
    await hover(tag);
    await expect.element(tag).toHaveAttribute("data-hovered");
    await snap();
  });

  it("focused", async () => {
    const screen = await render(group());
    const tag = screen.getByRole("row", { name: "Suburbs" });
    await focusVisible(tag);
    await expect.element(tag).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("hovered and focused", async () => {
    const screen = await render(group());
    const tag = screen.getByRole("row", { name: "Suburbs" });
    await focusVisible(tag);
    await hover(tag);
    await expect.element(tag).toHaveAttribute("data-focus-visible");
    await expect.element(tag).toHaveAttribute("data-hovered");
    await snap();
  });

  it("disabled", async () => {
    await render(group({ disabledKeys: ["Suburbs"] }));
    await snap();
  });
});

describe("TagGroup", () => {
  it.each(["sm", "md", "lg"] as const)("size %s", async (size) => {
    await render(layers({ size, defaultSelectedKeys: ["Schools"] }));
    await snap();
  });

  it("with icons", async () => {
    await render(
      <TagGroup selectionMode="single" defaultSelectedKeys={["Suburbs"]}>
        <Label>Layers</Label>
        <TagGroup.List>
          {[
            { name: "Suburbs", Icon: MapIcon },
            { name: "Places", Icon: MapPinIcon },
            { name: "Imagery", Icon: WorldIcon },
            { name: "Boundaries", Icon: WorldMapIcon }
          ].map(({ name, Icon }) => (
            <Tag key={name} id={name}>
              <Icon aria-hidden />
              {name}
            </Tag>
          ))}
        </TagGroup.List>
      </TagGroup>
    );
    await snap();
  });

  it("several selected", async () => {
    await render(
      layers({
        selectionMode: "multiple",
        defaultSelectedKeys: ["Suburbs", "Hospitals"]
      })
    );
    await snap();
  });

  it("with a description", async () => {
    await render(layers({}, <Description>Shown on the map</Description>));
    await snap();
  });

  it("with an error message", async () => {
    await render(
      layers(
        { selectionMode: "multiple" },
        <ErrorMessage>Select at least one layer</ErrorMessage>
      )
    );
    await snap();
  });
});

describe("TagGroup removable", () => {
  const removable = (): React.ReactElement =>
    layers({ selectionMode: "none", onRemove: noop });

  it("default", async () => {
    await render(removable());
    await snap();
  });

  it("with a tag hovered", async () => {
    const screen = await render(removable());
    await hover(screen.getByText("Suburbs"));
    await snap();
  });

  it("with a remove button hovered", async () => {
    const screen = await render(removable());
    const remove = screen
      .getByRole("row", { name: "Suburbs" })
      .getByRole("button");
    await hover(remove);
    await expect.element(remove).toHaveAttribute("data-hovered");
    await snap();
  });

  it("with a tag focused", async () => {
    const screen = await render(removable());
    const tag = screen.getByRole("row", { name: "Suburbs" });
    await focusVisible(tag);
    await expect.element(tag).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it.each(["sm", "lg"] as const)("size %s", async (size) => {
    await render(layers({ size, selectionMode: "none", onRemove: noop }));
    await snap();
  });
});
