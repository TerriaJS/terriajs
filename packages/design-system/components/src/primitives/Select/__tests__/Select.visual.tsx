import { describe, expect, it } from "vitest";
import { page, userEvent, type Locator } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { ReactNode } from "react";
import {
  CaretUpDownIcon,
  MapIcon,
  WorldIcon,
  WorldMapIcon
} from "@terria/design-system-icons";
import { focusVisible, hover, snap, viewport } from "../../../visual";
import { Description, FieldError, Label } from "../../Field";
import { Header } from "../../Header";
import { ListBox } from "../../ListBox";
import { Separator } from "../../Separator";
import { Select, type SelectProps } from "..";
import "./select.visual.css";

// Done animating in: no data-entering left, every animation finished, and
// two frames drawn since, so nothing is caught on a layer of its own
const settled = async (): Promise<void> => {
  await expect.poll(() => document.querySelector("[data-entering]")).toBeNull();
  await Promise.all(
    document.getAnimations().map((animation) => animation.finished)
  );
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
};

const STATES = [
  "Australian Capital Territory",
  "New South Wales",
  "Northern Territory",
  "Queensland",
  "South Australia",
  "Tasmania",
  "Victoria"
];

// Open, placed, and done animating in
const opened = async (): Promise<void> => {
  await expect.element(page.getByRole("listbox")).toBeVisible();
  await settled();
};

const stateSelect = ({
  after,
  ...props
}: Partial<Omit<SelectProps<object, "single" | "multiple">, "children">> & {
  after?: ReactNode;
} = {}): React.ReactElement => (
  <div className="select-visual-field">
    <Select placeholder="Select one" fullWidth {...props}>
      <Label>State</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      {after}
      <Select.Popover>
        <ListBox>
          {STATES.map((state) => (
            <ListBox.Item key={state} id={state} textValue={state}>
              {state}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  </div>
);

const trigger = (): Locator => page.getByRole("button", { name: /State/ });

describe.each(["primary", "secondary"] as const)("Select %s", (variant) => {
  it("placeholder", async () => {
    await render(stateSelect({ variant }));
    await snap();
  });

  it("with a value", async () => {
    await render(stateSelect({ variant, defaultValue: "Victoria" }));
    await snap();
  });

  it("hovered", async () => {
    await render(stateSelect({ variant }));
    await hover(trigger());
    await snap();
  });

  it("focused", async () => {
    await render(stateSelect({ variant }));
    await focusVisible(trigger());
    await snap();
  });

  it("hovered and focused", async () => {
    await render(stateSelect({ variant }));
    await focusVisible(trigger());
    await hover(trigger());
    await snap();
  });

  it("disabled", async () => {
    await render(
      stateSelect({ variant, isDisabled: true, defaultValue: "Victoria" })
    );
    await snap();
  });

  it("invalid", async () => {
    await render(
      stateSelect({
        variant,
        isRequired: true,
        isInvalid: true,
        after: <FieldError>Choose a state</FieldError>
      })
    );
    await snap();
  });

  it("open", async () => {
    await render(stateSelect({ variant, defaultValue: "Victoria" }));
    await userEvent.click(trigger());
    await opened();
    await snap(viewport());
  });
});

describe("Select", () => {
  it("with a description", async () => {
    await render(
      stateSelect({
        after: <Description>Filters the layers to this state</Description>
      })
    );
    await snap();
  });

  it("inline", async () => {
    await render(
      <Select aria-label="State" placeholder="Select one">
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="vic">Victoria</ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
    );
    await snap();
  });

  it("several values", async () => {
    await render(
      stateSelect({
        selectionMode: "multiple",
        defaultValue: ["Victoria", "Tasmania", "Queensland"]
      })
    );
    await snap();
  });

  it("several values, open", async () => {
    await render(
      stateSelect({
        selectionMode: "multiple",
        defaultValue: ["Victoria", "Tasmania"]
      })
    );
    await userEvent.click(trigger());
    await opened();
    await snap(viewport());
  });

  it("custom indicator", async () => {
    await render(
      <div className="select-visual-field">
        <Select placeholder="Select one" fullWidth>
          <Label>State</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator>
              <CaretUpDownIcon size={16} />
            </Select.Indicator>
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="vic">Victoria</ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
    );
    await snap();
  });

  describe("clear button", () => {
    const clearable = (
      <div className="select-visual-field">
        <Select placeholder="Select one" fullWidth defaultValue="Victoria">
          <Label>State</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.ClearButton />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="Victoria">Victoria</ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
    );

    it("with a value", async () => {
      await render(clearable);
      await snap();
    });

    it("hovered", async () => {
      const screen = await render(clearable);
      const button = screen.container.querySelector<HTMLElement>(
        '[data-tds="select-clear-button"]'
      );
      if (!button) throw new Error("No clear button");
      await hover(page.elementLocator(button));
      await snap();
    });

    it("empty", async () => {
      const screen = await render(clearable);
      const button = screen.container.querySelector<HTMLElement>(
        '[data-tds="select-clear-button"]'
      );
      if (!button) throw new Error("No clear button");
      await userEvent.click(page.elementLocator(button));
      await expect.element(trigger()).toHaveTextContent("Select one");
      await snap();
    });
  });

  it("item hovered", async () => {
    await render(stateSelect({ defaultValue: "Victoria" }));
    await userEvent.click(trigger());
    await opened();
    await hover(page.getByRole("option", { name: "Queensland" }));
    await snap(viewport());
  });

  it("item focused from the keyboard", async () => {
    await render(stateSelect({ defaultValue: "Victoria" }));
    await focusVisible(trigger());
    await userEvent.keyboard("{ArrowDown}");
    await opened();
    await userEvent.keyboard("{ArrowUp}");
    await expect
      .element(page.getByRole("option", { name: "Tasmania" }))
      .toHaveAttribute("data-focus-visible");
    await snap(viewport());
  });

  it("item disabled", async () => {
    await render(stateSelect({ disabledKeys: ["Queensland", "Tasmania"] }));
    await userEvent.click(trigger());
    await opened();
    await snap(viewport());
  });

  it("empty", async () => {
    await render(
      <div className="select-visual-field">
        <Select placeholder="Select a suburb" fullWidth allowsEmptyCollection>
          <Label>Suburb</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox renderEmptyState={() => "No suburbs"}>{[]}</ListBox>
          </Select.Popover>
        </Select>
      </div>
    );
    await userEvent.click(page.getByRole("button", { name: /Suburb/ }));
    await opened();
    await snap(viewport());
  });

  it("sections, icons and descriptions", async () => {
    await render(
      <div className="select-visual-field">
        <Select
          placeholder="Choose a base map"
          fullWidth
          defaultValue="satellite"
        >
          <Label>Base map</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Section>
                <Header>Maps</Header>
                <ListBox.Item id="osm" textValue="OpenStreetMap">
                  <MapIcon aria-hidden size={16} />
                  <div className="select-visual-text">
                    <Label>OpenStreetMap</Label>
                    <Description>Streets and places</Description>
                  </div>
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="terrain" textValue="Terrain">
                  <WorldMapIcon aria-hidden size={16} />
                  <div className="select-visual-text">
                    <Label>Terrain</Label>
                    <Description>Elevation shaded relief</Description>
                  </div>
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox.Section>
              <Separator />
              <ListBox.Section>
                <Header>Imagery</Header>
                <ListBox.Item id="satellite" textValue="Satellite">
                  <WorldIcon aria-hidden size={16} />
                  <div className="select-visual-text">
                    <Label>Satellite</Label>
                    <Description>Aerial imagery</Description>
                  </div>
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox.Section>
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
    );
    await userEvent.click(page.getByRole("button", { name: /Base map/ }));
    await opened();
    await snap(viewport());
  });
});
