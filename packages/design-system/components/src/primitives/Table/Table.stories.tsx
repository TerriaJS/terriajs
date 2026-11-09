import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ChevronRightIcon,
  CopyIcon,
  EditIcon,
  EyeIcon,
  MapIcon,
  SearchIcon,
  TrashIcon
} from "@terria/design-system-icons";
import { useMemo, useState } from "react";
import type { Selection, SortDescriptor } from "react-aria-components";
import { TableLayout, Virtualizer } from "react-aria-components/Virtualizer";
import { useAsyncList } from "react-stately";
import { Table, TableRoot, type TableVariant } from ".";
import { Button } from "../Button";
import { CheckboxPrimitive } from "../Checkbox";
import { Chip } from "../Chip";
import { Pagination } from "../Pagination";
import { Spinner } from "../Spinner";
import { figmaDesign } from "../../figma";
import "./table.stories.css";

type Dataset = {
  id: string;
  name: string;
  publisher: string;
  category: string;
  status: "Live" | "Draft" | "Retired";
};

const ROWS: [string, string, string, Dataset["status"]][] = [
  ["Suburbs 2021", "ABS", "Boundaries", "Live"],
  ["Population density", "ABS", "Census", "Live"],
  ["Bushfire-prone land", "NSW RFS", "Hazards", "Live"],
  ["Flood planning area", "City of Sydney", "Hazards", "Draft"],
  ["Heritage items", "Heritage NSW", "Planning", "Live"],
  ["Public transport stops", "Transport for NSW", "Transport", "Live"],
  ["Bike paths", "City of Sydney", "Transport", "Draft"],
  ["Schools", "NSW Education", "Facilities", "Live"],
  ["Hospitals", "NSW Health", "Facilities", "Retired"],
  ["Parks and reserves", "City of Sydney", "Environment", "Live"],
  ["Land zoning", "NSW Planning", "Planning", "Live"],
  ["Tree canopy", "City of Sydney", "Environment", "Draft"]
];

const DATASETS: Dataset[] = ROWS.map(
  ([name, publisher, category, status], index) => ({
    id: String(4586932 + index),
    name,
    publisher,
    category,
    status
  })
);

const STATUS_COLOR = {
  Live: "success",
  Draft: "warning",
  Retired: "danger"
} as const;

const COLUMNS = [
  { id: "name", name: "Name", isRowHeader: true },
  { id: "publisher", name: "Publisher" },
  { id: "category", name: "Category" }
] as const;

const PER_PAGE = 5;

const meta = {
  title: "Example/Table",
  component: TableRoot,
  parameters: {
    ...figmaDesign("Table"),
    docs: {
      description: {
        component:
          "Rows of records with the same fields, to compare, sort and act on, such as the datasets in the catalogue, a layer's features, or the members of a workspace. Columns can be sorted, rows selected, columns resized, and more rows loaded as it's scrolled; a Footer below holds totals or Pagination. Primary sets the rows on their own panel inside a card; secondary lays them open on the page under a header card. For a single record's fields, use a description list; for a list of things to pick from, a ListBox."
      }
    }
  },
  args: { variant: "primary" },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary"] }
  },
  decorators: [
    (Story) => (
      <div className="table-stories-frame">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof TableRoot>;

export default meta;
type Story = StoryObj<typeof meta>;

// Pagination for a table's footer, as the design's. Called as a function,
// not rendered as a component, so a story's code shows the markup it returns
const pager = (
  page: number,
  setPage: (page: number) => void,
  total: number
): React.ReactElement => {
  const pages = Math.ceil(total / PER_PAGE);
  return (
    <Pagination size="sm">
      <Pagination.Summary>
        {(page - 1) * PER_PAGE + 1} to {Math.min(page * PER_PAGE, total)} of{" "}
        {total} datasets
      </Pagination.Summary>
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.Previous
            isDisabled={page === 1}
            onPress={() => {
              setPage(page - 1);
            }}
          >
            <Pagination.PreviousIcon />
            <span>Prev</span>
          </Pagination.Previous>
        </Pagination.Item>
        {Array.from({ length: pages }, (_, index) => index + 1).map(
          (number) => (
            <Pagination.Item key={number}>
              <Pagination.Link
                isActive={number === page}
                onPress={() => {
                  setPage(number);
                }}
              >
                {number}
              </Pagination.Link>
            </Pagination.Item>
          )
        )}
        <Pagination.Item>
          <Pagination.Next
            isDisabled={page === pages}
            onPress={() => {
              setPage(page + 1);
            }}
          >
            <span>Next</span>
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  );
};

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

const sortBy =
  (sort: SortDescriptor) =>
  (a: Dataset, b: Dataset): number =>
    a[sort.column as keyof Dataset].localeCompare(
      b[sort.column as keyof Dataset]
    ) * (sort.direction === "descending" ? -1 : 1);

// The design's table: selection, sortable columns, a dataset's name and
// publisher, its status, actions, and pagination below
const catalogue = (
  variant: TableVariant | undefined,
  {
    rows,
    total,
    sort,
    setSort,
    selected,
    setSelected,
    page,
    setPage
  }: {
    rows: Dataset[];
    total: number;
    sort: SortDescriptor;
    setSort: (sort: SortDescriptor) => void;
    selected: Selection;
    setSelected: (keys: Selection) => void;
    page: number;
    setPage: (page: number) => void;
  }
): React.ReactElement => (
  <Table variant={variant}>
    <Table.ScrollContainer>
      <Table.Content
        aria-label="Datasets"
        className="table-stories-wide"
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        sortDescriptor={sort}
        onSortChange={setSort}
      >
        <Table.Header>
          <Table.Column className="table-stories-check">
            {selectBox("Select all")}
          </Table.Column>
          <Table.Column id="id" allowsSorting textValue="Dataset ID">
            {({ sortDirection }) => (
              <Table.SortableColumnHeader sortDirection={sortDirection}>
                Dataset ID
              </Table.SortableColumnHeader>
            )}
          </Table.Column>
          <Table.Column id="name" isRowHeader allowsSorting textValue="Name">
            {({ sortDirection }) => (
              <Table.SortableColumnHeader sortDirection={sortDirection}>
                Name
              </Table.SortableColumnHeader>
            )}
          </Table.Column>
          <Table.Column id="category" allowsSorting textValue="Category">
            {({ sortDirection }) => (
              <Table.SortableColumnHeader sortDirection={sortDirection}>
                Category
              </Table.SortableColumnHeader>
            )}
          </Table.Column>
          <Table.Column id="status" allowsSorting textValue="Status">
            {({ sortDirection }) => (
              <Table.SortableColumnHeader sortDirection={sortDirection}>
                Status
              </Table.SortableColumnHeader>
            )}
          </Table.Column>
          <Table.Column className="table-stories-end">Actions</Table.Column>
        </Table.Header>
        <Table.Body>
          {rows.map((dataset) => (
            <Table.Row key={dataset.id} id={dataset.id}>
              <Table.Cell className="table-stories-check">
                {selectBox("Select")}
              </Table.Cell>
              <Table.Cell>
                <div className="table-stories-id">
                  #{dataset.id}
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label={`Copy ${dataset.id}`}
                  >
                    <CopyIcon />
                  </Button>
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="table-stories-member">
                  <span className="table-stories-mark">
                    <MapIcon aria-hidden />
                  </span>
                  <div className="table-stories-lines">
                    <span>{dataset.name}</span>
                    <span className="table-stories-muted">
                      {dataset.publisher}
                    </span>
                  </div>
                </div>
              </Table.Cell>
              <Table.Cell>{dataset.category}</Table.Cell>
              <Table.Cell>
                <Chip
                  color={STATUS_COLOR[dataset.status]}
                  size="sm"
                  variant="soft"
                >
                  {dataset.status}
                </Chip>
              </Table.Cell>
              <Table.Cell>
                <div className="table-stories-actions">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    aria-label="View"
                  >
                    <EyeIcon />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    aria-label="Edit"
                  >
                    <EditIcon />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="danger-soft"
                    aria-label="Delete"
                  >
                    <TrashIcon />
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Content>
    </Table.ScrollContainer>
    <Table.Footer>{pager(page, setPage, total)}</Table.Footer>
  </Table>
);

/** The design's table: select rows, sort by a column, move between pages */
export const Default: Story = {
  render: function Render({ variant }) {
    const [sort, setSort] = useState<SortDescriptor>({
      column: "name",
      direction: "ascending"
    });
    const [selected, setSelected] = useState<Selection>(() => new Set());
    const [page, setPage] = useState(1);
    const rows = useMemo(
      () =>
        [...DATASETS]
          .sort(sortBy(sort))
          .slice((page - 1) * PER_PAGE, page * PER_PAGE),
      [sort, page]
    );
    return catalogue(variant, {
      rows,
      total: DATASETS.length,
      sort,
      setSort,
      selected,
      setSelected,
      page,
      setPage
    });
  }
};

/** The header a card of its own, the rows open on the page */
export const SecondaryVariant: Story = {
  ...Default,
  args: { variant: "secondary" }
};

/** What the body shows when there are no rows */
export const EmptyState: Story = {
  render: ({ variant }) => (
    <Table variant={variant}>
      <Table.ScrollContainer>
        <Table.Content aria-label="Datasets" className="table-stories-wide">
          <Table.Header>
            {COLUMNS.map((column) => (
              <Table.Column
                key={column.id}
                id={column.id}
                isRowHeader={"isRowHeader" in column}
              >
                {column.name}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body
            renderEmptyState={() => (
              <div className="table-stories-empty">
                <SearchIcon aria-hidden size={20} />
                <div className="table-stories-lines">
                  <span className="table-stories-empty-title">
                    No datasets found
                  </span>
                  <span className="table-stories-muted">
                    Try adjusting your search or filters
                  </span>
                </div>
              </div>
            )}
          >
            {[]}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  )
};

/** Columns and rows from data; Table.Collection renders a row's cells */
export const DynamicCollection: Story = {
  render: function Render({ variant }) {
    const [page, setPage] = useState(1);
    const rows = DATASETS.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    return (
      <Table variant={variant}>
        <Table.ScrollContainer>
          <Table.Content aria-label="Datasets" className="table-stories-wide">
            <Table.Header columns={COLUMNS}>
              {(column) => (
                <Table.Column isRowHeader={"isRowHeader" in column}>
                  {column.name}
                </Table.Column>
              )}
            </Table.Header>
            <Table.Body items={rows}>
              {(dataset) => (
                <Table.Row>
                  <Table.Collection items={COLUMNS}>
                    {(column) => <Table.Cell>{dataset[column.id]}</Table.Cell>}
                  </Table.Collection>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
        <Table.Footer>{pager(page, setPage, DATASETS.length)}</Table.Footer>
      </Table>
    );
  }
};

/** Table.Collection beside a static cell: the selection checkbox */
export const DynamicWithSelection: Story = {
  render: function Render({ variant }) {
    const [selected, setSelected] = useState<Selection>(() => new Set());
    const [page, setPage] = useState(1);
    const rows = DATASETS.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    return (
      <Table variant={variant}>
        <Table.ScrollContainer>
          <Table.Content
            aria-label="Datasets"
            className="table-stories-wide"
            selectionMode="multiple"
            selectedKeys={selected}
            onSelectionChange={setSelected}
          >
            <Table.Header>
              <Table.Column className="table-stories-check">
                {selectBox("Select all")}
              </Table.Column>
              <Table.Collection items={COLUMNS}>
                {(column) => (
                  <Table.Column isRowHeader={"isRowHeader" in column}>
                    {column.name}
                  </Table.Column>
                )}
              </Table.Collection>
            </Table.Header>
            <Table.Body items={rows}>
              {(dataset) => (
                <Table.Row>
                  <Table.Cell className="table-stories-check">
                    {selectBox("Select")}
                  </Table.Cell>
                  <Table.Collection items={COLUMNS}>
                    {(column) => <Table.Cell>{dataset[column.id]}</Table.Cell>}
                  </Table.Collection>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
        <Table.Footer>{pager(page, setPage, DATASETS.length)}</Table.Footer>
      </Table>
    );
  }
};

/** Drag the line between two headers, or focus it and use the arrow keys */
export const ColumnResizing: Story = {
  render: ({ variant }) => (
    <Table variant={variant}>
      <Table.ResizableContainer>
        <Table.Content aria-label="Datasets" className="table-stories-wide">
          <Table.Header>
            <Table.Column
              id="name"
              isRowHeader
              defaultWidth="1fr"
              minWidth={160}
            >
              Name
              <Table.ColumnResizer />
            </Table.Column>
            <Table.Column id="publisher" defaultWidth="1fr" minWidth={160}>
              Publisher
              <Table.ColumnResizer />
            </Table.Column>
            <Table.Column id="category" defaultWidth="1fr" minWidth={120}>
              Category
              <Table.ColumnResizer />
            </Table.Column>
            <Table.Column id="status" defaultWidth="1fr" minWidth={100}>
              Status
            </Table.Column>
          </Table.Header>
          <Table.Body items={DATASETS}>
            {(dataset) => (
              <Table.Row>
                <Table.Cell>{dataset.name}</Table.Cell>
                <Table.Cell>{dataset.publisher}</Table.Cell>
                <Table.Cell>{dataset.category}</Table.Cell>
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
            )}
          </Table.Body>
        </Table.Content>
      </Table.ResizableContainer>
    </Table>
  )
};

/** More rows load as it's scrolled to the end; here after a pretend wait */
export const AsyncLoading: Story = {
  parameters: {
    // React Aria gives its loading row an aria-level even in a table that
    // isn't a tree, where axe only allows one on a treegrid's rows
    a11y: {
      config: { rules: [{ id: "aria-conditional-attr", enabled: false }] }
    }
  },
  render: function Render({ variant }) {
    const list = useAsyncList<Dataset, number>({
      async load({ cursor = 0 }) {
        await new Promise((resolve) => {
          setTimeout(resolve, cursor === 0 ? 0 : 1000);
        });
        const next = cursor + 4;
        return {
          items: DATASETS.slice(cursor, next),
          cursor: next < DATASETS.length ? next : undefined
        };
      }
    });
    return (
      <Table variant={variant}>
        <Table.ScrollContainer className="table-stories-scroll">
          <Table.Content aria-label="Datasets" className="table-stories-wide">
            <Table.Header>
              {COLUMNS.map((column) => (
                <Table.Column
                  key={column.id}
                  id={column.id}
                  isRowHeader={"isRowHeader" in column}
                >
                  {column.name}
                </Table.Column>
              ))}
            </Table.Header>
            <Table.Body>
              <Table.Collection items={list.items}>
                {(dataset) => (
                  <Table.Row>
                    <Table.Cell>{dataset.name}</Table.Cell>
                    <Table.Cell>{dataset.publisher}</Table.Cell>
                    <Table.Cell>{dataset.category}</Table.Cell>
                  </Table.Row>
                )}
              </Table.Collection>
              {list.items.length < DATASETS.length && (
                <Table.LoadMore
                  isLoading={list.loadingState === "loadingMore"}
                  onLoadMore={() => {
                    list.loadMore();
                  }}
                >
                  <Table.LoadMoreContent>
                    <Spinner aria-label="Loading more datasets" />
                  </Table.LoadMoreContent>
                </Table.LoadMore>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    );
  }
};

// A thousand datasets, made by numbering the dozen above
const MANY = Array.from(
  { length: Math.ceil(1000 / DATASETS.length) },
  (_, round) =>
    DATASETS.map((dataset) => ({
      ...dataset,
      id: `${String(round)}-${dataset.id}`,
      name: `${dataset.name} ${String(round + 1)}`
    }))
)
  .flat()
  .slice(0, 1000);

/** A thousand rows, of which only those in view are rendered as it scrolls.
 * The Virtualizer lays it out, with each row's height; the table scrolls,
 * so it's given a height. Accessibility checks run from the panel's button:
 * run on each scroll, they stall it. The code shown is the story's own:
 * written out from the render, it would list every row, and the page hangs
 * sending it */
export const Virtualization: Story = {
  globals: { a11y: { manual: true } },
  parameters: { docs: { source: { type: "code" } } },
  render: ({ variant }) => (
    <Virtualizer
      layout={TableLayout}
      layoutOptions={{ rowHeight: 56, headingHeight: 40 }}
    >
      <Table variant={variant}>
        <Table.ScrollContainer>
          <Table.Content
            aria-label="A thousand datasets"
            className="table-stories-wide table-stories-virtual"
          >
            <Table.Header>
              <Table.Column id="name" isRowHeader minWidth={200}>
                Name
              </Table.Column>
              <Table.Column id="publisher" minWidth={180}>
                Publisher
              </Table.Column>
              <Table.Column id="category" minWidth={140}>
                Category
              </Table.Column>
            </Table.Header>
            <Table.Body items={MANY}>
              {(dataset) => (
                <Table.Row>
                  <Table.Cell>{dataset.name}</Table.Cell>
                  <Table.Cell>{dataset.publisher}</Table.Cell>
                  <Table.Cell>{dataset.category}</Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </Virtualizer>
  )
};

type Group = {
  id: string;
  name: string;
  kind: string;
  updated: string;
  children: Group[];
};

const GROUPS: Group[] = [
  {
    id: "hazards",
    name: "Hazards",
    kind: "Group",
    updated: "20/10/2025",
    children: [
      {
        id: "fire",
        name: "Bushfire",
        kind: "Group",
        updated: "2/8/2025",
        children: [
          {
            id: "bushfire-prone",
            name: "Bushfire-prone land",
            kind: "Dataset",
            updated: "10/7/2025",
            children: []
          },
          {
            id: "fire-history",
            name: "Fire history",
            kind: "Dataset",
            updated: "20/8/2025",
            children: []
          }
        ]
      },
      {
        id: "flood",
        name: "Flood planning area",
        kind: "Dataset",
        updated: "1/9/2025",
        children: []
      }
    ]
  },
  {
    id: "transport",
    name: "Transport",
    kind: "Group",
    updated: "3/2/2026",
    children: [
      {
        id: "stops",
        name: "Public transport stops",
        kind: "Dataset",
        updated: "23/1/2026",
        children: []
      },
      {
        id: "bikes",
        name: "Bike paths",
        kind: "Dataset",
        updated: "3/2/2026",
        children: []
      }
    ]
  }
];

// A group's row, with its own rows inside it; a chevron opens it. Called
// for each level, not rendered as a component, so a story's code shows the
// markup it returns
const groupRow = (group: Group): React.ReactElement => (
  <Table.Row id={group.id} textValue={group.name}>
    <Table.Cell textValue={group.name}>
      {({ hasChildItems, isDisabled, isTreeColumn }) => (
        <span className="table-stories-tree">
          {hasChildItems && isTreeColumn && (
            <Button
              isIconOnly
              isDisabled={isDisabled}
              size="sm"
              slot="chevron"
              variant="ghost"
            >
              <ChevronRightIcon className="table-stories-chevron" />
            </Button>
          )}
          <span>{group.name}</span>
        </span>
      )}
    </Table.Cell>
    <Table.Cell>{group.kind}</Table.Cell>
    <Table.Cell>{group.updated}</Table.Cell>
    <Table.Collection items={group.children}>{groupRow}</Table.Collection>
  </Table.Row>
);

/** Rows grouped under expandable rows: press a chevron, or use the arrow
 * keys, to open a group. treeColumn says which column holds the chevrons,
 * and rows indent by their level */
export const ExpandableRows: Story = {
  render: function Render({ variant }) {
    const [expanded, setExpanded] = useState<Selection>(
      () => new Set(["hazards"])
    );
    return (
      <Table variant={variant}>
        <Table.ScrollContainer>
          <Table.Content
            aria-label="Catalogue groups"
            className="table-stories-wide"
            treeColumn="name"
            expandedKeys={expanded}
            onExpandedChange={setExpanded}
          >
            <Table.Header>
              <Table.Column id="name" isRowHeader>
                Name
              </Table.Column>
              <Table.Column id="kind">Type</Table.Column>
              <Table.Column id="updated">Updated</Table.Column>
            </Table.Header>
            <Table.Body items={GROUPS}>{groupRow}</Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    );
  }
};
