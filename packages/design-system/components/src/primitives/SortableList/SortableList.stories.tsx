import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { moveItems, SortableList, type SortableItemState } from ".";
import {
  AlertCircleIcon,
  DotsVerticalIcon,
  InfoCircleIcon,
  ZoomIcon
} from "@terria/design-system-icons";
import { Alert } from "../Alert";
import { Button } from "../Button";
import { Checkbox, CheckboxPrimitive } from "../Checkbox";
import { Chip } from "../Chip";
import { Disclosure } from "../Disclosure";
import { Label } from "../Field";
import { ListBox } from "../ListBox";
import { Select } from "../Select";
import { Separator } from "../Separator";
import { Slider } from "../Slider";
import { Switch } from "../Switch";
import "./sortable-list.stories.css";

type Layer = { id: string; name: string; description?: string };

// Some layers have a description, so the rows differ in height
const LAYERS: Layer[] = [
  { id: "roads", name: "Roads" },
  {
    id: "rivers",
    name: "Rivers",
    description: "Major rivers and creeks, from the national hydrography."
  },
  { id: "suburbs", name: "Suburbs (2021 census)" },
  {
    id: "bushfires",
    name: "Bushfire prone land",
    description:
      "Land likely to support a bushfire or be subject to bushfire attack, mapped by local councils and updated every five years."
  }
];

// A layer row, given its drag state. Called as a function, not rendered as a
// component, so a story's code shows the markup it returns
const layerRow = (
  layer: Layer,
  { isDragging }: SortableItemState
): React.ReactElement => (
  <div
    className="sortable-list-story-row"
    data-dragging={isDragging || undefined}
  >
    <SortableList.DragHandle />
    <div>
      {layer.name}
      {layer.description && (
        <span className="sortable-list-story-description">
          {layer.description}
        </span>
      )}
    </div>
  </div>
);

const meta = {
  title: "Example/SortableList",
  component: SortableList<Layer>,
  subcomponents: { "SortableList.DragHandle": SortableList.DragHandle },
  parameters: {
    docs: {
      description: {
        component:
          "SortableList only makes a list sortable: dragging items by pointer or keyboard, where they would land, scrolling while dragging, and onReorder with the new position. What an item shows and how it looks is up to you. children draws each item from your data, given its drag state (isDragging), and its styles are yours; the list adds no look of its own beyond the drop line and the focus ring. Put SortableList.DragHandle wherever the item should be picked up, around the grip or your own content such as a title, and keep the order yourself in onReorder, for example with moveItems."
      }
    }
  },
  args: {
    "aria-label": "Layers on the map",
    items: LAYERS,
    getItemText: (layer) => layer.name,
    children: layerRow,
    onReorder: fn(),
    dropIndicator: "line"
  },
  argTypes: {
    dropIndicator: {
      control: "inline-radio",
      options: ["line", "item"]
    },
    axis: { control: "inline-radio", options: [undefined, "y"] },
    dragFrom: { control: "inline-radio", options: ["item", "handle"] },
    dragDelay: { control: { type: "number", min: 0, step: 50 } },
    items: { control: false },
    renderDragPreview: { control: false }
  },
  // Keeps the order it's dropped in
  render: function Render(args) {
    const [layers, setLayers] = useState(() => [...args.items]);

    return (
      <div className="sortable-list-story">
        <SortableList
          {...args}
          items={layers}
          onReorder={(event) => {
            args.onReorder(event);
            setLayers((current) =>
              moveItems(current, event.keys, event.target)
            );
          }}
        />
      </div>
    );
  }
} satisfies Meta<typeof SortableList<Layer>>;

export default meta;
type Story = StoryObj<typeof meta>;

// A workbench row: a checkbox to show the layer, then its title, which is
// the handle. Called as a function, like layerRow
const workbenchRow = (
  layer: Layer,
  { isDragging }: SortableItemState
): React.ReactElement => (
  <div
    className="sortable-list-story-row"
    data-dragging={isDragging || undefined}
  >
    <CheckboxPrimitive aria-label={`Show ${layer.name}`} defaultSelected>
      <CheckboxPrimitive.Content>
        <CheckboxPrimitive.Control>
          <CheckboxPrimitive.Indicator />
        </CheckboxPrimitive.Control>
      </CheckboxPrimitive.Content>
    </CheckboxPrimitive>
    <div>
      <SortableList.DragHandle>{layer.name}</SortableList.DragHandle>
      {layer.description && (
        <span className="sortable-list-story-description">
          {layer.description}
        </span>
      )}
    </div>
  </div>
);

/** Drag a layer by its handle, or from the keyboard: Enter on the handle
 * picks it up, the arrows move it, Enter drops it and Escape puts it back. A
 * line shows where it would land, and the row being dragged fades through
 * isDragging. The rows differ in height: each is as tall as its content */
export const Default: Story = {};

/** dropIndicator="item": the dragged row itself moves to where it would land
 * while dragging, and the rows around it make way. Escape puts it back. Here
 * the dragged row, told by isDragging, is drawn as an outline */
export const Item: Story = {
  args: { dropIndicator: "item" }
};

/** renderDragPreview draws what follows the pointer, given the dragged
 * layers. The browser takes a picture of it when the drag starts, so it
 * doesn't change while dragging */
export const CustomDragPreview: Story = {
  args: {
    renderDragPreview: (layers: Layer[]) => (
      <div className="sortable-list-story-preview">
        {layers.length === 1
          ? `Moving ${layers[0]?.name ?? ""}`
          : `Moving ${String(layers.length)} layers`}
      </div>
    )
  }
};

/** axis="y": what follows the pointer stays in the list's column. The
 * browser's drag picture can go anywhere, so the list shows its own copy of
 * the row, as it looked when picked up, and moves it only up and down */
export const Axis: Story = {
  args: { axis: "y", dropIndicator: "item" }
};

// Descriptions of different lengths, so the rows differ in height
const DESCRIPTIONS = [
  undefined,
  "Updated daily.",
  "Collected by satellite and checked against ground stations each month.",
  undefined,
  "Boundaries as at the last census, with population counts, median ages and household sizes for every suburb in the state."
];

// Enough layers to scroll, of different heights
const MANY_LAYERS: Layer[] = Array.from({ length: 20 }, (_, index) => ({
  id: `layer-${String(index + 1)}`,
  name: `Layer ${String(index + 1)}`,
  description: DESCRIPTIONS[index % DESCRIPTIONS.length]
}));

/** In a list that scrolls, with rows of different heights, a drag scrolls
 * it while the pointer is in the zone at its top or bottom, or past it,
 * faster the further in, and stops once the pointer leaves the page.
 * scrollEdge sets how deep the zone is, in pixels (48 unless set; here 64),
 * and scrollSpeed how fast it scrolls at full speed, in pixels a second (1200
 * unless set). With nothing around the list that scrolls, the page scrolls
 * instead, from the window's edges. From the keyboard the list scrolls to
 * where the item would land */
export const Scrolling: Story = {
  args: {
    items: MANY_LAYERS,
    className: "sortable-list-story-scroll",
    scrollEdge: 64,
    axis: "y",
    dropIndicator: "item"
  }
};

/** dragFrom="handle": only the grip picks a row up. Pressing anywhere else
 * on the row, here its name or description, starts no drag */
export const HandleOnly: Story = {
  args: { dragFrom: "handle" }
};

/** dragDelay: press a row and hold it for 300ms before moving, and only then
 * does it start dragging. Moved sooner, it selects text as usual. Touch holds
 * before dragging already */
export const LongPress: Story = {
  args: { dragDelay: 300 }
};

/** dragFrom="handle": a pointer drag starts only on SortableList.DragHandle,
 * not anywhere on the row, so the row's other controls work as they are.
 * Its children replace the grip: here the title is the handle, after the
 * checkbox, as in the workbench. From the keyboard, Tab to the title and
 * press Enter */
export const TitleAsHandle: Story = {
  args: { dragFrom: "handle", dropIndicator: "item", children: workbenchRow }
};

// A workbench layer: shown or hidden by its switch, with a subtitle, maybe a
// problem to point out, and settings that differ from layer to layer
type WorkbenchLayer = {
  id: string;
  name: string;
  subtitle: string;
  problem?: string;
  expanded: boolean;
  settings: () => React.ReactElement;
};

// A layer's opacity, as a percentage
const opacity = (value: number): React.ReactElement => (
  <Slider
    label="Opacity"
    defaultValue={value}
    minValue={0}
    maxValue={1}
    step={0.01}
    formatOptions={{ style: "percent" }}
    showValue
  />
);

const SHADOWS = ["Cast and receive", "Cast only", "Receive only", "None"];

const WORKBENCH: WorkbenchLayer[] = [
  {
    id: "photomesh",
    name: "Melbourne City Photomesh",
    subtitle: "February 2025 · Aerometrix",
    problem: "Shadows are off in Display settings",
    expanded: true,
    settings: () => (
      <>
        {opacity(0.68)}
        <div className="tds-stack tds-flex-gap-sm">
          <Select defaultValue="Receive only" fullWidth>
            <Label>Shadows</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {SHADOWS.map((shadows) => (
                  <ListBox.Item key={shadows} id={shadows} textValue={shadows}>
                    {shadows}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
          <Alert status="warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Shadows are off in Display settings</Alert.Title>
            </Alert.Content>
            <Button size="sm" variant="outline">
              Review
            </Button>
          </Alert>
        </div>
        <Checkbox>Clip model</Checkbox>
      </>
    )
  },
  {
    id: "roads",
    name: "Roads",
    subtitle: "Updated weekly · OpenStreetMap",
    expanded: false,
    settings: () => opacity(1)
  },
  {
    id: "suburbs",
    name: "Suburbs (2021 census)",
    subtitle: "2021 · Australian Bureau of Statistics",
    expanded: true,
    settings: () => (
      <>
        {opacity(0.8)}
        <Switch size="sm" defaultSelected>
          Show labels
        </Switch>
        <Checkbox>Show boundaries only</Checkbox>
      </>
    )
  },
  {
    id: "rivers",
    name: "Rivers",
    subtitle: "National hydrography · Geoscience Australia",
    expanded: false,
    settings: () => (
      <>
        <p>Major rivers and creeks, from the national hydrography.</p>
        <div className="tds-cluster tds-flex-gap-xs">
          <Chip size="sm">Hydrology</Chip>
          <Chip size="sm">National</Chip>
          <Chip size="sm" color="success">
            Updated 2024
          </Chip>
        </div>
      </>
    )
  },
  {
    id: "rainfall",
    name: "Annual rainfall",
    subtitle: "2015 to 2024 · Bureau of Meteorology",
    problem: "Some years are still loading",
    expanded: false,
    settings: () => (
      <Slider
        label="Year"
        minValue={2015}
        maxValue={2024}
        defaultValue={2024}
        showValue
      />
    )
  }
];

// A layer in the workbench, as in the design: its switch, named by the
// layer, shows or hides it; a problem, if any, then the chevron that opens
// it. The whole header is the handle; its buttons and switch still work, as
// a drag starts only once the pointer moves. Open, it shows the layer's
// actions and its settings. Called as a function, like layerRow
const workbenchLayer = (
  layer: WorkbenchLayer,
  { isDragging }: SortableItemState
): React.ReactElement => (
  <Disclosure
    defaultExpanded={layer.expanded}
    // The content attaches to the header; the story spaces it
    fullWidth
    className="sortable-list-story-layer"
    data-dragging={isDragging || undefined}
  >
    <SortableList.DragHandle className="sortable-list-story-layer-title">
      <Switch size="sm" defaultSelected description={layer.subtitle}>
        <span className="sortable-list-story-layer-name">{layer.name}</span>
      </Switch>
      {layer.problem && (
        <Button
          size="sm"
          variant="ghost"
          isIconOnly
          aria-label={layer.problem}
          className="sortable-list-story-layer-problem"
        >
          <AlertCircleIcon aria-hidden />
        </Button>
      )}
      <Disclosure.Heading>
        <Button
          slot="trigger"
          size="sm"
          variant="ghost"
          isIconOnly
          aria-label={`${layer.name} settings`}
        >
          <Disclosure.Indicator />
        </Button>
      </Disclosure.Heading>
    </SortableList.DragHandle>
    <Disclosure.Content>
      <div className="sortable-list-story-layer-body tds-stack tds-flex-gap-md">
        <Separator />
        <div className="tds-cluster tds-flex-gap-sm">
          <Button size="sm" variant="outline">
            <ZoomIcon aria-hidden />
            Zoom to
          </Button>
          <Button size="sm" variant="outline">
            <InfoCircleIcon aria-hidden />
            About data
          </Button>
          <Button
            size="sm"
            variant="outline"
            isIconOnly
            aria-label={`More for ${layer.name}`}
            className="sortable-list-story-layer-more"
          >
            <DotsVerticalIcon aria-hidden />
          </Button>
        </div>
        <div className="tds-stack tds-flex-gap-lg">{layer.settings()}</div>
      </div>
    </Disclosure.Content>
  </Disclosure>
);

/** A workbench, as in the design: each layer is a card whose whole header
 * picks it up, wrapped in SortableList.DragHandle: the switch, named by the
 * layer, its subtitle, a problem if any, and the chevron that opens its
 * actions and settings, which differ from layer to layer, some open and some
 * closed at first. The switch and buttons still work when clicked; a drag
 * starts only once the pointer moves. Only the header starts a drag
 * (dragFrom="handle"), so the settings work as they are, and the cards differ
 * in height as they open and close */
export const WorkbenchLayers: Story = {
  args: { dragFrom: "handle", dropIndicator: "item" },
  render: function Render({
    dragFrom,
    dropIndicator,
    axis,
    dragDelay,
    scrollEdge,
    scrollSpeed
  }) {
    const [layers, setLayers] = useState(WORKBENCH);

    return (
      <div className="sortable-list-story">
        <SortableList
          aria-label="Workbench"
          items={layers}
          getItemText={(layer) => layer.name}
          dragFrom={dragFrom}
          dropIndicator={dropIndicator}
          axis={axis}
          dragDelay={dragDelay}
          scrollEdge={scrollEdge}
          scrollSpeed={scrollSpeed}
          onReorder={(event) => {
            setLayers((current) =>
              moveItems(current, event.keys, event.target)
            );
          }}
        >
          {workbenchLayer}
        </SortableList>
      </div>
    );
  }
};
