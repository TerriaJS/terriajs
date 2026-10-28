import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../../Button";
import { Description, Label } from "../../Field";
import { Header } from "../../Header";
import { Kbd } from "../../Kbd";
import { Separator } from "../../Separator";
import { Dropdown } from "..";

describe("Dropdown", () => {
  it("opens a menu of actions from its button and runs the chosen one", async () => {
    const onAction = vi.fn();
    const screen = await render(
      <Dropdown>
        <Button>Actions</Button>
        <Dropdown.Popover>
          <Dropdown.Menu onAction={onAction}>
            <Dropdown.Item id="new">New file</Dropdown.Item>
            <Dropdown.Item id="copy">Copy link</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );

    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Copy link" }));

    expect(onAction).toHaveBeenCalledOnce();
    expect(onAction.mock.lastCall?.[0]).toBe("copy");
    await expect.element(screen.getByRole("menu")).not.toBeInTheDocument();
  });

  it("describes an item with its description", async () => {
    const screen = await render(
      <Dropdown defaultOpen>
        <Button>Actions</Button>
        <Dropdown.Popover>
          <Dropdown.Menu>
            <Dropdown.Item id="new" textValue="New file">
              <Label>New file</Label>
              <Description>Create a new file</Description>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );

    await expect
      .element(screen.getByRole("menuitem", { name: "New file" }))
      .toHaveAccessibleDescription("Create a new file");
  });

  it("groups items under section headers, with separators between", async () => {
    const screen = await render(
      <Dropdown defaultOpen>
        <Button>Actions</Button>
        <Dropdown.Popover>
          <Dropdown.Menu>
            <Dropdown.Section>
              <Header>Actions</Header>
              <Dropdown.Item id="new">New file</Dropdown.Item>
            </Dropdown.Section>
            <Separator />
            <Dropdown.Section>
              <Header>Danger zone</Header>
              <Dropdown.Item id="delete" variant="danger">
                Delete file
              </Dropdown.Item>
            </Dropdown.Section>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );

    await expect
      .element(
        screen
          .getByRole("group", { name: "Danger zone" })
          .getByRole("menuitem", { name: "Delete file" })
      )
      .toBeVisible();
    await expect.element(screen.getByRole("separator")).toBeVisible();
  });

  it("marks the one chosen item when it selects a single value", async () => {
    const screen = await render(
      <Dropdown defaultOpen>
        <Button>Base map</Button>
        <Dropdown.Popover>
          <Dropdown.Menu selectionMode="single" defaultSelectedKeys={["osm"]}>
            <Dropdown.Item id="osm" textValue="OpenStreetMap">
              <Dropdown.ItemIndicator />
              OpenStreetMap
            </Dropdown.Item>
            <Dropdown.Item id="satellite" textValue="Satellite">
              <Dropdown.ItemIndicator />
              Satellite
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );
    const osm = screen.getByRole("menuitemradio", { name: "OpenStreetMap" });

    await expect.element(osm).toHaveAttribute("aria-checked", "true");
    // The indicator shows only on the chosen item
    expect(
      osm.element().querySelector("[data-tds='list-box-item-indicator']")
    ).toHaveAttribute("data-visible");
    expect(
      screen
        .getByRole("menuitemradio", { name: "Satellite" })
        .element()
        .querySelector("[data-tds='list-box-item-indicator']")
    ).not.toHaveAttribute("data-visible");
  });

  it("leads each item with its indicator, before the text", async () => {
    const screen = await render(
      <Dropdown defaultOpen>
        <Button>Base map</Button>
        <Dropdown.Popover>
          <Dropdown.Menu selectionMode="single" defaultSelectedKeys={["osm"]}>
            <Dropdown.Item id="osm" textValue="OpenStreetMap">
              <Dropdown.ItemIndicator />
              <Label>OpenStreetMap</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );
    const item = screen
      .getByRole("menuitemradio", { name: "OpenStreetMap" })
      .element();
    const indicator = item.querySelector(
      "[data-tds='list-box-item-indicator']"
    );
    const label = item.querySelector("[data-tds='label']");
    if (!indicator || !label) throw new Error("No indicator or label");

    // 12px in from the item's start, and 12px clear of the text, once the
    // menu has grown in from its opening animation
    await expect
      .poll(
        () =>
          indicator.getBoundingClientRect().left -
          item.getBoundingClientRect().left
      )
      .toBeCloseTo(12, 0);
    expect(
      label.getBoundingClientRect().left -
        indicator.getBoundingClientRect().right
    ).toBeCloseTo(12, 0);
  });

  it("checks several items when it selects many", async () => {
    const screen = await render(
      <Dropdown defaultOpen>
        <Button>Layers</Button>
        <Dropdown.Popover>
          <Dropdown.Menu selectionMode="multiple">
            <Dropdown.Item id="roads">Roads</Dropdown.Item>
            <Dropdown.Item id="labels">Labels</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );

    await userEvent.click(
      screen.getByRole("menuitemcheckbox", { name: "Roads" })
    );
    await userEvent.click(
      screen.getByRole("menuitemcheckbox", { name: "Labels" })
    );

    await expect
      .element(screen.getByRole("menuitemcheckbox", { name: "Roads" }))
      .toHaveAttribute("aria-checked", "true");
    await expect
      .element(screen.getByRole("menuitemcheckbox", { name: "Labels" }))
      .toHaveAttribute("aria-checked", "true");
  });

  it("opens a submenu from an item", async () => {
    const screen = await render(
      <Dropdown defaultOpen>
        <Button>Share</Button>
        <Dropdown.Popover>
          <Dropdown.Menu>
            <Dropdown.Item id="copy">Copy link</Dropdown.Item>
            <Dropdown.SubmenuTrigger>
              <Dropdown.Item id="other" textValue="Other">
                Other
                <Dropdown.SubmenuIndicator />
              </Dropdown.Item>
              <Dropdown.Popover>
                <Dropdown.Menu>
                  <Dropdown.Item id="email">Email</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown.SubmenuTrigger>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );

    await userEvent.click(screen.getByRole("menuitem", { name: "Other" }));

    await expect
      .element(screen.getByRole("menuitem", { name: "Email" }))
      .toBeVisible();
  });

  it("opens a submenu beside its menu, not over it", async () => {
    await page.viewport(1024, 768);
    const screen = await render(
      <Dropdown defaultOpen>
        <Button>Share</Button>
        <Dropdown.Popover>
          <Dropdown.Menu aria-label="Share">
            <Dropdown.SubmenuTrigger>
              <Dropdown.Item id="other" textValue="Other">
                Other
                <Dropdown.SubmenuIndicator />
              </Dropdown.Item>
              <Dropdown.Popover>
                <Dropdown.Menu aria-label="Other">
                  <Dropdown.Item id="email">Email</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown.SubmenuTrigger>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );

    await userEvent.click(screen.getByRole("menuitem", { name: "Other" }));
    await expect
      .element(screen.getByRole("menuitem", { name: "Email" }))
      .toBeVisible();
    const box = (name: string): DOMRect =>
      screen.getByRole("menu", { name }).element().getBoundingClientRect();

    expect(box("Other").left).toBeGreaterThanOrEqual(box("Share").right);
  });

  it("doesn't run a disabled item", async () => {
    const onAction = vi.fn();
    const screen = await render(
      <Dropdown defaultOpen>
        <Button>Actions</Button>
        <Dropdown.Popover>
          <Dropdown.Menu onAction={onAction} disabledKeys={["delete"]}>
            <Dropdown.Item id="delete">Delete file</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );
    const item = screen.getByRole("menuitem", { name: "Delete file" });

    await expect.element(item).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(item, { force: true });
    expect(onAction).not.toHaveBeenCalled();
  });

  it("opens from content that isn't a button", async () => {
    const screen = await render(
      <Dropdown>
        <Dropdown.Trigger aria-label="Account">AG</Dropdown.Trigger>
        <Dropdown.Popover>
          <Dropdown.Menu>
            <Dropdown.Item id="sign-out">Sign out</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );

    await userEvent.click(screen.getByRole("button", { name: "Account" }));

    await expect
      .element(screen.getByRole("menuitem", { name: "Sign out" }))
      .toBeVisible();
  });

  it("marks the chosen item with a dot instead of a checkmark", async () => {
    const screen = await render(
      <Dropdown defaultOpen>
        <Button>Base map</Button>
        <Dropdown.Popover>
          <Dropdown.Menu selectionMode="single" defaultSelectedKeys={["osm"]}>
            <Dropdown.Item id="osm" textValue="OpenStreetMap">
              OpenStreetMap
              <Dropdown.ItemIndicator type="dot" />
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );
    const indicator = screen
      .getByRole("menuitemradio", { name: "OpenStreetMap" })
      .element()
      .querySelector("[data-tds='list-box-item-indicator']");

    expect(indicator).toHaveAttribute("data-tds-type", "dot");
    expect(
      indicator?.querySelector("[data-tds='list-box-item-checkmark']")
    ).toBeNull();
  });

  it("draws a custom indicator from whether its item is selected", async () => {
    const screen = await render(
      <Dropdown defaultOpen>
        <Button>Layers</Button>
        <Dropdown.Popover>
          <Dropdown.Menu
            selectionMode="multiple"
            defaultSelectedKeys={["roads"]}
          >
            {["Roads", "Labels"].map((name) => (
              <Dropdown.Item
                key={name}
                id={name.toLowerCase()}
                textValue={name}
              >
                {name}
                <Dropdown.ItemIndicator>
                  {({ isSelected }) => (isSelected ? "On" : "Off")}
                </Dropdown.ItemIndicator>
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );
    const indicator = (name: string): Element | null =>
      screen
        .getByRole("menuitemcheckbox", { name })
        .element()
        .querySelector("[data-tds='list-box-item-indicator']");

    expect(indicator("Roads")).toHaveTextContent("On");
    expect(indicator("Labels")).toHaveTextContent("Off");
  });

  it("is described by its keyboard shortcut", async () => {
    const screen = await render(
      <Dropdown defaultOpen>
        <Button>Actions</Button>
        <Dropdown.Popover>
          <Dropdown.Menu>
            <Dropdown.Item id="new" textValue="New file">
              New file
              <Kbd variant="light">
                <Kbd.Abbr keyValue="command" />
                <Kbd.Content>N</Kbd.Content>
              </Kbd>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );

    await expect
      .element(screen.getByRole("menuitem", { name: "New file" }))
      .toHaveAccessibleDescription("⌘ N");
  });
});
