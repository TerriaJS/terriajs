import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Tabs, type TabsProps } from "..";

const renderTabs = (
  props: Partial<TabsProps> = {}
): ReturnType<typeof render> =>
  render(
    <div style={{ inlineSize: 600 }}>
      <Tabs {...props}>
        <Tabs.List aria-label="Map tools">
          <Tabs.Tab id="layers">
            Layers
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="legend">
            Legend
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="share" isDisabled>
            Share
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel id="layers">Layer list</Tabs.Panel>
        <Tabs.Panel id="legend">Legend items</Tabs.Panel>
        <Tabs.Panel id="share">Share link</Tabs.Panel>
      </Tabs>
    </div>
  );

describe("Tabs", () => {
  it("shows the panel of the tab that is pressed", async () => {
    const screen = await renderTabs();

    await expect
      .element(screen.getByRole("tabpanel"))
      .toHaveTextContent("Layer list");
    await screen.getByRole("tab", { name: "Legend" }).click();

    await expect
      .element(screen.getByRole("tab", { name: "Legend" }))
      .toHaveAttribute("aria-selected", "true");
    await expect
      .element(screen.getByRole("tabpanel"))
      .toHaveTextContent("Legend items");
  });

  it("moves between tabs with the arrow keys", async () => {
    const screen = await renderTabs();

    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");

    await expect
      .element(screen.getByRole("tabpanel"))
      .toHaveTextContent("Legend items");
  });

  it("skips a disabled tab", async () => {
    const screen = await renderTabs({ defaultSelectedKey: "legend" });

    await expect
      .element(screen.getByRole("tab", { name: "Share" }))
      .toHaveAttribute("aria-disabled", "true");
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");

    // Wraps past the disabled tab back to the first
    await expect
      .element(screen.getByRole("tabpanel"))
      .toHaveTextContent("Layer list");
  });

  it("lays tabs out in a column when vertical", async () => {
    const screen = await renderTabs({ orientation: "vertical" });

    await expect
      .element(screen.getByRole("tablist"))
      .toHaveAttribute("aria-orientation", "vertical");
    await userEvent.tab();
    await userEvent.keyboard("{ArrowDown}");
    await expect
      .element(screen.getByRole("tabpanel"))
      .toHaveTextContent("Legend items");
  });

  it("draws the indicator in the selected tab only", async () => {
    const screen = await renderTabs({ defaultSelectedKey: "legend" });
    const indicatorIn = (name: string): Element | null =>
      screen
        .getByRole("tab", { name })
        .element()
        .querySelector("[data-tds='tabs-indicator']");

    expect(indicatorIn("Legend")).not.toBeNull();
    expect(indicatorIn("Layers")).toBeNull();
  });

  it("keeps every tab's width when the selection changes", async () => {
    const screen = await renderTabs();
    const widths = (): number[] =>
      screen
        .getByRole("tab")
        .elements()
        .map((tab) => tab.getBoundingClientRect().width);
    const before = widths();

    await screen.getByRole("tab", { name: "Legend" }).click();

    await expect
      .element(screen.getByRole("tab", { name: "Legend" }))
      .toHaveAttribute("aria-selected", "true");
    expect(widths()).toEqual(before);
  });

  it("hugs its tabs by default and shares the width equally when full width", async () => {
    const hug = await renderTabs();
    const hugWidth = hug
      .getByRole("tablist")
      .element()
      .getBoundingClientRect().width;
    expect(hugWidth).toBeLessThan(600);
    await hug.unmount();

    const full = await renderTabs({ fullWidth: true });
    const widths = full
      .getByRole("tab")
      .elements()
      .map((tab) => Math.round(tab.getBoundingClientRect().width));
    expect(new Set(widths).size).toBe(1);
    expect(widths.reduce((sum, width) => sum + width, 0)).toBeGreaterThan(
      hugWidth
    );
  });
});

describe("Tabs focus ring", () => {
  const ringOn = (element: Element | null | undefined): string =>
    element
      ? getComputedStyle(element).outlineStyle +
        "/" +
        getComputedStyle(element).boxShadow
      : "";

  it("rides on the indicator when selection follows focus", async () => {
    const screen = await renderTabs();

    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    const tab = screen.getByRole("tab", { name: "Legend" }).element();

    expect(getComputedStyle(tab).outlineStyle).toBe("none");
    expect(ringOn(tab.querySelector("[data-tds='tabs-indicator']"))).toContain(
      "inset"
    );
  });

  it("stays on the focused tab, through selection, with manual activation", async () => {
    const screen = await renderTabs({ keyboardActivation: "manual" });

    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    const tab = screen.getByRole("tab", { name: "Legend" }).element();
    expect(getComputedStyle(tab).outlineStyle).toBe("solid");

    await userEvent.keyboard("{Enter}");
    await expect
      .element(screen.getByRole("tabpanel"))
      .toHaveTextContent("Legend items");
    expect(getComputedStyle(tab).outlineStyle).toBe("solid");
    expect(
      ringOn(tab.querySelector("[data-tds='tabs-indicator']"))
    ).not.toContain("inset");
  });
});

const MANY = ["Layers", "Legend", "Share", "Print", "Settings", "Help"];

const renderMany = (dir?: "rtl"): ReturnType<typeof render> =>
  render(
    <div dir={dir} style={{ inlineSize: 200 }}>
      <Tabs>
        <Tabs.List aria-label="Map tools">
          {MANY.map((name) => (
            <Tabs.Tab key={name} id={name}>
              {name}
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>
    </div>
  );

// The tablist scrolls in the ScrollShadow around it
const scrollerOf = (tablist: Element): HTMLElement => {
  const scroller = tablist.closest<HTMLElement>('[data-tds="scroll-shadow"]');
  if (!scroller) throw new Error("No ScrollShadow around the tablist");
  return scroller;
};

describe("Tabs scroll arrows", () => {
  it("don't show while the tabs fit", async () => {
    const screen = await renderTabs();

    // Hidden, so out of the accessibility tree: includeHidden finds them
    await expect
      .element(
        screen.getByRole("button", {
          name: "Scroll to next tabs",
          includeHidden: true
        })
      )
      .not.toBeVisible();
    await expect
      .element(
        screen.getByRole("button", {
          name: "Scroll to previous tabs",
          includeHidden: true
        })
      )
      .not.toBeVisible();
  });

  it("show towards the hidden tabs, and scroll to them when pressed", async () => {
    const screen = await renderMany();
    const list = scrollerOf(screen.getByRole("tablist").element());
    const next = screen.getByRole("button", { name: "Scroll to next tabs" });
    const previous = screen.getByRole("button", {
      name: "Scroll to previous tabs",
      includeHidden: true
    });

    await expect.element(next).toBeVisible();
    await expect.element(previous).not.toBeVisible();

    await next.click();

    await expect.poll(() => list.scrollLeft).toBeGreaterThan(0);
    await expect.element(previous).toBeVisible();
  });

  it("scroll towards the end in right-to-left", async () => {
    const screen = await renderMany("rtl");
    const list = scrollerOf(screen.getByRole("tablist").element());

    await screen.getByRole("button", { name: "Scroll to next tabs" }).click();

    // Right-to-left scroll positions run from 0 at the start to negative
    await expect.poll(() => list.scrollLeft).toBeLessThan(0);
  });

  it("aren't tab stops: the arrow keys move between tabs", async () => {
    const screen = await renderMany();

    await expect
      .element(screen.getByRole("button", { name: "Scroll to next tabs" }))
      .toHaveAttribute("tabindex", "-1");
  });
});

describe("Tabs that don't fit", () => {
  it("scroll within their list, bringing the selected tab into view", async () => {
    const names = ["Layers", "Legend", "Share", "Print", "Settings", "Help"];
    const screen = await render(
      <div style={{ inlineSize: 200 }}>
        <Tabs>
          <Tabs.List aria-label="Map tools">
            {names.map((name) => (
              <Tabs.Tab key={name} id={name}>
                {name}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>
      </div>
    );
    const list = scrollerOf(screen.getByRole("tablist").element());

    expect(list.getBoundingClientRect().width).toBeLessThanOrEqual(200);
    expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);

    await userEvent.tab();
    await userEvent.keyboard("{End}");

    await expect
      .element(screen.getByRole("tab", { name: "Help" }))
      .toHaveFocus();
    await expect.poll(() => list.scrollLeft).toBeGreaterThan(0);
  });
});
