import { describe, expect, it } from "vitest";
import { commands, page, userEvent, type Locator } from "vitest/browser";
import { render } from "vitest-browser-react";
import { InfoCircleIcon } from "@terria/design-system-icons";
import { hover, snap, viewport } from "../../../visual";
import { Button } from "../../Button";
import { Tooltip, TooltipTrigger, type TooltipProps } from "..";
import "./tooltip.visual.css";

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

// Shown, placed, and done fading in
const shown = async (): Promise<void> => {
  await expect.element(page.getByRole("tooltip")).toBeVisible();
  await settled();
};

// A tooltip opens on hover only once the last interaction was the pointer's,
// so a click away first, as a person's last click would have been
const hoverOpen = async (trigger: Locator): Promise<void> => {
  await commands.mouseAway();
  await commands.mouseDown();
  await commands.mouseUp();
  await hover(trigger);
  await shown();
};

// Tab, not a focus() call: a tooltip opens on focus only from the keyboard
const focusOpen = async (): Promise<void> => {
  await userEvent.tab();
  await shown();
};

const zoomIn = (
  props: Omit<TooltipProps, "children" | "content"> = {}
): React.ReactElement => (
  <div className="tooltip-visual-stage">
    <Tooltip content="Zoom in one level" delay={0} {...props}>
      <Button>Zoom in</Button>
    </Tooltip>
  </div>
);

describe("Tooltip", () => {
  it("shown on hover", async () => {
    const screen = await render(zoomIn());
    await hoverOpen(screen.getByRole("button"));
    await snap(viewport());
  });

  it("shown on keyboard focus", async () => {
    await render(zoomIn());
    await focusOpen();
    await snap(viewport());
  });

  it("without an arrow", async () => {
    await render(zoomIn({ isOpen: true, showArrow: false }));
    await shown();
    await snap(viewport());
  });

  it("inverse", async () => {
    await render(zoomIn({ isOpen: true, isInverse: true }));
    await shown();
    await snap(viewport());
  });

  it("long content", async () => {
    await render(
      <div className="tooltip-visual-stage">
        <Tooltip
          isOpen
          content="Population density per square kilometre, from the 2021 census, aggregated to statistical area level 2"
        >
          <Button>Population</Button>
        </Tooltip>
      </div>
    );
    await shown();
    await snap(viewport());
  });

  describe.each([false, true])("inverse %s", (isInverse) => {
    it.each(PLACEMENTS)("placed %s", async (placement) => {
      await render(zoomIn({ isOpen: true, isInverse, placement }));
      await shown();
      await snap(viewport());
    });

    it.each(PLACEMENTS)("placed %s without an arrow", async (placement) => {
      await render(
        zoomIn({ isOpen: true, isInverse, placement, showArrow: false })
      );
      await shown();
      await snap(viewport());
    });
  });
});

describe("Tooltip.Trigger", () => {
  const trigger = (
    <div className="tooltip-visual-stage">
      <Tooltip content="Data from the 2021 census" delay={0}>
        <TooltipTrigger aria-label="About this layer">
          <InfoCircleIcon size={16} />
        </TooltipTrigger>
      </Tooltip>
    </div>
  );

  it("default", async () => {
    await render(trigger);
    await snap(viewport());
  });

  it("focused", async () => {
    await render(trigger);
    await focusOpen();
    await snap(viewport());
  });

  it("hovered", async () => {
    const screen = await render(trigger);
    await hoverOpen(screen.getByRole("button"));
    await snap(viewport());
  });
});
