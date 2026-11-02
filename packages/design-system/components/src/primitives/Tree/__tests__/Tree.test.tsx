import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { Key, Selection } from "react-aria-components";
import { ListLayout, Virtualizer } from "react-aria-components/Virtualizer";
import { userEvent } from "vitest/browser";
import { Button } from "../../Button";
import { CheckboxPrimitive } from "../../Checkbox";
import { Tree } from "..";

const selectBox = (label: string): React.ReactElement => (
  <CheckboxPrimitive aria-label={label} slot="selection">
    <CheckboxPrimitive.Content>
      <CheckboxPrimitive.Control>
        <CheckboxPrimitive.Indicator />
      </CheckboxPrimitive.Control>
    </CheckboxPrimitive.Content>
  </CheckboxPrimitive>
);

// A checkbox's input is hidden; it's pressed through its label
const check = async (
  screen: Awaited<ReturnType<typeof render>>,
  name: RegExp
): Promise<void> => {
  const label = screen
    .getByRole("checkbox", { name })
    .element()
    .closest("label");
  if (!label) throw new Error(`No ${String(name)} checkbox`);
  await userEvent.click(label);
};

describe("Tree", () => {
  it("shows a group's children once its indicator expands it", async () => {
    const screen = await render(
      <Tree aria-label="Catalog">
        <Tree.Item id="boundaries" textValue="Boundaries">
          <Tree.ItemContent>
            <Tree.Indicator />
            <Tree.ItemLabel>Boundaries</Tree.ItemLabel>
          </Tree.ItemContent>
          <Tree.Item id="suburbs" textValue="Suburbs">
            <Tree.ItemContent>
              <Tree.Indicator />
              <Tree.ItemLabel>Suburbs</Tree.ItemLabel>
            </Tree.ItemContent>
          </Tree.Item>
        </Tree.Item>
      </Tree>
    );

    await expect
      .element(screen.getByRole("row", { name: "Suburbs" }))
      .not.toBeInTheDocument();

    await screen.getByRole("button", { name: "Expand Boundaries" }).click();

    await expect
      .element(screen.getByRole("row", { name: "Boundaries" }))
      .toHaveAttribute("aria-expanded", "true");
    await expect
      .element(screen.getByRole("row", { name: "Suburbs" }))
      .toBeVisible();
  });

  it("removes a group's children once it collapses", async () => {
    const onExpandedChange = vi.fn<(keys: Set<Key>) => void>();
    const screen = await render(
      <Tree
        aria-label="Catalog"
        defaultExpandedKeys={["boundaries"]}
        onExpandedChange={onExpandedChange}
      >
        <Tree.Item id="boundaries" textValue="Boundaries">
          <Tree.ItemContent>
            <Tree.Indicator />
            <Tree.ItemLabel>Boundaries</Tree.ItemLabel>
          </Tree.ItemContent>
          <Tree.Item id="suburbs" textValue="Suburbs">
            <Tree.ItemContent>
              <Tree.ItemLabel>Suburbs</Tree.ItemLabel>
            </Tree.ItemContent>
          </Tree.Item>
        </Tree.Item>
      </Tree>
    );

    await screen.getByRole("button", { name: "Collapse Boundaries" }).click();

    await expect
      .element(screen.getByRole("row", { name: "Suburbs" }))
      .not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("row", { name: "Boundaries" }))
      .toHaveAttribute("aria-expanded", "false");
    expect(onExpandedChange.mock.lastCall?.[0]).toEqual(new Set());
  });

  it("turns its indicator as soon as a group starts collapsing", async () => {
    const screen = await render(
      <Tree aria-label="Catalog" defaultExpandedKeys={["boundaries"]}>
        <Tree.Item id="boundaries" textValue="Boundaries">
          <Tree.ItemContent>
            <Tree.Indicator />
            <Tree.ItemLabel>Boundaries</Tree.ItemLabel>
          </Tree.ItemContent>
          <Tree.Item id="suburbs" textValue="Suburbs">
            <Tree.ItemContent>
              <Tree.ItemLabel>Suburbs</Tree.ItemLabel>
            </Tree.ItemContent>
          </Tree.Item>
        </Tree.Item>
      </Tree>
    );
    const indicator = screen.getByRole("button", {
      name: "Collapse Boundaries"
    });

    await indicator.click();

    // The rows are still animating shut
    expect(
      screen.getByRole("row", { name: "Suburbs" }).element()
    ).toBeInTheDocument();
    expect(indicator.element()).not.toHaveAttribute("data-expanded");
  });

  // A collapsing group already reads as collapsed, so it opens again from
  // there, before its rows have animated away
  describe("while a group collapses", () => {
    const catalog = (): React.ReactElement => (
      <Tree aria-label="Catalog" defaultExpandedKeys={["boundaries"]}>
        <Tree.Item id="boundaries" textValue="Boundaries">
          <Tree.ItemContent>
            <Tree.Indicator />
            <Tree.ItemLabel>Boundaries</Tree.ItemLabel>
          </Tree.ItemContent>
          <Tree.Item id="suburbs" textValue="Suburbs">
            <Tree.ItemContent>
              <Tree.ItemLabel>Suburbs</Tree.ItemLabel>
            </Tree.ItemContent>
          </Tree.Item>
        </Tree.Item>
      </Tree>
    );

    it("opens it again from its indicator", async () => {
      const screen = await render(catalog());
      const indicator = screen
        .getByRole("button", { name: "Collapse Boundaries" })
        .element();

      await userEvent.click(indicator);
      await userEvent.click(indicator);

      await expect
        .element(screen.getByRole("row", { name: "Boundaries" }))
        .toHaveAttribute("aria-expanded", "true");
      await new Promise((resolve) => setTimeout(resolve, 400));
      await expect
        .element(screen.getByRole("row", { name: "Suburbs" }))
        .toBeVisible();
    });

    it("opens it again with the right arrow", async () => {
      const screen = await render(catalog());
      const group = screen.getByRole("row", { name: "Boundaries" });

      await userEvent.click(group);
      await userEvent.keyboard("{ArrowLeft}");
      await userEvent.keyboard("{ArrowRight}");

      await expect.element(group).toHaveAttribute("aria-expanded", "true");
      await new Promise((resolve) => setTimeout(resolve, 400));
      await expect
        .element(screen.getByRole("row", { name: "Suburbs" }))
        .toBeVisible();
    });
  });

  it("keeps a leaf's indicator space without an expand button", async () => {
    const screen = await render(
      <Tree aria-label="Catalog">
        <Tree.Item id="suburbs" textValue="Suburbs">
          <Tree.ItemContent>
            <Tree.Indicator />
            <Tree.ItemLabel>Suburbs</Tree.ItemLabel>
          </Tree.ItemContent>
        </Tree.Item>
      </Tree>
    );

    const row = screen.getByRole("row", { name: "Suburbs" });
    await expect.element(row).toBeVisible();
    expect(row.element().querySelector("button")).toBeNull();
    expect(
      row.element().querySelector('[data-tds="tree-indicator"]')
    ).not.toBeNull();
  });

  it("selects the pressed row, as a catalog opens an item's preview", async () => {
    const onSelectionChange = vi.fn<(keys: Selection) => void>();
    const screen = await render(
      <Tree
        aria-label="Catalog"
        selectionMode="single"
        onSelectionChange={onSelectionChange}
      >
        <Tree.Item id="suburbs" textValue="Suburbs">
          <Tree.ItemContent>
            <Tree.ItemLabel>Suburbs</Tree.ItemLabel>
          </Tree.ItemContent>
        </Tree.Item>
        <Tree.Item id="roads" textValue="Roads">
          <Tree.ItemContent>
            <Tree.ItemLabel>Roads</Tree.ItemLabel>
          </Tree.ItemContent>
        </Tree.Item>
      </Tree>
    );

    await screen.getByRole("row", { name: "Roads" }).click();

    await expect
      .element(screen.getByRole("row", { name: "Roads" }))
      .toHaveAttribute("aria-selected", "true");
    const selection = onSelectionChange.mock.lastCall?.[0];
    expect(selection instanceof Set && [...selection]).toEqual(["roads"]);
  });

  it("selects several rows with their checkboxes", async () => {
    const screen = await render(
      <Tree aria-label="Catalog" selectionMode="multiple">
        <Tree.Item id="suburbs" textValue="Suburbs">
          <Tree.ItemContent>
            {selectBox("Select Suburbs")}
            <Tree.ItemLabel>Suburbs</Tree.ItemLabel>
          </Tree.ItemContent>
        </Tree.Item>
        <Tree.Item id="roads" textValue="Roads">
          <Tree.ItemContent>
            {selectBox("Select Roads")}
            <Tree.ItemLabel>Roads</Tree.ItemLabel>
          </Tree.ItemContent>
        </Tree.Item>
      </Tree>
    );

    await check(screen, /^Select Suburbs/);
    await check(screen, /^Select Roads/);

    await expect
      .element(screen.getByRole("row", { name: "Suburbs" }))
      .toHaveAttribute("aria-selected", "true");
    await expect
      .element(screen.getByRole("row", { name: "Roads" }))
      .toHaveAttribute("aria-selected", "true");
  });

  it("reaches a row's buttons with Tab", async () => {
    const screen = await render(
      <Tree aria-label="Catalog">
        <Tree.Item id="suburbs" textValue="Suburbs">
          <Tree.ItemContent>
            <Tree.ItemLabel>Suburbs</Tree.ItemLabel>
            <Button aria-label="Add Suburbs to the map">+</Button>
          </Tree.ItemContent>
        </Tree.Item>
      </Tree>
    );

    await userEvent.tab();
    await expect
      .element(screen.getByRole("row", { name: "Suburbs" }))
      .toHaveFocus();
    await userEvent.tab();

    await expect
      .element(screen.getByRole("button", { name: "Add Suburbs to the map" }))
      .toHaveFocus();
  });

  it("doesn't select a disabled row", async () => {
    const screen = await render(
      <Tree aria-label="Catalog" selectionMode="single">
        <Tree.Item id="suburbs" textValue="Suburbs" isDisabled>
          <Tree.ItemContent>
            <Tree.ItemLabel>Suburbs</Tree.ItemLabel>
          </Tree.ItemContent>
        </Tree.Item>
      </Tree>
    );

    const row = screen.getByRole("row", { name: "Suburbs" });
    await row.click({ force: true });

    await expect.element(row).toHaveAttribute("aria-disabled", "true");
    await expect.element(row).not.toHaveAttribute("aria-selected", "true");
  });

  it("shows its empty state when it has no items", async () => {
    const screen = await render(
      <Tree aria-label="Catalog" renderEmptyState={() => "No datasets"}>
        {[]}
      </Tree>
    );

    await expect.element(screen.getByText("No datasets")).toBeVisible();
  });

  it("shows a loading row while a group's children load", async () => {
    const screen = await render(
      <Tree aria-label="Catalog" defaultExpandedKeys={["boundaries"]}>
        <Tree.Item id="boundaries" textValue="Boundaries" hasChildItems>
          <Tree.ItemContent>
            <Tree.Indicator />
            <Tree.ItemLabel>Boundaries</Tree.ItemLabel>
          </Tree.ItemContent>
          <Tree.LoadMoreItem isLoading />
        </Tree.Item>
      </Tree>
    );

    await expect
      .element(screen.getByRole("progressbar", { name: "Loading…" }))
      .toBeVisible();
  });

  it("scrolls through all its rows when virtualized", async () => {
    const datasets = Array.from({ length: 50 }, (_, index) => ({
      id: `dataset-${String(index)}`,
      name: `Dataset ${String(index + 1)}`
    }));
    const screen = await render(
      <Virtualizer layout={ListLayout} layoutOptions={{ rowHeight: 36 }}>
        <Tree
          aria-label="Catalog"
          items={datasets}
          style={{ blockSize: 200, overflow: "auto" }}
        >
          {(dataset) => (
            <Tree.Item id={dataset.id} textValue={dataset.name}>
              <Tree.ItemContent>
                <Tree.ItemLabel>{dataset.name}</Tree.ItemLabel>
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree>
      </Virtualizer>
    );

    const tree = screen.getByRole("treegrid").element();
    expect(tree.scrollHeight).toBeGreaterThanOrEqual(50 * 36);
  });

  it("removes a collapsing group's rows as their animation ends, before the browser can draw them again", async () => {
    const screen = await render(
      <Tree aria-label="Catalog" defaultExpandedKeys={["boundaries"]}>
        <Tree.Item id="boundaries" textValue="Boundaries">
          <Tree.ItemContent>
            <Tree.Indicator />
            <Tree.ItemLabel>Boundaries</Tree.ItemLabel>
          </Tree.ItemContent>
          <Tree.Item id="suburbs" textValue="Suburbs">
            <Tree.ItemContent>
              <Tree.ItemLabel>Suburbs</Tree.ItemLabel>
            </Tree.ItemContent>
          </Tree.Item>
        </Tree.Item>
      </Tree>
    );
    const row = screen.getByRole("row", { name: "Suburbs" }).element();

    await screen.getByRole("button", { name: "Collapse Boundaries" }).click();
    const [animation] = row.getAnimations();
    await animation?.finished;
    // A frame is a task, so these run before the browser's next one: a
    // busy page could draw that frame before React gets to render, showing
    // the row at full size again if it were still there
    for (let tick = 0; tick < 10; tick++) await Promise.resolve();

    expect(animation).toBeDefined();
    expect(row.isConnected).toBe(false);
  });
});
