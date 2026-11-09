import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  CircleChevronRightIcon,
  CopyIcon,
  DotsIcon,
  EditIcon,
  EyeClosedIcon,
  EyeIcon,
  LinkIcon,
  ShareIcon,
  SquarePlusIcon,
  TrashIcon
} from "@terria/design-system-icons";
import { useState, type ReactNode } from "react";
import type { Selection } from "react-aria-components";
import { fn } from "storybook/test";
import { Button } from "../Button";
import { Description, Label } from "../Field";
import { Header } from "../Header";
import { Kbd } from "../Kbd";
import { Separator } from "../Separator";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownPopover,
  DropdownSection,
  DropdownSubmenuIndicator,
  DropdownSubmenuTrigger,
  type DropdownPopoverProps,
  type DropdownProps
} from ".";
import { figmaDesign } from "../../figma";
import "./dropdown.stories.css";

const meta = {
  title: "Example/Dropdown",
  component: Dropdown,
  parameters: figmaDesign("Dropdown"),
  subcomponents: {
    DropdownPopover,
    DropdownMenu,
    DropdownSection,
    DropdownItem,
    DropdownSubmenuTrigger,
    DropdownSubmenuIndicator
  },
  // Each story renders its own trigger and menu
  args: { children: null }
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Actions in sections, each with an icon and a description, and a danger
 * zone below a separator */
export const Default: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <Button variant="secondary">Actions</Button>
      <Dropdown.Popover>
        <Dropdown.Menu onAction={fn()}>
          <Dropdown.Section>
            <Header>Actions</Header>
            <Dropdown.Item id="new" textValue="New file">
              <SquarePlusIcon aria-hidden size={16} />
              <div className="dropdown-stories-text">
                <Label>New file</Label>
                <Description>Create a new file</Description>
              </div>
            </Dropdown.Item>
            <Dropdown.Item id="copy" textValue="Copy link">
              <CopyIcon aria-hidden size={16} />
              <div className="dropdown-stories-text">
                <Label>Copy link</Label>
                <Description>Copy the file link</Description>
              </div>
            </Dropdown.Item>
            <Dropdown.Item id="edit" textValue="Edit file">
              <EditIcon aria-hidden size={16} />
              <div className="dropdown-stories-text">
                <Label>Edit file</Label>
                <Description>Make changes</Description>
              </div>
            </Dropdown.Item>
          </Dropdown.Section>
          <Separator />
          <Dropdown.Section>
            <Header>Danger zone</Header>
            <Dropdown.Item id="delete" textValue="Delete file" variant="danger">
              <TrashIcon aria-hidden size={16} />
              <div className="dropdown-stories-text">
                <Label>Delete file</Label>
                <Description>Move to trash</Description>
              </div>
            </Dropdown.Item>
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
};

type ChoiceMenuProps = DropdownProps & {
  label: string;
  names: string[];
  selectionMode: "single" | "multiple";
  initial: string[];
  indicator?: ReactNode;
};

// The menu unmounts each time it closes, so it keeps its selection only when
// it's controlled: the selection lives in state, as it would in an app
const ChoiceMenu = ({
  label,
  names,
  selectionMode,
  initial,
  indicator = <Dropdown.ItemIndicator />,
  ...props
}: ChoiceMenuProps): React.ReactElement => {
  const [selected, setSelected] = useState<Selection>(() => new Set(initial));

  return (
    <Dropdown {...props}>
      <Button variant="secondary">{label}</Button>
      <Dropdown.Popover>
        <Dropdown.Menu
          selectionMode={selectionMode}
          selectedKeys={selected}
          onSelectionChange={setSelected}
        >
          {names.map((name) => (
            <Dropdown.Item key={name} id={name.toLowerCase()} textValue={name}>
              {indicator}
              {name}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
};

/** Picks one value; the indicator marks it. The menu keeps the choice only
 * with `selectedKeys` and `onSelectionChange`: it unmounts when it closes */
export const SingleSelection: Story = {
  render: (args) => (
    <ChoiceMenu
      {...args}
      label="Base map"
      names={["OpenStreetMap", "Satellite", "Terrain"]}
      selectionMode="single"
      initial={["satellite"]}
    />
  )
};

/** A dot marks the one chosen value, where a checkmark reads as "on" */
export const DotIndicator: Story = {
  render: (args) => (
    <ChoiceMenu
      {...args}
      label="Units"
      names={["Metric", "Imperial"]}
      selectionMode="single"
      initial={["metric"]}
      indicator={<Dropdown.ItemIndicator type="dot" />}
    />
  )
};

/** The indicator draws anything from whether its item is selected: here
 * whether a layer shows on the map */
export const CustomIndicator: Story = {
  render: (args) => (
    <ChoiceMenu
      {...args}
      label="Layers"
      names={["Roads", "Labels", "Boundaries"]}
      selectionMode="multiple"
      initial={["roads"]}
      indicator={
        <Dropdown.ItemIndicator>
          {({ isSelected }) =>
            isSelected ? <EyeIcon size={16} /> : <EyeClosedIcon size={16} />
          }
        </Dropdown.ItemIndicator>
      }
    />
  )
};

type StyleOption = { id: string; name: string; key: string };

const TEXT_STYLES: StyleOption[] = [
  { id: "bold", name: "Bold", key: "B" },
  { id: "italic", name: "Italic", key: "I" },
  { id: "underline", name: "Underline", key: "U" }
];

const ALIGNMENTS: StyleOption[] = [
  { id: "left", name: "Left", key: "A" },
  { id: "center", name: "Center", key: "H" },
  { id: "right", name: "Right", key: "D" }
];

const StyleItem = ({
  option,
  modifier,
  indicator
}: {
  option: StyleOption;
  modifier: "command" | "option";
  indicator: ReactNode;
}): React.ReactElement => (
  <Dropdown.Item id={option.id} textValue={option.name}>
    {indicator}
    {option.name}
    <Kbd variant="light">
      <Kbd.Abbr keyValue={modifier} />
      <Kbd.Content>{option.key}</Kbd.Content>
    </Kbd>
  </Dropdown.Item>
);

// Each section chooses on its own: several text styles, one alignment
const StylesMenu = (props: DropdownProps): React.ReactElement => {
  const [styles, setStyles] = useState<Selection>(
    () => new Set(["bold", "italic"])
  );
  const [alignment, setAlignment] = useState<Selection>(
    () => new Set(["left"])
  );

  return (
    <Dropdown {...props}>
      <Button variant="secondary">Styles</Button>
      <Dropdown.Popover>
        <Dropdown.Menu>
          <Dropdown.Section
            selectionMode="multiple"
            selectedKeys={styles}
            onSelectionChange={setStyles}
          >
            <Header>Text Style</Header>
            {TEXT_STYLES.map((option) => (
              <StyleItem
                key={option.id}
                option={option}
                modifier="command"
                indicator={<Dropdown.ItemIndicator />}
              />
            ))}
          </Dropdown.Section>
          <Separator />
          <Dropdown.Section
            selectionMode="single"
            selectedKeys={alignment}
            onSelectionChange={setAlignment}
          >
            <Header>Text Alignment</Header>
            {ALIGNMENTS.map((option) => (
              <StyleItem
                key={option.id}
                option={option}
                modifier="option"
                indicator={<Dropdown.ItemIndicator type="dot" />}
              />
            ))}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
};

/** Each section selects on its own: text styles take several, a checkmark
 * on each; the alignment takes one, marked by a dot */
export const SectionSelection: Story = {
  render: (args) => <StylesMenu {...args} />
};

/** Picks several values; the menu stays open while choosing */
export const MultipleSelection: Story = {
  render: (args) => (
    <ChoiceMenu
      {...args}
      label="Layers"
      names={["Roads", "Labels", "Boundaries"]}
      selectionMode="multiple"
      initial={["roads"]}
    />
  )
};

/** Keyboard shortcuts sit at the end of their items, which they describe */
export const WithShortcuts: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <Button variant="secondary">File</Button>
      <Dropdown.Popover>
        <Dropdown.Menu onAction={fn()}>
          <Dropdown.Item id="new" textValue="New file">
            <SquarePlusIcon aria-hidden size={16} />
            New file
            <Kbd variant="light">
              <Kbd.Abbr keyValue="command" />
              <Kbd.Content>N</Kbd.Content>
            </Kbd>
          </Dropdown.Item>
          <Dropdown.Item id="copy" textValue="Copy link">
            <CopyIcon aria-hidden size={16} />
            Copy link
            <Kbd variant="light">
              <Kbd.Abbr keyValue="command" />
              <Kbd.Content>L</Kbd.Content>
            </Kbd>
          </Dropdown.Item>
          <Separator />
          <Dropdown.Item id="delete" textValue="Delete file" variant="danger">
            <TrashIcon aria-hidden size={16} />
            Delete file
            <Kbd variant="light">
              <Kbd.Abbr keyValue="command" />
              <Kbd.Abbr keyValue="shift" />
              <Kbd.Content>K</Kbd.Content>
            </Kbd>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
};

/** An item opens a submenu: on hover, or with the right arrow key */
export const Submenu: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <Button variant="secondary">Share</Button>
      <Dropdown.Popover>
        <Dropdown.Menu onAction={fn()}>
          <Dropdown.Item id="copy" textValue="Copy link">
            <LinkIcon aria-hidden size={16} />
            Copy link
          </Dropdown.Item>
          <Dropdown.SubmenuTrigger>
            <Dropdown.Item id="other" textValue="Share to">
              <ShareIcon aria-hidden size={16} />
              Share to
              <Dropdown.SubmenuIndicator />
            </Dropdown.Item>
            <Dropdown.Popover>
              <Dropdown.Menu onAction={fn()}>
                <Dropdown.Item id="email">Email</Dropdown.Item>
                <Dropdown.Item id="teams">Teams</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown.SubmenuTrigger>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
};

/** The submenu indicator's chevron can be replaced: its children draw it */
export const CustomSubmenuIndicator: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <Button variant="secondary">Export</Button>
      <Dropdown.Popover>
        <Dropdown.Menu onAction={fn()}>
          <Dropdown.Item id="png">Image</Dropdown.Item>
          <Dropdown.SubmenuTrigger>
            <Dropdown.Item id="data" textValue="Data">
              Data
              <Dropdown.SubmenuIndicator>
                <CircleChevronRightIcon size={16} />
              </Dropdown.SubmenuIndicator>
            </Dropdown.Item>
            <Dropdown.Popover>
              <Dropdown.Menu onAction={fn()}>
                <Dropdown.Item id="csv">CSV</Dropdown.Item>
                <Dropdown.Item id="geojson">GeoJSON</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown.SubmenuTrigger>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
};

type Placement = NonNullable<DropdownPopoverProps["placement"]>;

// Every placement, by the side of the trigger the menu opens on. The second
// part aligns it along that side. start and end follow the reading
// direction; left and right don't
const PLACEMENT_SIDES: { side: string; placements: Placement[] }[] = [
  {
    side: "Top",
    placements: ["top left", "top start", "top", "top end", "top right"]
  },
  {
    side: "Bottom",
    placements: [
      "bottom left",
      "bottom start",
      "bottom",
      "bottom end",
      "bottom right"
    ]
  },
  { side: "Left", placements: ["left top", "left", "left bottom"] },
  { side: "Start", placements: ["start top", "start", "start bottom"] },
  { side: "Right", placements: ["right top", "right", "right bottom"] },
  { side: "End", placements: ["end top", "end", "end bottom"] }
];

/** Where the menu opens against its trigger: bottom start unless set. It
 * flips to the other side when there isn't room. start and end mirror in
 * right-to-left; left and right stay put */
export const Placements: Story = {
  render: (args) => (
    <div className="dropdown-stories-placements">
      {PLACEMENT_SIDES.map(({ side, placements }) => (
        <div key={side} className="dropdown-stories-placement-row">
          <span className="dropdown-stories-placement-side">{side}</span>
          {placements.map((placement) => (
            <Dropdown key={placement} {...args}>
              <Button variant="secondary">{placement}</Button>
              <Dropdown.Popover placement={placement}>
                <Dropdown.Menu onAction={fn()}>
                  <Dropdown.Item id="copy">Copy link</Dropdown.Item>
                  <Dropdown.Item id="edit">Edit file</Dropdown.Item>
                  <Dropdown.Item id="delete" variant="danger">
                    Delete file
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          ))}
        </div>
      ))}
    </div>
  )
};

/** Disabled items stay in the menu but can't be chosen */
export const DisabledItems: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <Button variant="secondary">Actions</Button>
      <Dropdown.Popover>
        <Dropdown.Menu onAction={fn()} disabledKeys={["delete"]}>
          <Dropdown.Item id="copy">Copy link</Dropdown.Item>
          <Dropdown.Item id="delete" variant="danger">
            Delete file
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
};

/** An icon button opens it too; the menu lines up with its end. Content
 * that isn't a button opens it through Dropdown.Trigger */
export const IconTrigger: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <Button variant="ghost" isIconOnly aria-label="More actions">
        <DotsIcon size={16} />
      </Button>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu onAction={fn()}>
          <Dropdown.Item id="rename">Rename</Dropdown.Item>
          <Dropdown.Item id="duplicate">Duplicate</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
};

// Open, for visual tests; Storybook leaves it closed until pressed
export const Opened: Story = {
  ...Default,
  tags: ["!autodocs"],
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Actions" }));
  }
};
