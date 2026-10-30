import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  AdjustmentsHorizontalIcon,
  InfoCircleIcon
} from "@terria/design-system-icons";
import { focusVisible, snap, viewport } from "../../../visual";
import { Button } from "../../Button";
import { Popover } from "..";
import "./popover.visual.css";

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

const PLACEMENTS = ["top", "bottom", "left", "right"] as const;

// Open, placed, and done animating in
const opened = async (): Promise<void> => {
  await expect.element(page.getByRole("dialog")).toBeVisible();
  await settled();
};

const mapSettings = ({
  hasArrow = true,
  placement
}: {
  hasArrow?: boolean;
  placement?: (typeof PLACEMENTS)[number];
} = {}): React.ReactElement => (
  <div className="popover-visual-stage">
    <Popover>
      <Button isIconOnly aria-label="Map settings">
        <AdjustmentsHorizontalIcon size={20} />
      </Button>
      <Popover.Content placement={placement}>
        <Popover.Dialog>
          {hasArrow ? <Popover.Arrow /> : null}
          <Popover.Heading>Map settings</Popover.Heading>
          The arrow points at the trigger.
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  </div>
);

describe("Popover", () => {
  it("open", async () => {
    const screen = await render(mapSettings());
    await userEvent.click(screen.getByRole("button", { name: "Map settings" }));
    await opened();
    await snap(viewport());
  });

  it("open without an arrow", async () => {
    const screen = await render(mapSettings({ hasArrow: false }));
    await userEvent.click(screen.getByRole("button", { name: "Map settings" }));
    await opened();
    await snap(viewport());
  });

  it.each(PLACEMENTS)("placed %s", async (placement) => {
    const screen = await render(mapSettings({ placement }));
    await userEvent.click(screen.getByRole("button", { name: "Map settings" }));
    await opened();
    await snap(viewport());
  });

  it.each(PLACEMENTS)("placed %s without an arrow", async (placement) => {
    const screen = await render(mapSettings({ placement, hasArrow: false }));
    await userEvent.click(screen.getByRole("button", { name: "Map settings" }));
    await opened();
    await snap(viewport());
  });

  // An action without a backdrop blur: text in a blurred button's layer is
  // antialiased differently from run to run under load
  it("with an action", async () => {
    const screen = await render(
      <div className="popover-visual-stage">
        <Popover>
          <Button variant="danger-soft">Remove layer</Button>
          <Popover.Content>
            <Popover.Dialog>
              <Popover.Arrow />
              <Popover.Heading>Remove Suburbs 2021?</Popover.Heading>
              <p className="tds-m-0">The layer is removed from the map.</p>
              <div className="tds-flex tds-flex-gap-sm tds-justify-end tds-mt-md">
                <Button size="sm" variant="danger">
                  Remove
                </Button>
              </div>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      </div>
    );
    await userEvent.click(screen.getByRole("button", { name: "Remove layer" }));
    await opened();
    await snap(viewport());
  });
});

describe("Popover.Trigger", () => {
  const trigger = (
    <Popover>
      <Popover.Trigger aria-label="Layer info">
        <InfoCircleIcon size={20} />
      </Popover.Trigger>
      <Popover.Content>
        <Popover.Dialog>
          <Popover.Arrow />
          <Popover.Heading>Layer info</Popover.Heading>
          Data from the 2021 census.
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );

  it("default", async () => {
    await render(trigger);
    await snap();
  });

  it("focused", async () => {
    const screen = await render(trigger);
    await focusVisible(screen.getByRole("button", { name: "Layer info" }));
    await snap();
  });

  it("disabled", async () => {
    await render(
      <Popover>
        <Popover.Trigger aria-label="Layer info" aria-disabled="true">
          <InfoCircleIcon size={20} />
        </Popover.Trigger>
        <Popover.Content>
          <Popover.Dialog>Data from the 2021 census.</Popover.Dialog>
        </Popover.Content>
      </Popover>
    );
    await snap();
  });

  it("open", async () => {
    const screen = await render(
      <div className="popover-visual-stage">{trigger}</div>
    );
    await userEvent.click(screen.getByRole("button", { name: "Layer info" }));
    await opened();
    await snap(viewport());
  });
});
