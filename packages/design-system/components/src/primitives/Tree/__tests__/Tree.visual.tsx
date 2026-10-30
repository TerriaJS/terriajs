import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MapIcon, PlusIcon, StackFrontIcon } from "@terria/design-system-icons";
import { Collection } from "react-aria-components/Collection";
import { useTreeData } from "react-stately";
import { hover, press, snap } from "../../../visual";
import { Button } from "../../Button";
import { CheckboxPrimitive } from "../../Checkbox";
import { Chip } from "../../Chip";
import { Tree, useTreeDragAndDrop, type TreeProps } from "..";
import "../tree.stories.css";

type CatalogNode = { id: string; name: string; children?: CatalogNode[] };

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
          { id: "lga", name: "Local Government Areas 2023" }
        ]
      },
      { id: "suburbs", name: "Suburbs and localities 2021" }
    ]
  },
  {
    id: "hazards",
    name: "Hazards",
    children: [{ id: "flood", name: "Flood planning area" }]
  },
  {
    id: "transport",
    name: "Transport",
    children: [{ id: "stops", name: "Public transport stops" }]
  }
];

type RowOptions = {
  checkboxes?: boolean;
  actions?: boolean;
  indicatorAtEnd?: boolean;
};

const rows = (
  nodes: CatalogNode[],
  options: RowOptions = {}
): React.ReactElement[] =>
  nodes.map((node) => (
    <Tree.Item key={node.id} id={node.id} textValue={node.name}>
      <Tree.ItemContent>
        {!options.indicatorAtEnd && <Tree.Indicator />}
        {options.checkboxes && (
          <CheckboxPrimitive
            aria-label={`Select ${node.name}`}
            slot="selection"
          >
            <CheckboxPrimitive.Content>
              <CheckboxPrimitive.Control>
                <CheckboxPrimitive.Indicator />
              </CheckboxPrimitive.Control>
            </CheckboxPrimitive.Content>
          </CheckboxPrimitive>
        )}
        {node.children ? (
          <StackFrontIcon aria-hidden size={16} />
        ) : (
          <MapIcon aria-hidden size={16} />
        )}
        <Tree.ItemLabel>{node.name}</Tree.ItemLabel>
        {options.actions &&
          (node.children ? (
            <Chip size="sm">{node.children.length}</Chip>
          ) : (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label={`Add ${node.name} to the map`}
            >
              <PlusIcon />
            </Button>
          ))}
        {options.indicatorAtEnd && <Tree.Indicator />}
      </Tree.ItemContent>
      {node.children && rows(node.children, options)}
    </Tree.Item>
  ));

type Options = Partial<TreeProps<object>> & RowOptions;

// Boundaries and its statistical areas are open; Hazards is disabled
const catalog = ({
  checkboxes,
  actions,
  indicatorAtEnd,
  ...props
}: Options): React.ReactElement => (
  <Tree
    aria-label="Data catalog"
    className="tree-stories-frame"
    selectionMode="single"
    defaultExpandedKeys={["boundaries", "abs"]}
    disabledKeys={["hazards"]}
    {...props}
  >
    {rows(CATALOG, { checkboxes, actions, indicatorAtEnd })}
  </Tree>
);

// Groups open and shut with the Web Animations API, which the stylesheet
// cutting CSS animations doesn't reach
const settled = (): Promise<unknown> =>
  Promise.all(document.getAnimations().map((animation) => animation.finished));

describe.each(["primary", "secondary"] as const)("Tree %s", (variant) => {
  const tree = (options: Options = {}): React.ReactElement =>
    catalog({ variant, ...options });

  it("default", async () => {
    await render(tree());
    await snap();
  });

  it("row hovered", async () => {
    const screen = await render(tree());
    await hover(
      screen.getByRole("row", { name: "Suburbs and localities 2021" })
    );
    await snap();
  });

  it("row focused", async () => {
    const screen = await render(tree());
    const row = screen.getByRole("row", { name: "Boundaries" });
    await userEvent.keyboard("{Tab}");
    await expect.element(row).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("row hovered and focused", async () => {
    const screen = await render(tree());
    const row = screen.getByRole("row", { name: "Boundaries" });
    await hover(row);
    await userEvent.keyboard("{Tab}");
    await expect.element(row).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("row selected", async () => {
    await render(tree({ defaultSelectedKeys: ["sa2"] }));
    await snap();
  });

  it("selected row hovered", async () => {
    const screen = await render(tree({ defaultSelectedKeys: ["sa2"] }));
    await hover(
      screen.getByRole("row", { name: "Statistical Area Level 2 (SA2) 2021" })
    );
    await snap();
  });

  it("row selected by pressing", async () => {
    const screen = await render(tree());
    const row = screen.getByRole("row", {
      name: "Local Government Areas 2023"
    });
    await userEvent.click(row);
    await expect.element(row).toHaveAttribute("data-selected");
    await snap();
  });

  it("disabled row hovered", async () => {
    const screen = await render(tree());
    await hover(screen.getByRole("row", { name: "Hazards" }));
    await snap();
  });

  it("indicator hovered", async () => {
    const screen = await render(tree());
    await hover(
      screen
        .getByRole("row", { name: "Transport" })
        .getByRole("button", { name: /expand|collapse/i })
    );
    await snap();
  });

  it("indicator pressed", async () => {
    const screen = await render(tree());
    const indicator = screen
      .getByRole("row", { name: "Transport" })
      .getByRole("button", { name: /expand|collapse/i });
    await press(indicator);
    await expect.element(indicator).toHaveAttribute("data-pressed");
    await snap();
  });

  it("group collapsed by pressing", async () => {
    const screen = await render(tree());
    const row = screen.getByRole("row", { name: "ABS statistical areas" });
    await userEvent.click(row.getByRole("button", { name: /collapse/i }));
    await expect.element(row).toHaveAttribute("aria-expanded", "false");
    await settled();
    await expect
      .element(screen.getByRole("row", { name: "Local Government Areas 2023" }))
      .not.toBeInTheDocument();
    await snap();
  });

  it("group expanded by arrow key", async () => {
    const screen = await render(tree());
    const row = screen.getByRole("row", { name: "Transport" });
    // Boundaries, then past its four rows and Hazards, to Transport
    await userEvent.keyboard("{Tab}{End}{ArrowRight}");
    await expect.element(row).toHaveAttribute("aria-expanded", "true");
    await expect
      .element(screen.getByRole("row", { name: "Public transport stops" }))
      .toBeVisible();
    await settled();
    await snap();
  });

  it("all collapsed", async () => {
    await render(tree({ defaultExpandedKeys: [] }));
    await snap();
  });

  it("checkboxes", async () => {
    await render(
      tree({
        selectionMode: "multiple",
        checkboxes: true,
        defaultSelectedKeys: ["sa2", "lga"]
      })
    );
    await snap();
  });

  it("row actions", async () => {
    await render(tree({ actions: true }));
    await snap();
  });

  it("indicator at the end", async () => {
    await render(tree({ indicatorAtEnd: true }));
    await snap();
  });

  it("guide lines off", async () => {
    await render(tree({ showGuideLines: false }));
    await snap();
  });

  it("guide lines on hover, not hovered", async () => {
    await render(tree({ showGuideLines: "hover" }));
    await snap();
  });

  it("guide lines on hover, hovered", async () => {
    const screen = await render(tree({ showGuideLines: "hover" }));
    await hover(screen.getByRole("row", { name: "Boundaries" }));
    await snap();
  });
});

describe("Tree", () => {
  it.each(["sm", "md", "lg"] as const)("size %s", async (size) => {
    await render(catalog({ size }));
    await snap();
  });

  it("empty", async () => {
    await render(
      <Tree
        aria-label="Data catalog"
        className="tree-stories-frame"
        renderEmptyState={() => "No datasets match your search"}
      >
        {[]}
      </Tree>
    );
    await snap();
  });

  it("loading more", async () => {
    await render(
      <Tree
        aria-label="Data catalog"
        className="tree-stories-frame"
        defaultExpandedKeys={["hazards"]}
      >
        <Tree.Item id="hazards" textValue="Hazards">
          <Tree.ItemContent>
            <Tree.Indicator />
            <Tree.ItemLabel>Hazards</Tree.ItemLabel>
          </Tree.ItemContent>
          <Tree.Item id="flood" textValue="Flood planning area">
            <Tree.ItemContent>
              <Tree.Indicator />
              <Tree.ItemLabel>Flood planning area</Tree.ItemLabel>
            </Tree.ItemContent>
          </Tree.Item>
          <Tree.LoadMoreItem isLoading />
        </Tree.Item>
      </Tree>
    );
    await snap();
  });
});

// Rows that move: a component, as useTreeData is a hook
// eslint-disable-next-line react-refresh/only-export-components -- A test file, never hot reloaded
const Draggable = (): React.ReactElement => {
  const data = useTreeData({
    initialItems: CATALOG,
    getKey: (node) => node.id,
    getChildren: (node) => node.children ?? []
  });
  const { dragAndDropHooks } = useTreeDragAndDrop({ tree: data });
  return (
    <Tree
      aria-label="Data catalog"
      className="tree-stories-frame"
      selectionMode="multiple"
      defaultExpandedKeys={["boundaries"]}
      items={data.items}
      dragAndDropHooks={dragAndDropHooks}
    >
      {function renderNode(item) {
        return (
          <Tree.Item id={item.key} textValue={item.value.name}>
            <Tree.ItemContent>
              <Tree.Indicator />
              <Tree.ItemLabel>{item.value.name}</Tree.ItemLabel>
              <Tree.DragHandle />
            </Tree.ItemContent>
            <Collection items={item.children ?? []}>{renderNode}</Collection>
          </Tree.Item>
        );
      }}
    </Tree>
  );
};

describe("Tree draggable", () => {
  it("default", async () => {
    await render(<Draggable />);
    await snap();
  });

  it("row hovered, drag handle shown", async () => {
    const screen = await render(<Draggable />);
    await hover(screen.getByRole("row", { name: "Hazards" }));
    await snap();
  });

  it("drag handle focused", async () => {
    const screen = await render(<Draggable />);
    const handle = screen
      .getByRole("row", { name: "Hazards" })
      .getByRole("button", { name: /drag/i });
    await userEvent.keyboard("{Tab}{ArrowDown}{ArrowDown}{ArrowDown}{Tab}");
    await expect.element(handle).toHaveAttribute("data-focus-visible");
    await snap();
  });
});
