import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Description, Label } from "../Field";
import { ListBox } from "../ListBox";
import { Select } from ".";

const renderSelect = (): ReturnType<typeof render> =>
  render(
    <Select placeholder="Select one">
      <Label>Base map</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Description>Shown under every layer</Description>
      <Select.Popover>
        <ListBox>
          <ListBox.Item id="osm" textValue="OpenStreetMap">
            OpenStreetMap
          </ListBox.Item>
          <ListBox.Item id="satellite" textValue="Satellite">
            Satellite
          </ListBox.Item>
        </ListBox>
      </Select.Popover>
    </Select>
  );

describe("Select", () => {
  it("names and describes its trigger and shows the placeholder", async () => {
    const screen = await renderSelect();
    const trigger = screen.getByRole("button", { name: /Base map/ });

    await expect.element(trigger).toHaveTextContent("Select one");
    await expect
      .element(trigger)
      .toHaveAccessibleDescription("Shown under every layer");
  });

  it("shows the chosen option in the trigger and closes the list", async () => {
    const screen = await renderSelect();
    const trigger = screen.getByRole("button", { name: /Base map/ });

    await trigger.click();
    await screen.getByRole("option", { name: "Satellite" }).click();

    await expect.element(trigger).toHaveTextContent("Satellite");
    await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows only the chosen option's text, not its icon or description", async () => {
    const screen = await render(
      <Select defaultValue="satellite">
        <Label>Base map</Label>
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="satellite" textValue="Satellite">
              <Label>Satellite</Label>
              <Description>Aerial imagery</Description>
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
    );

    const trigger = screen.getByRole("button", { name: /Base map/ });
    await expect.element(trigger).toHaveTextContent("Satellite");
    await expect.element(trigger).not.toHaveTextContent("Aerial imagery");
  });

  it("keeps the list open and shows every choice when selecting several", async () => {
    const screen = await render(
      <Select selectionMode="multiple" placeholder="Select layers">
        <Label>Layers</Label>
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="roads">Roads</ListBox.Item>
            <ListBox.Item id="rivers">Rivers</ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
    );
    const trigger = screen.getByRole("button", { name: /Layers/ });

    await trigger.click();
    await screen.getByRole("option", { name: "Roads" }).click();
    await screen.getByRole("option", { name: "Rivers" }).click();

    await expect.element(screen.getByRole("listbox")).toBeVisible();
    await expect.element(trigger).toHaveTextContent("Roads and Rivers");
  });

  const clearable = (
    props: { isDisabled?: boolean; onClear?: () => void } = {}
  ): ReturnType<typeof render> =>
    render(
      <Select placeholder="Select one" defaultValue="satellite" {...props}>
        <Label>Base map</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.ClearButton />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="satellite">Satellite</ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
    );

  it("clears the choice from the clear button without opening the list", async () => {
    const { ...screen } = await clearable();
    const trigger = screen.getByRole("button", { name: /Base map/ });

    await screen.getByLabelText("Clear selection").click();

    await expect.element(trigger).toHaveTextContent("Select one");
    await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
  });

  it("clears the choice with Backspace when it has a clear button", async () => {
    const screen = await clearable();
    const trigger = screen.getByRole("button", { name: /Base map/ });

    trigger.element().focus();
    await userEvent.keyboard("{Backspace}");

    await expect.element(trigger).toHaveTextContent("Select one");
  });

  it("tells the app when the choice is cleared", async () => {
    const onClear = vi.fn();
    const screen = await clearable({ onClear });
    const trigger = screen.getByRole("button", { name: /Base map/ });

    await screen.getByLabelText("Clear selection").click();
    trigger.element().focus();
    await userEvent.keyboard("{Backspace}");

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("keeps the choice when the select is disabled", async () => {
    const screen = await clearable({ isDisabled: true });

    await screen.getByLabelText("Clear selection").click({ force: true });

    await expect
      .element(screen.getByRole("button", { name: /Base map/ }))
      .toHaveTextContent("Satellite");
  });

  it("grows to show every choice instead of cutting them off", async () => {
    const options = ["New South Wales", "Victoria", "Queensland", "Tasmania"];
    const screen = await render(
      <div style={{ inlineSize: 200 }}>
        <Select selectionMode="multiple" defaultValue={options} fullWidth>
          <Label>States</Label>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {options.map((option) => (
                <ListBox.Item key={option} id={option}>
                  {option}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
    );
    const value = screen
      .getByRole("button", { name: /States/ })
      .element()
      .querySelector('[data-tds="select-value"]');

    if (!value) throw new Error("value not rendered");
    expect(value.scrollWidth).toBe(value.clientWidth);
    const range = document.createRange();
    range.selectNodeContents(value);
    const lineTops = new Set(
      [...range.getClientRects()].map((rect) => Math.round(rect.top))
    );
    expect(lineTops.size).toBeGreaterThan(1);
  });
});

// React 18 drops `ref` from plain function components; each part forwards it
describe("Select refs", () => {
  it("reaches the indicator and clear button elements", async () => {
    const indicator = createRef<HTMLSpanElement>();
    const clear = createRef<HTMLSpanElement>();
    await render(
      <Select aria-label="Base map">
        <Select.Trigger>
          <Select.Value />
          <Select.ClearButton ref={clear} />
          <Select.Indicator ref={indicator} />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="osm">OpenStreetMap</ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
    );

    expect(indicator.current?.getAttribute("data-tds")).toBe(
      "select-indicator"
    );
    expect(clear.current?.getAttribute("data-tds")).toBe("select-clear-button");
  });
});
