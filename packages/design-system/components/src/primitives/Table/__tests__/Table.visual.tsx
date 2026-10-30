import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { hover, snap } from "../../../visual";
import { CheckboxPrimitive } from "../../Checkbox";
import { Chip } from "../../Chip";
import { Spinner } from "../../Spinner";
import { Table, type TableContentProps, type TableVariant } from "..";
import "../table.stories.css";

const DATASETS = [
  { id: "suburbs", name: "Suburbs 2021", publisher: "ABS", status: "Live" },
  {
    id: "bushfire",
    name: "Bushfire-prone land",
    publisher: "NSW RFS",
    status: "Live"
  },
  {
    id: "flood",
    name: "Flood planning area",
    publisher: "City of Sydney",
    status: "Draft"
  }
] as const;

const STATUS_COLOR = { Live: "success", Draft: "warning" } as const;

const selectBox = (label: string): React.ReactElement => (
  <CheckboxPrimitive aria-label={label} slot="selection">
    <CheckboxPrimitive.Content>
      <CheckboxPrimitive.Control>
        <CheckboxPrimitive.Indicator />
      </CheckboxPrimitive.Control>
    </CheckboxPrimitive.Content>
  </CheckboxPrimitive>
);

type Options = Partial<TableContentProps> & {
  variant?: TableVariant;
  footer?: boolean;
};

// Sortable by name and publisher, sorted by name; Flood planning area is
// disabled
const datasets = ({
  variant,
  footer,
  ...props
}: Options = {}): React.ReactElement => (
  <Table variant={variant}>
    <Table.ScrollContainer>
      <Table.Content
        aria-label="Datasets"
        selectionMode="multiple"
        disabledKeys={["flood"]}
        sortDescriptor={{ column: "name", direction: "ascending" }}
        {...props}
      >
        <Table.Header>
          <Table.Column className="table-stories-check">
            {selectBox("Select all")}
          </Table.Column>
          <Table.Column id="name" isRowHeader allowsSorting>
            {({ sortDirection }) => (
              <Table.SortableColumnHeader sortDirection={sortDirection}>
                Name
              </Table.SortableColumnHeader>
            )}
          </Table.Column>
          <Table.Column id="publisher" allowsSorting>
            {({ sortDirection }) => (
              <Table.SortableColumnHeader sortDirection={sortDirection}>
                Publisher
              </Table.SortableColumnHeader>
            )}
          </Table.Column>
          <Table.Column id="status">Status</Table.Column>
        </Table.Header>
        <Table.Body>
          {DATASETS.map((dataset) => (
            <Table.Row key={dataset.id} id={dataset.id}>
              <Table.Cell className="table-stories-check">
                {selectBox("Select")}
              </Table.Cell>
              <Table.Cell>{dataset.name}</Table.Cell>
              <Table.Cell>{dataset.publisher}</Table.Cell>
              <Table.Cell>
                <Chip
                  color={STATUS_COLOR[dataset.status]}
                  size="sm"
                  variant="soft"
                >
                  {dataset.status}
                </Chip>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Content>
    </Table.ScrollContainer>
    {footer && <Table.Footer>3 datasets</Table.Footer>}
  </Table>
);

describe.each(["primary", "secondary"] as const)("Table %s", (variant) => {
  const table = (options: Options = {}): React.ReactElement =>
    datasets({ variant, ...options });

  it("default", async () => {
    await render(table({ footer: true }));
    await snap();
  });

  it("sortable column hovered", async () => {
    const screen = await render(table());
    await hover(screen.getByRole("columnheader", { name: "Publisher" }));
    await snap();
  });

  it("sortable column focused", async () => {
    const screen = await render(table());
    const column = screen.getByRole("columnheader", { name: "Publisher" });
    // Into the first row, up to the header, across to Publisher
    await userEvent.keyboard("{Tab}{ArrowUp}{ArrowRight}{ArrowRight}");
    await expect.element(column).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("sorted descending", async () => {
    await render(
      table({ sortDescriptor: { column: "name", direction: "descending" } })
    );
    await snap();
  });

  it("row hovered", async () => {
    const screen = await render(table());
    await hover(screen.getByRole("row", { name: /Bushfire-prone land/ }));
    await snap();
  });

  it("row focused", async () => {
    const screen = await render(table());
    const row = screen.getByRole("row", { name: /Suburbs 2021/ });
    await userEvent.keyboard("{Tab}");
    await expect.element(row).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("cell focused", async () => {
    const screen = await render(table());
    const cell = screen.getByRole("rowheader", { name: "Suburbs 2021" });
    await userEvent.keyboard("{Tab}{ArrowRight}{ArrowRight}");
    await expect.element(cell).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("row selected", async () => {
    await render(table({ defaultSelectedKeys: ["bushfire"] }));
    await snap();
  });

  it("selected row hovered", async () => {
    const screen = await render(table({ defaultSelectedKeys: ["bushfire"] }));
    await hover(screen.getByRole("row", { name: /Bushfire-prone land/ }));
    await snap();
  });

  it("row selected by pressing", async () => {
    const screen = await render(table());
    const row = screen.getByRole("row", { name: /Suburbs 2021/ });
    await userEvent.click(row.getByRole("rowheader"));
    await expect.element(row).toHaveAttribute("aria-selected", "true");
    await snap();
  });

  it("all selected", async () => {
    await render(table({ defaultSelectedKeys: "all" }));
    await snap();
  });

  it("disabled row hovered", async () => {
    const screen = await render(table());
    await hover(screen.getByRole("row", { name: /Flood planning area/ }));
    await snap();
  });

  it("empty", async () => {
    await render(
      <Table variant={variant}>
        <Table.ScrollContainer>
          <Table.Content aria-label="Datasets">
            <Table.Header>
              <Table.Column isRowHeader>Name</Table.Column>
              <Table.Column>Publisher</Table.Column>
            </Table.Header>
            <Table.Body renderEmptyState={() => "No datasets found"}>
              {[]}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    );
    await snap();
  });

  it("loading more", async () => {
    await render(
      <Table variant={variant}>
        <Table.ScrollContainer>
          <Table.Content aria-label="Datasets">
            <Table.Header>
              <Table.Column isRowHeader>Name</Table.Column>
              <Table.Column>Publisher</Table.Column>
            </Table.Header>
            <Table.Body>
              {DATASETS.slice(0, 2).map((dataset) => (
                <Table.Row key={dataset.id} id={dataset.id}>
                  <Table.Cell>{dataset.name}</Table.Cell>
                  <Table.Cell>{dataset.publisher}</Table.Cell>
                </Table.Row>
              ))}
              <Table.LoadMore isLoading>
                <Table.LoadMoreContent>
                  <Spinner aria-label="Loading more datasets" />
                </Table.LoadMoreContent>
              </Table.LoadMore>
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    );
    await snap();
  });
});

const resizable = (): React.ReactElement => (
  <Table>
    <Table.ResizableContainer>
      <Table.Content aria-label="Datasets">
        <Table.Header>
          <Table.Column id="name" isRowHeader defaultWidth={200}>
            Name
            <Table.ColumnResizer />
          </Table.Column>
          <Table.Column id="publisher" defaultWidth={160}>
            Publisher
          </Table.Column>
        </Table.Header>
        <Table.Body>
          {DATASETS.map((dataset) => (
            <Table.Row key={dataset.id} id={dataset.id}>
              <Table.Cell>{dataset.name}</Table.Cell>
              <Table.Cell>{dataset.publisher}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Content>
    </Table.ResizableContainer>
  </Table>
);

describe("Table", () => {
  it("resizable columns", async () => {
    await render(resizable());
    await snap();
  });
});
