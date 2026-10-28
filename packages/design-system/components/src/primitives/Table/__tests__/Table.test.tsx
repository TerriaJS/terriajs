import { useState } from "react";
import type { SortDescriptor } from "react-aria-components";
import { TableLayout, Virtualizer } from "react-aria-components/Virtualizer";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Table, type TableProps } from "..";
import { Button } from "../../Button";
import { CheckboxPrimitive } from "../../Checkbox";

const LAYERS = [
  { id: "suburbs", name: "Suburbs", source: "ABS" },
  { id: "schools", name: "Schools", source: "State" },
  { id: "parks", name: "Parks", source: "Council" }
];

// A row's, or the header's, selection checkbox
const selectBox = (label: string): React.ReactElement => (
  <CheckboxPrimitive aria-label={label} slot="selection">
    <CheckboxPrimitive.Content>
      <CheckboxPrimitive.Control>
        <CheckboxPrimitive.Indicator />
      </CheckboxPrimitive.Control>
    </CheckboxPrimitive.Content>
  </CheckboxPrimitive>
);

// Layers with a selection column and two sortable columns, sorted by the
// story's state, as an app would
const LayerTable = ({
  variant,
  rows = LAYERS
}: {
  variant?: TableProps["variant"];
  rows?: typeof LAYERS;
}): React.ReactElement => {
  const [sort, setSort] = useState<SortDescriptor>({
    column: "name",
    direction: "ascending"
  });
  const sorted = [...rows].sort(
    (a, b) =>
      a[sort.column as "name"].localeCompare(b[sort.column as "name"]) *
      (sort.direction === "descending" ? -1 : 1)
  );

  return (
    <Table variant={variant}>
      <Table.ScrollContainer>
        <Table.Content
          aria-label="Layers"
          selectionMode="multiple"
          sortDescriptor={sort}
          onSortChange={setSort}
        >
          <Table.Header>
            <Table.Column>{selectBox("Select all")}</Table.Column>
            <Table.Column id="name" isRowHeader allowsSorting>
              {({ sortDirection }) => (
                <Table.SortableColumnHeader sortDirection={sortDirection}>
                  Name
                </Table.SortableColumnHeader>
              )}
            </Table.Column>
            <Table.Column id="source" allowsSorting>
              {({ sortDirection }) => (
                <Table.SortableColumnHeader sortDirection={sortDirection}>
                  Source
                </Table.SortableColumnHeader>
              )}
            </Table.Column>
          </Table.Header>
          <Table.Body renderEmptyState={() => "No layers"}>
            {sorted.map((layer) => (
              <Table.Row key={layer.id} id={layer.id}>
                <Table.Cell>{selectBox("Select")}</Table.Cell>
                <Table.Cell>{layer.name}</Table.Cell>
                <Table.Cell>{layer.source}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
      <Table.Footer>3 layers</Table.Footer>
    </Table>
  );
};

// A checkbox's input is hidden; it's pressed through its label
const check = async (
  screen: Awaited<ReturnType<typeof render>>,
  name: string
): Promise<void> => {
  const label = screen
    .getByRole("checkbox", { name })
    .element()
    .closest("label");
  if (!label) throw new Error(`No ${name} checkbox`);
  await userEvent.click(label);
};

const names = (screen: Awaited<ReturnType<typeof render>>): string[] =>
  screen
    .getByRole("rowheader")
    .elements()
    .map((cell) => cell.textContent);

describe("Table", () => {
  it("is a grid named by its label, with a header and rows", async () => {
    const screen = await render(<LayerTable />);
    const grid = screen.getByRole("grid", { name: "Layers" });

    await expect.element(grid).toBeVisible();
    expect(grid.getByRole("columnheader").elements()).toHaveLength(3);
    expect(names(screen)).toEqual(["Parks", "Schools", "Suburbs"]);
  });

  it("sorts by a column when its header is pressed, showing which way", async () => {
    const screen = await render(<LayerTable />);
    const name = screen.getByRole("columnheader", { name: "Name" });
    const indicator = (): Element | null =>
      name.element().querySelector("[data-tds='table-sort-indicator']");

    expect(indicator()).toHaveAttribute("data-direction", "ascending");
    await userEvent.click(name);

    expect(names(screen)).toEqual(["Suburbs", "Schools", "Parks"]);
    expect(indicator()).toHaveAttribute("data-direction", "descending");
    expect(
      screen
        .getByRole("columnheader", { name: "Source" })
        .element()
        .querySelector("[data-tds='table-sort-indicator']")
    ).toBeNull();
  });

  it("selects rows with their checkboxes, or all from the header", async () => {
    const screen = await render(<LayerTable />);

    await check(screen, "Select Schools");
    await expect
      .element(screen.getByRole("row", { name: /Schools/ }))
      .toHaveAttribute("aria-selected", "true");

    await check(screen, "Select all");
    for (const row of screen.getByRole("row").elements().slice(1)) {
      expect(row).toHaveAttribute("aria-selected", "true");
    }
  });

  it("says so when it has no rows", async () => {
    const screen = await render(<LayerTable rows={[]} />);

    await expect.element(screen.getByText("No layers")).toBeVisible();
  });

  it("keeps its footer outside the grid", async () => {
    const screen = await render(<LayerTable />);

    await expect.element(screen.getByText("3 layers")).toBeVisible();
    expect(
      screen
        .getByRole("grid")
        .element()
        .contains(screen.getByText("3 layers").element())
    ).toBe(false);
  });

  it("is primary by default, or secondary", async () => {
    const screen = await render(<LayerTable />);
    const root = (): Element | null =>
      screen.getByRole("grid").element().closest("[data-tds='table']");
    expect(root()).toHaveAttribute("data-tds-variant", "primary");

    await screen.rerender(<LayerTable variant="secondary" />);
    expect(root()).toHaveAttribute("data-tds-variant", "secondary");
  });

  it("asks for more rows when it reaches its end", async () => {
    const onLoadMore = vi.fn();
    const screen = await render(
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Layers">
            <Table.Header>
              <Table.Column isRowHeader>Name</Table.Column>
            </Table.Header>
            <Table.Body>
              <Table.Row id="suburbs">
                <Table.Cell>Suburbs</Table.Cell>
              </Table.Row>
              <Table.LoadMore onLoadMore={onLoadMore}>
                <Table.LoadMoreContent>Loading…</Table.LoadMoreContent>
              </Table.LoadMore>
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    );

    await expect.element(screen.getByRole("grid")).toBeVisible();
    await expect.poll(() => onLoadMore.mock.calls.length).toBeGreaterThan(0);
  });

  // Which rows are in view is React Aria's; under Vitest it renders them all,
  // so this checks the parts work virtualized, and the stories show it scroll
  it("works virtualized, telling assistive tech every row", async () => {
    const layers = Array.from({ length: 1000 }, (_, index) => ({
      id: String(index),
      name: `Layer ${String(index + 1)}`
    }));
    const screen = await render(
      <Virtualizer
        layout={TableLayout}
        layoutOptions={{ rowHeight: 56, headingHeight: 40 }}
      >
        <Table>
          <Table.ScrollContainer>
            <Table.Content
              aria-label="Layers"
              style={{ blockSize: 300, overflow: "auto" }}
            >
              <Table.Header>
                <Table.Column isRowHeader>Name</Table.Column>
              </Table.Header>
              <Table.Body items={layers}>
                {(layer) => (
                  <Table.Row>
                    <Table.Cell>{layer.name}</Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </Virtualizer>
    );

    await expect
      .element(screen.getByRole("rowheader", { name: "Layer 1", exact: true }))
      .toBeVisible();
    // Laid out by the virtualizer, in divs rather than a <table>
    expect(screen.getByRole("grid").element().tagName).toBe("DIV");
    await expect
      .element(screen.getByRole("grid"))
      .toHaveAttribute("aria-rowcount", "1001");
  });

  // Virtualized, rows scroll beneath the header, which stays put
  it("paints its header the card's colour, so rows don't show through", async () => {
    const screen = await render(<LayerTable />);
    const header = screen
      .getByRole("grid")
      .element()
      .querySelector("[data-tds='table-header']");
    const card = screen
      .getByRole("grid")
      .element()
      .closest("[data-tds='table']");
    if (!header || !card) throw new Error("No header or card");

    expect(getComputedStyle(header).backgroundColor).toBe(
      getComputedStyle(card).backgroundColor
    );
  });

  describe("grouped rows", () => {
    type Group = { id: string; name: string; children: Group[] };
    const GROUPS: Group[] = [
      {
        id: "hazards",
        name: "Hazards",
        children: [
          { id: "bushfire", name: "Bushfire-prone land", children: [] },
          { id: "flood", name: "Flood planning area", children: [] }
        ]
      },
      { id: "schools", name: "Schools", children: [] }
    ];

    const row = (group: Group): React.ReactElement => (
      <Table.Row id={group.id} textValue={group.name}>
        <Table.Cell textValue={group.name}>
          {({ hasChildItems, isTreeColumn }) => (
            <>
              {hasChildItems && isTreeColumn && (
                <Button slot="chevron" variant="ghost" size="sm">
                  Toggle
                </Button>
              )}
              {group.name}
            </>
          )}
        </Table.Cell>
        <Table.Collection items={group.children}>{row}</Table.Collection>
      </Table.Row>
    );

    const grouped = (): React.ReactElement => (
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Layers" treeColumn="name">
            <Table.Header>
              <Table.Column id="name" isRowHeader>
                Name
              </Table.Column>
            </Table.Header>
            <Table.Body items={GROUPS}>{row}</Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    );

    it("shows a group's rows when it's expanded", async () => {
      const screen = await render(grouped());
      const hazards = screen.getByRole("row", { name: /Hazards/ });

      await expect.element(hazards).toHaveAttribute("aria-expanded", "false");
      expect(screen.getByText("Flood planning area").elements()).toHaveLength(
        0
      );

      await userEvent.click(hazards.getByRole("button", { name: /Expand/ }));

      await expect.element(hazards).toHaveAttribute("aria-expanded", "true");
      await expect
        .element(screen.getByRole("row", { name: /Flood planning area/ }))
        .toHaveAttribute("aria-level", "2");
    });

    it("indents a group's rows by their level", async () => {
      const screen = await render(grouped());
      await userEvent.click(
        screen
          .getByRole("row", { name: /Hazards/ })
          .getByRole("button", { name: /Expand/ })
      );
      const inset = (name: RegExp): number =>
        parseFloat(
          getComputedStyle(
            screen.getByRole("row", { name }).getByRole("rowheader").element()
          ).paddingInlineStart
        );

      await expect
        .poll(() => inset(/Flood planning area/) - inset(/Hazards/))
        .toBeGreaterThan(0);
    });
  });
});
