import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../Button";
import { Popover } from ".";

describe("Popover", () => {
  it("opens a dialog named by its heading when the trigger is pressed", async () => {
    const screen = await render(
      <Popover>
        <Button>Settings</Button>
        <Popover.Content>
          <Popover.Dialog>
            <Popover.Arrow />
            <Popover.Heading>Map settings</Popover.Heading>
            <p>Choose a base map</p>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    );

    await screen.getByRole("button", { name: "Settings" }).click();

    await expect
      .element(screen.getByRole("dialog", { name: "Map settings" }))
      .toBeVisible();
  });

  it("lets non-button content open it with the keyboard through Popover.Trigger", async () => {
    const screen = await render(
      <Popover>
        <Popover.Trigger aria-label="Layer info">
          <span>i</span>
        </Popover.Trigger>
        <Popover.Content>
          <Popover.Dialog aria-label="Layer details">Details</Popover.Dialog>
        </Popover.Content>
      </Popover>
    );

    screen.getByRole("button", { name: "Layer info" }).element().focus();
    await userEvent.keyboard("{Enter}");

    await expect
      .element(screen.getByRole("dialog", { name: "Layer details" }))
      .toBeVisible();
  });

  it("doesn't open from a Popover.Trigger marked disabled", async () => {
    const screen = await render(
      <Popover>
        <Popover.Trigger aria-label="Layer info" aria-disabled="true">
          <span>i</span>
        </Popover.Trigger>
        <Popover.Content>
          <Popover.Dialog aria-label="Layer details">Details</Popover.Dialog>
        </Popover.Content>
      </Popover>
    );
    const trigger = screen.getByRole("button", { name: "Layer info" });

    // Forced: the click would wait for a disabled element to be enabled
    await userEvent.click(trigger, { force: true });
    trigger.element().focus();
    await userEvent.keyboard("{Enter}");

    expect(screen.getByRole("dialog").query()).toBeNull();
  });

  it("closes from a button inside the dialog", async () => {
    const screen = await render(
      <Popover>
        <Button>Remove layer</Button>
        <Popover.Content>
          <Popover.Dialog aria-label="Confirm removal">
            <Button slot="close">Cancel</Button>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    );

    await screen.getByRole("button", { name: "Remove layer" }).click();
    await screen.getByRole("button", { name: "Cancel" }).click();

    await expect
      .element(screen.getByRole("dialog", { name: "Confirm removal" }))
      .not.toBeInTheDocument();
  });
});

// React 18 drops `ref` from plain function components; each part forwards it
describe("Popover refs", () => {
  it("reaches the trigger element", async () => {
    const trigger = createRef<HTMLDivElement>();
    await render(
      <Popover>
        <Popover.Trigger ref={trigger}>Layer info</Popover.Trigger>
        <Popover.Content>
          <Popover.Dialog aria-label="Layer details">Details</Popover.Dialog>
        </Popover.Content>
      </Popover>
    );

    expect(trigger.current?.getAttribute("data-tds")).toBe("popover-trigger");
  });
});
