import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  Category2Icon,
  ShareIcon,
  StackFrontIcon
} from "@terria/design-system-icons";
import { hover, snap } from "../../../visual";
import { Tabs, type TabsProps } from "..";

const TABS = [
  { id: "layers", label: "Layers", icon: <StackFrontIcon size={16} /> },
  { id: "legend", label: "Legend", icon: <Category2Icon size={16} /> },
  { id: "share", label: "Share", icon: <ShareIcon size={16} /> }
] as const;

type Options = TabsProps & { icons?: boolean; separators?: boolean };

const mapTools = ({
  icons,
  separators,
  ...props
}: Options): React.ReactElement => (
  <Tabs disabledKeys={["share"]} {...props}>
    <Tabs.List aria-label="Map tools">
      {TABS.map((tab, index) => (
        <Tabs.Tab key={tab.id} id={tab.id}>
          {separators && index > 0 && <Tabs.Separator />}
          {icons && tab.icon}
          {tab.label}
          <Tabs.Indicator />
        </Tabs.Tab>
      ))}
    </Tabs.List>
    {TABS.map((tab) => (
      <Tabs.Panel key={tab.id} id={tab.id}>
        {tab.label} panel
      </Tabs.Panel>
    ))}
  </Tabs>
);

// The indicator slides to the tab it moves to, and the ring with it; the
// slide is cut short, but still runs, so its end is waited for
const settled = async (): Promise<void> => {
  // Transitions only: other animations may loop, and a cancelled one rejects
  await Promise.all(
    document
      .getAnimations()
      .filter((animation) => animation instanceof CSSTransition)
      .map((animation) => animation.finished.catch(() => undefined))
  );
  for (let frame = 0; frame < 2; frame++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

describe.each([
  ["primary", "horizontal"],
  ["primary", "vertical"],
  ["secondary", "horizontal"],
  ["secondary", "vertical"]
] as const)("Tabs %s %s", (variant, orientation) => {
  const tabs = (options: Options = {}): React.ReactElement =>
    mapTools({ variant, orientation, ...options });

  it("default", async () => {
    await render(tabs());
    await snap();
  });

  it("tab hovered", async () => {
    const screen = await render(tabs());
    await hover(screen.getByRole("tab", { name: "Legend" }));
    await snap();
  });

  it("selected tab hovered", async () => {
    const screen = await render(tabs());
    await hover(screen.getByRole("tab", { name: "Layers" }));
    await snap();
  });

  it("disabled tab hovered", async () => {
    const screen = await render(tabs());
    await hover(screen.getByRole("tab", { name: "Share" }));
    await snap();
  });

  it("selected tab focused", async () => {
    const screen = await render(tabs());
    const tab = screen.getByRole("tab", { name: "Layers" });
    await userEvent.keyboard("{Tab}");
    await expect.element(tab).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("selected by arrow key", async () => {
    const screen = await render(tabs());
    const tab = screen.getByRole("tab", { name: "Legend" });
    await userEvent.keyboard(
      orientation === "vertical" ? "{Tab}{ArrowDown}" : "{Tab}{ArrowRight}"
    );
    await expect.element(tab).toHaveAttribute("data-selected");
    await expect.element(tab).toHaveAttribute("data-focus-visible");
    await settled();
    await snap();
  });

  it("tab focused, selection manual", async () => {
    const screen = await render(tabs({ keyboardActivation: "manual" }));
    const tab = screen.getByRole("tab", { name: "Legend" });
    await userEvent.keyboard(
      orientation === "vertical" ? "{Tab}{ArrowDown}" : "{Tab}{ArrowRight}"
    );
    await expect.element(tab).toHaveAttribute("data-focus-visible");
    await settled();
    await snap();
  });

  it("tab hovered and focused", async () => {
    const screen = await render(tabs({ keyboardActivation: "manual" }));
    const tab = screen.getByRole("tab", { name: "Legend" });
    await hover(tab);
    await userEvent.keyboard(
      orientation === "vertical" ? "{Tab}{ArrowDown}" : "{Tab}{ArrowRight}"
    );
    await expect.element(tab).toHaveAttribute("data-focus-visible");
    await settled();
    await snap();
  });

  it("selected by pressing", async () => {
    const screen = await render(tabs());
    const tab = screen.getByRole("tab", { name: "Legend" });
    await userEvent.click(tab);
    await expect.element(tab).toHaveAttribute("data-selected");
    await settled();
    await snap();
  });

  it("with icons", async () => {
    await render(tabs({ icons: true }));
    await snap();
  });

  it("with separators", async () => {
    await render(tabs({ separators: true, disabledKeys: [] }));
    await snap();
  });
});
