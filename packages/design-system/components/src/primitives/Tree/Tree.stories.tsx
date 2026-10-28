import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  InfoCircleIcon,
  MapIcon,
  PlusIcon,
  StackFrontIcon,
  TrashIcon
} from "@terria/design-system-icons";
import { useMemo, useState } from "react";
import type { Key, Selection } from "react-aria-components";
import { Collection } from "react-aria-components/Collection";
import { useTreeData } from "react-stately";
import {
  Tree,
  TreeIndicator,
  TreeItem,
  TreeItemContent,
  TreeItemLabel,
  TreeLoadMoreItem,
  TreeRoot,
  useTreeItems
} from ".";
import { Button } from "../Button";
import { CheckboxPrimitive } from "../Checkbox";
import { Chip } from "../Chip";
import { SearchField } from "../SearchField";
import "./tree.stories.css";

type CatalogNode = {
  id: string;
  name: string;
  count?: number;
  children?: CatalogNode[];
};

const CATALOG: CatalogNode[] = [
  {
    id: "boundaries",
    name: "Boundaries",
    children: [
      {
        id: "abs",
        name: "ABS statistical areas",
        children: [
          { id: "sa2", name: "Statistical Area Level 2 (SA2) 2021" },
          { id: "sa3", name: "Statistical Area Level 3 (SA3) 2021" },
          { id: "lga", name: "Local Government Areas 2023" }
        ]
      },
      { id: "suburbs", name: "Suburbs and localities 2021" }
    ]
  },
  {
    id: "hazards",
    name: "Hazards",
    children: [
      { id: "bushfire", name: "Bushfire-prone land" },
      { id: "flood", name: "Flood planning area" }
    ]
  },
  {
    id: "transport",
    name: "Transport",
    children: [
      { id: "stops", name: "Public transport stops" },
      { id: "bike", name: "Bike paths" }
    ]
  },
  {
    id: "imagery",
    name: "Imagery",
    children: [{ id: "sentinel", name: "Sentinel-2 satellite imagery" }]
  }
];

const EXPANDED = ["boundaries", "abs"];

// Every group's id, for expanding them all
const groupIds = (nodes: CatalogNode[]): string[] =>
  nodes.flatMap((node) =>
    node.children ? [node.id, ...groupIds(node.children)] : []
  );

const countDatasets = (node: CatalogNode): number =>
  node.children
    ? node.children.reduce((sum, child) => sum + countDatasets(child), 0)
    : 1;

const findName = (nodes: CatalogNode[], id: Key): string | undefined => {
  for (const node of nodes) {
    if (node.id === id) return node.name;
    const found = node.children && findName(node.children, id);
    if (found) return found;
  }
  return undefined;
};

type RowOptions = {
  icons?: boolean;
  checkboxes?: boolean;
  actions?: boolean;
  indicatorAtEnd?: boolean;
};

// A row's selection checkbox
const selectBox = (name: string): React.ReactElement => (
  <CheckboxPrimitive aria-label={`Select ${name}`} slot="selection">
    <CheckboxPrimitive.Content>
      <CheckboxPrimitive.Control>
        <CheckboxPrimitive.Indicator />
      </CheckboxPrimitive.Control>
    </CheckboxPrimitive.Content>
  </CheckboxPrimitive>
);

// What follows a row's label: a group's dataset count, a dataset's buttons
const rowActions = (node: CatalogNode): React.ReactElement =>
  node.children ? (
    <Chip size="sm">{countDatasets(node)}</Chip>
  ) : (
    <>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label={`About ${node.name}`}
      >
        <InfoCircleIcon />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label={`Add ${node.name} to the map`}
      >
        <PlusIcon />
      </Button>
    </>
  );

// The catalog's rows, nested. Called as a function, not rendered as a
// component, so a story's code shows the markup it returns
const rows = (
  nodes: CatalogNode[],
  options: RowOptions = { icons: true }
): React.ReactElement[] =>
  nodes.map((node) => (
    <Tree.Item key={node.id} id={node.id} textValue={node.name}>
      <Tree.ItemContent>
        {!options.indicatorAtEnd && <Tree.Indicator />}
        {options.checkboxes && selectBox(node.name)}
        {options.icons &&
          (node.children ? (
            <StackFrontIcon aria-hidden size={16} />
          ) : (
            <MapIcon aria-hidden size={16} />
          ))}
        <Tree.ItemLabel>{node.name}</Tree.ItemLabel>
        {options.actions && rowActions(node)}
        {options.indicatorAtEnd && <Tree.Indicator />}
      </Tree.ItemContent>
      {node.children && rows(node.children, options)}
    </Tree.Item>
  ));

const meta = {
  title: "Example/Tree",
  component: TreeRoot,
  subcomponents: {
    TreeItem,
    TreeItemContent,
    TreeIndicator,
    TreeItemLabel,
    TreeLoadMoreItem
  },
  parameters: {
    docs: {
      description: {
        component:
          "Nested rows to browse and pick from, such as the data catalog's groups and datasets, or a workbench's layers. Groups expand and collapse with their indicator or the arrow keys; rows can be selected one at a time, as the catalog does to preview a dataset, or several at once with checkboxes. A row can hold icons, badges and buttons, reached with Tab. Guide lines connect a group to its children. For a flat list, use a ListBox; for records with the same fields, a Table."
      }
    }
  },
  args: {
    "aria-label": "Data catalog",
    size: "md",
    variant: "primary",
    showGuideLines: true,
    selectionMode: "single",
    defaultExpandedKeys: EXPANDED
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    variant: { control: "inline-radio", options: ["primary", "secondary"] },
    showGuideLines: {
      control: "inline-radio",
      options: [true, false, "hover"]
    },
    selectionMode: {
      control: "inline-radio",
      options: ["none", "single", "multiple"]
    }
  },
  decorators: [
    (Story) => (
      <div className="tree-stories-frame">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof TreeRoot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <Tree {...args}>{rows(CATALOG)}</Tree>
};

/** Row height, text and indent */
export const Sizes: Story = {
  render: (args) => (
    <div className="tree-stories-row">
      <Tree {...args} aria-label="Small catalog" size="sm">
        {rows(CATALOG)}
      </Tree>
      <Tree {...args} aria-label="Medium catalog" size="md">
        {rows(CATALOG)}
      </Tree>
      <Tree {...args} aria-label="Large catalog" size="lg">
        {rows(CATALOG)}
      </Tree>
    </div>
  )
};

/** Open on the page, without a card of its own */
export const SecondaryVariant: Story = {
  ...Default,
  args: { variant: "secondary" }
};

/** Guide lines show while the tree is hovered or focused */
export const GuideLinesOnHover: Story = {
  ...Default,
  args: { showGuideLines: "hover" }
};

export const WithoutGuideLines: Story = {
  ...Default,
  args: { showGuideLines: false }
};

export const WithoutIcons: Story = {
  render: (args) => <Tree {...args}>{rows(CATALOG, {})}</Tree>
};

/** The indicator sits wherever it's placed in the row, here at the end */
export const IndicatorAtEnd: Story = {
  render: (args) => (
    <Tree {...args}>
      {rows(CATALOG, { icons: true, indicatorAtEnd: true })}
    </Tree>
  )
};

/** Pressing a row selects it, as the catalog does to preview a dataset */
export const SingleSelection: Story = {
  args: { disallowEmptySelection: true },
  render: function Render(args) {
    const [selected, setSelected] = useState<Selection>(() => new Set(["sa2"]));
    const [key] = selected === "all" ? [] : selected;
    return (
      <div className="tree-stories-stack">
        <Tree
          {...args}
          selectionMode="single"
          selectedKeys={selected}
          onSelectionChange={setSelected}
        >
          {rows(CATALOG)}
        </Tree>
        <p className="tree-stories-note">
          Previewing: {key === undefined ? "nothing" : findName(CATALOG, key)}
        </p>
      </div>
    );
  }
};

/** Checkboxes select several rows. Each row's checkbox is its own: checking
 * a group doesn't check its children */
export const MultipleSelection: Story = {
  render: function Render(args) {
    const [selected, setSelected] = useState<Selection>(
      () => new Set(["sa2", "lga"])
    );
    return (
      <div className="tree-stories-stack">
        <Tree
          {...args}
          selectionMode="multiple"
          selectedKeys={selected}
          onSelectionChange={setSelected}
        >
          {rows(CATALOG, { icons: true, checkboxes: true })}
        </Tree>
        <p className="tree-stories-note">
          {selected === "all" ? "All" : selected.size} selected
        </p>
      </div>
    );
  }
};

/** Badges and buttons in a row; Tab moves through a row's buttons */
export const RowActions: Story = {
  render: (args) => (
    <Tree {...args}>{rows(CATALOG, { icons: true, actions: true })}</Tree>
  )
};

/** Disabled rows can't be selected, expanded or focused */
export const DisabledRows: Story = {
  args: { disabledKeys: ["hazards", "sa3"] },
  render: (args) => <Tree {...args}>{rows(CATALOG)}</Tree>
};

/** Labels too long for the row end in an ellipsis */
export const LongLabels: Story = {
  render: (args) => (
    <div className="tree-stories-narrow">
      <Tree {...args}>{rows(CATALOG, { icons: true, actions: true })}</Tree>
    </div>
  )
};

/** The expanded groups, controlled to expand or collapse them all */
export const ExpandAndCollapseAll: Story = {
  render: function Render(args) {
    const [expanded, setExpanded] = useState<Set<Key>>(() => new Set(EXPANDED));
    return (
      <div className="tree-stories-stack">
        <div className="tree-stories-buttons">
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              setExpanded(new Set(groupIds(CATALOG)));
            }}
          >
            Expand all
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              setExpanded(new Set());
            }}
          >
            Collapse all
          </Button>
        </div>
        <Tree {...args} expandedKeys={expanded} onExpandedChange={setExpanded}>
          {rows(CATALOG)}
        </Tree>
      </div>
    );
  }
};

/** useTreeItems filters the catalog to the datasets that match, keeping the
 * groups that hold them, and lists those groups to expand them all */
export const Search: Story = {
  render: function Render(args) {
    const [query, setQuery] = useState("");
    const { filterTree } = useTreeItems({ items: CATALOG });
    const filtered = useMemo(
      () =>
        query
          ? filterTree((node) =>
              node.name.toLowerCase().includes(query.toLowerCase())
            )
          : CATALOG,
      [filterTree, query]
    );
    const { expandableKeys } = useTreeItems({ items: filtered });
    return (
      <div className="tree-stories-stack">
        <SearchField
          aria-label="Search the catalog"
          value={query}
          onChange={setQuery}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search datasets…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <Tree
          // A new search expands every group with a match
          key={query}
          {...args}
          defaultExpandedKeys={query ? expandableKeys : EXPANDED}
          renderEmptyState={() => "No datasets match your search"}
        >
          {rows(filtered)}
        </Tree>
      </div>
    );
  }
};

/** Rows from data with useTreeData, which keeps the tree's items as they
 * change */
export const DynamicCollection: Story = {
  render: function Render(args) {
    const tree = useTreeData({
      initialItems: CATALOG,
      getKey: (node) => node.id,
      getChildren: (node) => node.children ?? []
    });
    return (
      <Tree {...args} items={tree.items}>
        {function renderNode(item) {
          return (
            <Tree.Item id={item.key} textValue={item.value.name}>
              <Tree.ItemContent>
                <Tree.Indicator />
                <Tree.ItemLabel>{item.value.name}</Tree.ItemLabel>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  aria-label={`Remove ${item.value.name}`}
                  onPress={() => {
                    tree.remove(item.key);
                  }}
                >
                  <TrashIcon />
                </Button>
              </Tree.ItemContent>
              <Collection items={item.children ?? []}>{renderNode}</Collection>
            </Tree.Item>
          );
        }}
      </Tree>
    );
  }
};

/** What it shows with no rows */
export const EmptyState: Story = {
  render: (args) => (
    <Tree {...args} renderEmptyState={() => "No datasets match your search"}>
      {[]}
    </Tree>
  )
};

const LAZY_GROUPS = CATALOG.map(({ id, name }) => ({ id, name }));

/** A group's children load when it's first expanded, with a loading row
 * meanwhile */
export const LazyChildren: Story = {
  args: { defaultExpandedKeys: [] },
  render: function Render(args) {
    const [children, setChildren] = useState<Record<string, CatalogNode[]>>({});
    const [loading, setLoading] = useState<Set<Key>>(() => new Set());

    const load = (keys: Set<Key>): void => {
      const toLoad = [...keys].filter(
        (key) => !(String(key) in children) && !loading.has(key)
      );
      if (toLoad.length === 0) return;
      setLoading((current) => new Set([...current, ...toLoad]));
      for (const key of toLoad) {
        setTimeout(() => {
          const group = CATALOG.find((node) => node.id === key);
          setChildren((current) => ({
            ...current,
            [String(key)]: group?.children ?? []
          }));
          setLoading((current) => {
            const next = new Set(current);
            next.delete(key);
            return next;
          });
        }, 1500);
      }
    };

    return (
      <Tree {...args} onExpandedChange={load}>
        {LAZY_GROUPS.map((group) => (
          <Tree.Item
            key={group.id}
            id={group.id}
            textValue={group.name}
            hasChildItems
          >
            <Tree.ItemContent>
              <Tree.Indicator />
              <StackFrontIcon aria-hidden size={16} />
              <Tree.ItemLabel>{group.name}</Tree.ItemLabel>
            </Tree.ItemContent>
            {loading.has(group.id) && <Tree.LoadMoreItem isLoading />}
            {rows(children[group.id] ?? [])}
          </Tree.Item>
        ))}
      </Tree>
    );
  }
};
