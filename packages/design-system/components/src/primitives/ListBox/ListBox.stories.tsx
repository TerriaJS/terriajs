import type { Meta, StoryObj } from "@storybook/react-vite";
import { ListLayout, Virtualizer } from "react-aria-components/Virtualizer";
import { fn } from "storybook/test";

import {
  MapIcon,
  TrashIcon,
  WorldIcon,
  WorldMapIcon
} from "@terria/design-system-icons";
import { Description, Label } from "../Field";
import { Header } from "../Header";
import { Separator } from "../Separator";
import { ListBox, ListBoxItem, ListBoxItemIndicator, ListBoxSection } from ".";
import { figmaDesign } from "../../figma";

const meta = {
  title: "Example/ListBox",
  component: ListBox,
  parameters: figmaDesign("ListBox"),
  subcomponents: { ListBoxItem, ListBoxItemIndicator, ListBoxSection },
  args: { "aria-label": "Base map" },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 220 }}>
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof ListBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { selectionMode: "single" },
  render: (args) => (
    <ListBox {...args}>
      <ListBox.Item textValue="OpenStreetMap">OpenStreetMap</ListBox.Item>
      <ListBox.Item textValue="Satellite">Satellite</ListBox.Item>
      <ListBox.Item textValue="Terrain">Terrain</ListBox.Item>
    </ListBox>
  )
};

export const SingleSelection: Story = {
  args: { selectionMode: "single", defaultSelectedKeys: ["satellite"] },
  render: (args) => (
    <ListBox {...args}>
      {["OpenStreetMap", "Satellite", "Terrain"].map((name) => (
        <ListBox.Item key={name} id={name.toLowerCase()} textValue={name}>
          {name}
          <ListBox.ItemIndicator />
        </ListBox.Item>
      ))}
    </ListBox>
  )
};

const titleStyle = { display: "flex", flexDirection: "column" } as const;

export const WithDescriptions: Story = {
  args: { selectionMode: "single", defaultSelectedKeys: ["satellite"] },
  render: (args) => (
    <ListBox {...args}>
      <ListBox.Item id="osm" textValue="OpenStreetMap">
        <MapIcon aria-hidden size={20} />
        <div style={titleStyle}>
          <Label>OpenStreetMap</Label>
          <Description>Streets and places</Description>
        </div>
        <ListBox.ItemIndicator />
      </ListBox.Item>
      <ListBox.Item id="satellite" textValue="Satellite">
        <WorldIcon aria-hidden size={20} />
        <div style={titleStyle}>
          <Label>Satellite</Label>
          <Description>Aerial imagery</Description>
        </div>
        <ListBox.ItemIndicator />
      </ListBox.Item>
      <ListBox.Item id="terrain" textValue="Terrain">
        <WorldMapIcon aria-hidden size={20} />
        <div style={titleStyle}>
          <Label>Terrain</Label>
          <Description>Elevation shaded relief</Description>
        </div>
        <ListBox.ItemIndicator />
      </ListBox.Item>
    </ListBox>
  )
};

export const Danger: Story = {
  args: { "aria-label": "Layer actions", onAction: fn() },
  render: (args) => (
    <ListBox {...args}>
      <ListBox.Item textValue="Zoom to layer">
        <MapIcon aria-hidden size={20} />
        <div style={titleStyle}>
          <Label>Zoom to layer</Label>
          <Description>Fit the map to its extent</Description>
        </div>
      </ListBox.Item>
      <ListBox.Item textValue="Remove layer" variant="danger">
        <TrashIcon aria-hidden size={20} />
        <div style={titleStyle}>
          <Label>Remove layer</Label>
          <Description>Removes it from the workbench</Description>
        </div>
      </ListBox.Item>
    </ListBox>
  )
};

export const Sections: Story = {
  args: { "aria-label": "Layers", onAction: fn() },
  parameters: {
    // A Separator between sections is part of the API; axe only allows
    // options and groups in a listbox
    a11y: {
      config: { rules: [{ id: "aria-required-children", enabled: false }] }
    }
  },
  render: (args) => (
    <ListBox {...args}>
      <ListBox.Section>
        <Header>Imagery</Header>
        <ListBox.Item>Satellite</ListBox.Item>
        <ListBox.Item>Aerial</ListBox.Item>
      </ListBox.Section>
      <Separator />
      <ListBox.Section>
        <Header>Danger zone</Header>
        <ListBox.Item variant="danger">Remove all layers</ListBox.Item>
      </ListBox.Section>
    </ListBox>
  )
};

export const Disabled: Story = {
  args: { selectionMode: "single", disabledKeys: ["terrain"] },
  render: (args) => (
    <ListBox {...args}>
      <ListBox.Item id="osm">OpenStreetMap</ListBox.Item>
      <ListBox.Item id="terrain">Terrain</ListBox.Item>
    </ListBox>
  )
};

const suburbs = Array.from({ length: 5000 }, (_, i) => ({
  id: i,
  name: `Suburb ${String(i + 1)}`
}));

// Only the rows in view are rendered, so long lists stay fast
export const Virtualized: Story = {
  args: { "aria-label": "Suburbs", selectionMode: "multiple" },
  render: (args) => (
    <Virtualizer layout={ListLayout} layoutOptions={{ rowHeight: 36 }}>
      <ListBox
        {...args}
        items={suburbs}
        style={{ blockSize: 300, overflow: "auto" }}
      >
        {(suburb) => (
          <ListBox.Item id={suburb.id} textValue={suburb.name}>
            {suburb.name}
            <ListBox.ItemIndicator />
          </ListBox.Item>
        )}
      </ListBox>
    </Virtualizer>
  )
};
