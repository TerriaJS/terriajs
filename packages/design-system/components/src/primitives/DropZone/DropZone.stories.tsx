import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileUploadIcon } from "@terria/design-system-icons";
import { useState } from "react";
import { DropZone, type DropZoneProps } from ".";
import { Button } from "../Button";
import { FileTrigger } from "../FileTrigger";
import "./drop-zone.stories.css";

const meta = {
  title: "Example/DropZone",
  component: DropZone,
  subcomponents: { "DropZone.Label": DropZone.Label },
  // Its props are React Aria's, which the docs don't list, so the controls
  // are listed here
  args: { isDisabled: false },
  argTypes: {
    isDisabled: {
      control: "boolean",
      description: "Takes no drops and can't be focused",
      table: { type: { summary: "boolean" } }
    },
    getDropOperation: {
      control: false,
      description:
        "Decides what it accepts from the dragged types and the allowed operations: copy, move, link or cancel",
      table: {
        type: {
          summary:
            "(types: DragTypes, allowedOperations: DropOperation[]) => DropOperation"
        }
      }
    },
    onDrop: {
      action: "drop",
      description: "Called with the dropped items",
      table: { type: { summary: "(event: DropEvent) => void" } }
    },
    onDropEnter: {
      action: "dropEnter",
      description: "Called when something is dragged in",
      table: { type: { summary: "(event: DropEnterEvent) => void" } }
    },
    onDropExit: {
      action: "dropExit",
      description: "Called when it's dragged out again",
      table: { type: { summary: "(event: DropExitEvent) => void" } }
    }
  }
} satisfies Meta<typeof DropZone>;

export default meta;
type Story = StoryObj<typeof meta>;

type DropItem = Parameters<
  NonNullable<DropZoneProps["onDrop"]>
>[0]["items"][number];

// A dropped item's name: a file's name, or a dropped link or text
const itemName = async (item: DropItem): Promise<string> => {
  if (item.kind === "file") return item.name;
  if (item.kind === "text") {
    const type = item.types.has("text/uri-list")
      ? "text/uri-list"
      : "text/plain";
    return item.types.has(type) ? item.getText(type) : "Some data";
  }
  return item.name;
};

const AddDataStory = (args: Story["args"]): React.ReactElement => {
  const [names, setNames] = useState<string[]>([]);

  return (
    <DropZone
      {...args}
      className="drop-zone-story"
      onDrop={(event) => {
        void Promise.all(event.items.map(itemName)).then(setNames);
        args?.onDrop?.(event);
      }}
    >
      <FileUploadIcon aria-hidden size={24} />
      <DropZone.Label>
        {names.length > 0
          ? `Dropped: ${names.join(", ")}`
          : "Drop files or a link here to add them to the map"}
      </DropZone.Label>
      <FileTrigger
        allowsMultiple
        onSelect={(files) => {
          setNames(files ? [...files].map((file) => file.name) : []);
        }}
      >
        <Button size="sm" variant="secondary">
          Browse files
        </Button>
      </FileTrigger>
    </DropZone>
  );
};

/** Takes files, links or text dropped on it, or pasted into it after a
 * keyboard user focuses it, and passes them to onDrop. Its look comes from
 * usage: here dashed, turning primary while something is dragged over it
 * (data-drop-target). A FileTrigger inside offers the file picker too */
export const Default: Story = {
  render: AddDataStory
};

/** getDropOperation decides what it accepts: here only files */
export const FilesOnly: Story = {
  args: {
    getDropOperation: (types) => (types.has("Files") ? "copy" : "cancel")
  },
  render: AddDataStory
};

export const Disabled: Story = {
  args: { isDisabled: true },
  render: AddDataStory
};
