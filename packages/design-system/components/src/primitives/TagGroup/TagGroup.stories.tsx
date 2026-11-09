import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  MapIcon,
  MapPinIcon,
  WorldIcon,
  WorldMapIcon
} from "@terria/design-system-icons";
import { useState } from "react";
import type { Key, Selection } from "react-aria-components";
import { Tag, TagGroup, TagGroupRoot, type TagGroupProps } from ".";
import { Description, ErrorMessage, Label } from "../Field";
import { figmaDesign } from "../../figma";
import "./tag-group.stories.css";

const LAYERS = ["Suburbs", "Schools", "Hospitals", "Bike paths"];

// A labelled group of tags. Called as a function, not rendered as a
// component, so a story's code shows the markup it returns
const tagGroup = (
  props: TagGroupProps,
  {
    label,
    description,
    tags = LAYERS.map((layer) => <Tag key={layer}>{layer}</Tag>)
  }: { label: string; description?: string; tags?: React.ReactNode }
): React.ReactElement => (
  <TagGroup {...props}>
    <Label>{label}</Label>
    <TagGroup.List>{tags}</TagGroup.List>
    {description && <Description>{description}</Description>}
  </TagGroup>
);

const meta = {
  title: "Example/TagGroup",
  component: TagGroupRoot,
  parameters: {
    ...figmaDesign("TagGroup"),
    docs: {
      description: {
        component:
          "A set of short labels a user can choose from, filter by, or remove, such as the layers shown on a map or the keywords on a dataset. Tags can be selected one or several at a time, and show a cross that removes them when the group has onRemove. Inside an Autocomplete, small tags show the choices made. For a single status or count that can't be pressed, use a Chip or a Badge."
      }
    }
  },
  subcomponents: {
    "TagGroup.List": TagGroup.List,
    Tag,
    "Tag.RemoveButton": Tag.RemoveButton
  },
  args: { size: "md", variant: "default", selectionMode: "single" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    variant: { control: "inline-radio", options: ["default", "surface"] },
    // Its selection props are React Aria's, which the docs don't list, so
    // their controls are listed here
    selectionMode: {
      control: "inline-radio",
      options: ["none", "single", "multiple"],
      description: "Whether tags can be selected, and how many",
      table: { type: { summary: '"none" | "single" | "multiple"' } }
    }
  },
  render: (args) =>
    tagGroup(args, {
      label: "Layers",
      tags: [
        { name: "Suburbs", Icon: MapIcon },
        { name: "Places", Icon: MapPinIcon },
        { name: "Imagery", Icon: WorldIcon },
        { name: "Boundaries", Icon: WorldMapIcon }
      ].map(({ name, Icon }) => (
        <Tag key={name} id={name}>
          <Icon aria-hidden />
          {name}
        </Tag>
      ))
    })
} satisfies Meta<typeof TagGroupRoot>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Tags with an icon before their text; press one to select it */
export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="tag-group-stories-stack">
      {tagGroup({ ...args, size: "sm" }, { label: "Small" })}
      {tagGroup({ ...args, size: "md" }, { label: "Medium" })}
      {tagGroup({ ...args, size: "lg" }, { label: "Large" })}
    </div>
  )
};

/** Default tags sit on the page; surface tags on a darker panel */
export const Variants: Story = {
  render: (args) => (
    <div className="tag-group-stories-stack">
      {tagGroup({ ...args, variant: "default" }, { label: "Default" })}
      {tagGroup({ ...args, variant: "surface" }, { label: "Surface" })}
    </div>
  )
};

export const Disabled: Story = {
  render: (args) => (
    <div className="tag-group-stories-stack">
      {tagGroup(args, {
        label: "Disabled tags",
        description: "Some tags are disabled",
        tags: LAYERS.map((layer, index) => (
          <Tag key={layer} isDisabled={index % 2 === 0}>
            {layer}
          </Tag>
        ))
      })}
      {tagGroup(
        { ...args, disabledKeys: ["Schools"] },
        {
          label: "Disabled keys",
          description: "Tags disabled through the group's disabledKeys",
          tags: LAYERS.map((layer) => (
            <Tag key={layer} id={layer}>
              {layer}
            </Tag>
          ))
        }
      )}
    </div>
  )
};

/** One tag at a time, or several */
export const SelectionModes: Story = {
  render: function Render(args) {
    const [one, setOne] = useState<Selection>(() => new Set(["Suburbs"]));
    const [several, setSeveral] = useState<Selection>(
      () => new Set(["Suburbs", "Schools"])
    );
    const tags = LAYERS.map((layer) => (
      <Tag key={layer} id={layer}>
        {layer}
      </Tag>
    ));
    return (
      <div className="tag-group-stories-stack">
        {tagGroup(
          {
            ...args,
            selectionMode: "single",
            selectedKeys: one,
            onSelectionChange: setOne
          },
          { label: "Single selection", description: "Choose one", tags }
        )}
        {tagGroup(
          {
            ...args,
            selectionMode: "multiple",
            selectedKeys: several,
            onSelectionChange: setSeveral
          },
          { label: "Multiple selection", description: "Choose any", tags }
        )}
      </div>
    );
  }
};

/** Shows an ErrorMessage while nothing is selected */
export const WithErrorMessage: Story = {
  render: function Render(args) {
    const [selected, setSelected] = useState<Selection>(() => new Set());
    const isInvalid = selected !== "all" && selected.size === 0;
    return (
      <TagGroup
        {...args}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
      >
        <Label>Layers</Label>
        <TagGroup.List>
          {LAYERS.map((layer) => (
            <Tag key={layer} id={layer}>
              {layer}
            </Tag>
          ))}
        </TagGroup.List>
        {isInvalid ? (
          <ErrorMessage>Select at least one layer</ErrorMessage>
        ) : (
          <Description>Shown on the map</Description>
        )}
      </TagGroup>
    );
  }
};

/** Each tag's cross removes it */
export const WithRemoveButton: Story = {
  args: { selectionMode: "none" },
  render: function Render(args) {
    const [layers, setLayers] = useState(LAYERS);
    return tagGroup(
      {
        ...args,
        onRemove: (keys: Set<Key>) => {
          setLayers(layers.filter((layer) => !keys.has(layer)));
        }
      },
      {
        label: "Layers on the map",
        tags: layers.map((layer) => (
          <Tag key={layer} id={layer}>
            {layer}
          </Tag>
        ))
      }
    );
  }
};
