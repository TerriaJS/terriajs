import type { Meta, StoryObj } from "@storybook/react-vite";

import { ChevronsUpDown, Globe, Mountain, Satellite } from "lucide-react";
import { Collection } from "react-aria-components/Collection";
import { ListBoxLoadMoreItem } from "react-aria-components/ListBox";
import { useAsyncList } from "react-aria-components/useAsyncList";
import { Description, FieldError, Label } from "../Field";
import { Header } from "../Header";
import { ProgressCircle } from "../ProgressCircle";
import { ListBox } from "../ListBox";
import { Separator } from "../Separator";
import {
  Select,
  SelectClearButton,
  SelectIndicator,
  SelectPopover,
  SelectTrigger,
  SelectValue
} from ".";

const meta = {
  title: "Example/Select",
  component: Select,
  subcomponents: {
    SelectTrigger,
    SelectValue,
    SelectIndicator,
    SelectClearButton,
    SelectPopover
  },
  args: { placeholder: "Select one", fullWidth: true },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary"] }
  },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 256 }}>
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const states = [
  "Australian Capital Territory",
  "New South Wales",
  "Northern Territory",
  "Queensland",
  "South Australia",
  "Tasmania",
  "Victoria",
  "Western Australia"
];

const trigger = (
  <Select.Trigger>
    <Select.Value />
    <Select.Indicator />
  </Select.Trigger>
);

const stateOptions = (
  <Select.Popover>
    <ListBox>
      {states.map((state) => (
        <ListBox.Item key={state} id={state} textValue={state}>
          {state}
          <ListBox.ItemIndicator />
        </ListBox.Item>
      ))}
    </ListBox>
  </Select.Popover>
);

export const Default: Story = {
  args: { isRequired: true },
  render: (args) => (
    <Select {...args}>
      <Label>State</Label>
      {trigger}
      {stateOptions}
    </Select>
  )
};

export const Secondary: Story = {
  args: { variant: "secondary" },
  render: Default.render
};

export const WithDescription: Story = {
  render: (args) => (
    <Select {...args}>
      <Label>State</Label>
      {trigger}
      <Description>Filters the layers to this state</Description>
      {stateOptions}
    </Select>
  )
};

export const Invalid: Story = {
  args: { isRequired: true, isInvalid: true },
  render: (args) => (
    <Select {...args}>
      <Label>State</Label>
      {trigger}
      <FieldError>Choose a state</FieldError>
      {stateOptions}
    </Select>
  )
};

export const Disabled: Story = {
  args: { isDisabled: true, defaultValue: "Victoria" },
  render: Default.render
};

const titleStyle = { display: "flex", flexDirection: "column" } as const;

export const RichOptions: Story = {
  args: { placeholder: "Choose a base map", defaultValue: "satellite" },
  render: (args) => (
    <Select {...args}>
      <Label>Base map</Label>
      {trigger}
      <Select.Popover>
        <ListBox>
          <ListBox.Section>
            <Header>Maps</Header>
            <ListBox.Item id="osm" textValue="OpenStreetMap">
              <Globe aria-hidden size={16} />
              <div style={titleStyle}>
                <Label>OpenStreetMap</Label>
                <Description>Streets and places</Description>
              </div>
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="terrain" textValue="Terrain">
              <Mountain aria-hidden size={16} />
              <div style={titleStyle}>
                <Label>Terrain</Label>
                <Description>Elevation shaded relief</Description>
              </div>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox.Section>
          <Separator />
          <ListBox.Section>
            <Header>Imagery</Header>
            <ListBox.Item id="satellite" textValue="Satellite">
              <Satellite aria-hidden size={16} />
              <div style={titleStyle}>
                <Label>Satellite</Label>
                <Description>Aerial imagery</Description>
              </div>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox.Section>
        </ListBox>
      </Select.Popover>
    </Select>
  )
};

// Inline and toolbar selects hug their value instead of filling
export const Inline: Story = {
  args: { fullWidth: false, "aria-label": "State" },
  render: (args) => (
    <Select {...args}>
      {trigger}
      {stateOptions}
    </Select>
  )
};

export const Multiple: Story = {
  args: {
    selectionMode: "multiple",
    placeholder: "Select states",
    defaultValue: ["Victoria", "Tasmania"]
  },
  render: (args) => (
    <Select {...args}>
      <Label>States</Label>
      {trigger}
      {stateOptions}
    </Select>
  )
};

export const CustomIndicator: Story = {
  render: (args) => (
    <Select {...args}>
      <Label>State</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator>
          <ChevronsUpDown size={16} />
        </Select.Indicator>
      </Select.Trigger>
      {stateOptions}
    </Select>
  )
};

// Clicking the cross, or Backspace/Delete on the trigger, clears the choice
export const ClearButton: Story = {
  args: { defaultValue: "Victoria" },
  render: (args) => (
    <Select {...args}>
      <Label>State</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.ClearButton />
        <Select.Indicator />
      </Select.Trigger>
      {stateOptions}
    </Select>
  )
};

const baseMaps = [
  { id: "osm", name: "OpenStreetMap", Icon: Globe },
  { id: "terrain", name: "Terrain", Icon: Mountain },
  { id: "satellite", name: "Satellite", Icon: Satellite }
];

export const CustomValue: Story = {
  args: { defaultValue: "satellite" },
  render: (args) => (
    <Select {...args}>
      <Label>Base map</Label>
      <Select.Trigger>
        <Select.Value>
          {({ selectedItems, defaultChildren }) => {
            // selectedItems holds the item objects passed to ListBox
            const map = baseMaps.find((item) => item === selectedItems[0]);
            if (!map) return defaultChildren;
            return (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <map.Icon aria-hidden size={16} />
                {map.name}
              </span>
            );
          }}
        </Select.Value>
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox items={baseMaps}>
          {(map) => (
            <ListBox.Item id={map.id} textValue={map.name}>
              <map.Icon aria-hidden size={16} />
              {map.name}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          )}
        </ListBox>
      </Select.Popover>
    </Select>
  )
};

type Suburb = { name: string };

// Loads 20 suburbs at a time from a fake API as the list scrolls
const fetchSuburbs = async (page: number): Promise<Suburb[]> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return Array.from({ length: 20 }, (_, i) => ({
    name: `Suburb ${String(page * 20 + i + 1)}`
  }));
};

const spinnerStyle = {
  display: "flex",
  justifyContent: "center",
  padding: 8
} as const;

const Spinner = ({ label }: { label: string }): React.ReactElement => (
  <ProgressCircle aria-label={label} isIndeterminate size="sm">
    <ProgressCircle.Track>
      <ProgressCircle.TrackCircle />
      <ProgressCircle.FillCircle />
    </ProgressCircle.Track>
  </ProgressCircle>
);

const AsyncSelect = (args: Story["args"]): React.ReactElement => {
  const list = useAsyncList<Suburb, number>({
    async load({ cursor = 0 }) {
      return { items: await fetchSuburbs(cursor), cursor: cursor + 1 };
    }
  });

  return (
    // A Select won't open while its list is empty; allow it so the first
    // click shows the loading state instead of doing nothing
    <Select {...args} placeholder="Select a suburb" allowsEmptyCollection>
      <Label>Suburb</Label>
      {trigger}
      <Select.Popover style={{ maxBlockSize: 300 }}>
        <ListBox
          renderEmptyState={() => (
            <div style={spinnerStyle}>
              {list.isLoading ? (
                <Spinner label="Loading suburbs" />
              ) : (
                "No suburbs"
              )}
            </div>
          )}
        >
          <Collection items={list.items}>
            {(suburb) => (
              <ListBox.Item id={suburb.name}>{suburb.name}</ListBox.Item>
            )}
          </Collection>
          <ListBoxLoadMoreItem
            onLoadMore={() => {
              list.loadMore();
            }}
            isLoading={list.loadingState === "loadingMore"}
            style={spinnerStyle}
          >
            <Spinner label="Loading more suburbs" />
          </ListBoxLoadMoreItem>
        </ListBox>
      </Select.Popover>
    </Select>
  );
};

export const AsyncLoading: Story = {
  render: (args) => <AsyncSelect {...args} />
};
