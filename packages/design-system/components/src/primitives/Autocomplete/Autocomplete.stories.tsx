import type { Meta, StoryObj } from "@storybook/react-vite";
import { MapIcon, WorldIcon, WorldMapIcon } from "@terria/design-system-icons";
import { useFilter } from "react-aria/useFilter";
import { Autocomplete, AutocompleteRoot, type AutocompleteProps } from ".";
import { Description, FieldError, Label } from "../Field";
import { Header } from "../Header";
import { ListBox } from "../ListBox";
import { SearchField } from "../SearchField";
import { Separator } from "../Separator";
import { Tag, TagGroup } from "../TagGroup";
import { figmaDesign } from "../../figma";
import "./autocomplete.stories.css";

const STATES = [
  "New South Wales",
  "Victoria",
  "Queensland",
  "Western Australia",
  "South Australia",
  "Tasmania",
  "Australian Capital Territory",
  "Northern Territory"
].map((name) => ({ id: name.toLowerCase().replaceAll(" ", "-"), name }));

const options = (items: { id: string; name: string }[]): React.ReactNode =>
  items.map((item) => (
    <ListBox.Item key={item.id} id={item.id} textValue={item.name}>
      {item.name}
      <ListBox.ItemIndicator />
    </ListBox.Item>
  ));

// The design's autocomplete: the field with its value, clear button and
// chevron, and the popover's search field above the list. Called as a
// function, not rendered as a component, so a story's code shows the markup
// it returns
const autocomplete = (
  props: AutocompleteProps<object, "single" | "multiple">,
  contains: (text: string, filter: string) => boolean,
  {
    label = "State",
    clearButton = true,
    value = <Autocomplete.Value />,
    list = options(STATES),
    after
  }: {
    label?: string;
    clearButton?: boolean;
    value?: React.ReactNode;
    list?: React.ReactNode;
    after?: React.ReactNode;
  } = {}
): React.ReactElement => (
  <Autocomplete
    placeholder="Select one"
    className="autocomplete-stories-field"
    {...props}
  >
    <Label>{label}</Label>
    <Autocomplete.Trigger>
      {value}
      {clearButton && <Autocomplete.ClearButton />}
      <Autocomplete.Indicator />
    </Autocomplete.Trigger>
    <Autocomplete.Popover>
      <Autocomplete.Filter filter={contains}>
        {/* eslint-disable-next-line jsx-a11y/no-autofocus -- Focus moves into the search field as the user opens the list */}
        <SearchField autoFocus aria-label={`Search ${label.toLowerCase()}`}>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <ListBox renderEmptyState={() => "No results found"}>{list}</ListBox>
      </Autocomplete.Filter>
    </Autocomplete.Popover>
    {after}
  </Autocomplete>
);

const meta = {
  title: "Example/Autocomplete",
  component: AutocompleteRoot,
  parameters: {
    ...figmaDesign("Autocomplete"),
    docs: {
      description: {
        component:
          "A select whose list is searched: pressing the field opens a popover with a search field above the options, and typing narrows them. Use it in place of a Select when there are too many options to scan, such as choosing a layer or a region from a long catalogue. It can hold one choice or several, shown as tags, and the clear button empties it without opening the list. When the answer can be anything typed rather than one of a set, use a TextField or SearchField."
      }
    }
  },
  subcomponents: {
    "Autocomplete.Trigger": Autocomplete.Trigger,
    "Autocomplete.Value": Autocomplete.Value,
    "Autocomplete.ClearButton": Autocomplete.ClearButton,
    "Autocomplete.Indicator": Autocomplete.Indicator,
    "Autocomplete.Popover": Autocomplete.Popover,
    "Autocomplete.Filter": Autocomplete.Filter
  },
  args: { variant: "primary", fullWidth: false },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary"] },
    // Its value props are React Aria's, which the docs don't list, so their
    // controls are listed here
    selectionMode: {
      control: "inline-radio",
      options: ["single", "multiple"],
      description: "One choice, or several",
      table: { type: { summary: '"single" | "multiple"' } }
    },
    isInvalid: {
      control: "boolean",
      description: "Shows the FieldError and marks the field invalid",
      table: { type: { summary: "boolean" } }
    },
    isDisabled: {
      control: "boolean",
      description: "Can't be opened or changed",
      table: { type: { summary: "boolean" } }
    },
    onChange: {
      action: "change",
      description: "Called with the chosen key, or keys",
      table: { type: { summary: "(value: Key | Key[] | null) => void" } }
    }
  },
  render: function Render(args) {
    const { contains } = useFilter({ sensitivity: "base" });
    return autocomplete(args, contains, { clearButton: false });
  }
} satisfies Meta<typeof AutocompleteRoot>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Press the field to search the states; type to narrow them */
export const Default: Story = {};

/** Empties the field without opening the list */
export const WithClearButton: Story = {
  args: { defaultValue: "victoria" },
  render: function Render(args) {
    const { contains } = useFilter({ sensitivity: "base" });
    return autocomplete(args, contains);
  }
};

/** Several choices, shown as tags; each tag's cross removes it */
export const MultipleSelect: Story = {
  args: {
    selectionMode: "multiple",
    placeholder: "Select states",
    defaultValue: ["victoria", "queensland", "tasmania"]
  },
  render: function Render(args) {
    const { contains } = useFilter({ sensitivity: "base" });
    return autocomplete(args, contains, {
      label: "States",
      value: (
        <Autocomplete.Value>
          {({ defaultChildren, isPlaceholder, state }) =>
            isPlaceholder ? (
              defaultChildren
            ) : (
              <TagGroup
                aria-label="Chosen states"
                size="sm"
                onRemove={(keys) => {
                  state.setValue(
                    state.selectedItems
                      .map((item) => item.key)
                      .filter((key) => !keys.has(key))
                  );
                }}
              >
                <TagGroup.List>
                  {state.selectedItems.map((item) => (
                    <Tag key={item.key} id={item.key}>
                      {item.textValue}
                      {/* Backspace or Delete removes the focused tag, so the
                          tags take one Tab stop in the field */}
                      <Tag.RemoveButton />
                    </Tag>
                  ))}
                </TagGroup.List>
              </TagGroup>
            )
          }
        </Autocomplete.Value>
      )
    });
  }
};

/** Options with an icon and a description */
export const WithItemDescriptions: Story = {
  args: { placeholder: "Select a base map" },
  render: function Render(args) {
    const { contains } = useFilter({ sensitivity: "base" });
    const maps = [
      {
        id: "osm",
        name: "OpenStreetMap",
        note: "Streets and places",
        Icon: MapIcon
      },
      {
        id: "satellite",
        name: "Satellite",
        note: "Aerial imagery",
        Icon: WorldIcon
      },
      {
        id: "terrain",
        name: "Terrain",
        note: "Elevation shaded relief",
        Icon: WorldMapIcon
      }
    ];
    return autocomplete(args, contains, {
      label: "Base map",
      list: maps.map(({ id, name, note, Icon }) => (
        <ListBox.Item key={id} id={id} textValue={name}>
          <Icon aria-hidden size={16} />
          <div className="autocomplete-stories-option">
            <Label>{name}</Label>
            <Description>{note}</Description>
          </div>
          <ListBox.ItemIndicator />
        </ListBox.Item>
      ))
    });
  }
};

/** Options grouped under headings */
export const WithSections: Story = {
  args: { placeholder: "Select a city" },
  render: function Render(args) {
    const { contains } = useFilter({ sensitivity: "base" });
    return autocomplete(args, contains, {
      label: "City",
      list: (
        <>
          <ListBox.Section>
            <Header>Australia</Header>
            {options([
              { id: "sydney", name: "Sydney" },
              { id: "melbourne", name: "Melbourne" },
              { id: "brisbane", name: "Brisbane" }
            ])}
          </ListBox.Section>
          <Separator />
          <ListBox.Section>
            <Header>New Zealand</Header>
            {options([
              { id: "auckland", name: "Auckland" },
              { id: "wellington", name: "Wellington" }
            ])}
          </ListBox.Section>
        </>
      )
    });
  }
};

/** Options that can't be chosen are skipped */
export const WithDisabledOptions: Story = {
  args: { disabledKeys: ["tasmania", "northern-territory"] }
};

/** A description below the field */
export const WithDescription: Story = {
  render: function Render(args) {
    const { contains } = useFilter({ sensitivity: "base" });
    return autocomplete(args, contains, {
      after: <Description>Select your state of residence</Description>
    });
  }
};

export const Variants: Story = {
  render: function Render(args) {
    const { contains } = useFilter({ sensitivity: "base" });
    return (
      <div className="autocomplete-stories-stack">
        {(["primary", "secondary"] as const).map((variant) => (
          <div key={variant}>
            {autocomplete({ ...args, variant }, contains, {
              label: variant === "primary" ? "Primary" : "Secondary"
            })}
          </div>
        ))}
      </div>
    );
  }
};

/** Fills its container */
export const FullWidth: Story = {
  args: { fullWidth: true },
  render: function Render(args) {
    const { contains } = useFilter({ sensitivity: "base" });
    return (
      <div className="autocomplete-stories-wide">
        {autocomplete({ ...args, className: undefined }, contains)}
      </div>
    );
  }
};

export const Invalid: Story = {
  args: { isInvalid: true },
  render: function Render(args) {
    const { contains } = useFilter({ sensitivity: "base" });
    return autocomplete(args, contains, {
      after: <FieldError>Select a state</FieldError>
    });
  }
};

export const Disabled: Story = {
  args: { isDisabled: true, defaultValue: "victoria" }
};
