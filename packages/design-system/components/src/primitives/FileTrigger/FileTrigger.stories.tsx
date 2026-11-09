import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileUploadIcon } from "@terria/design-system-icons";
import { useState } from "react";
import { FileTrigger } from ".";
import { Button } from "../Button";

const meta = {
  title: "Example/FileTrigger",
  component: FileTrigger,
  // A re-export of React Aria's FileTrigger, which the docs can't read props
  // from, so the controls are listed here
  args: { allowsMultiple: false, acceptDirectory: false },
  argTypes: {
    acceptedFileTypes: {
      control: "object",
      description:
        "The file types the picker offers, as MIME types or extensions",
      table: { type: { summary: "string[]" } }
    },
    allowsMultiple: {
      control: "boolean",
      description: "Lets several files be chosen at once",
      table: { type: { summary: "boolean" } }
    },
    acceptDirectory: {
      control: "boolean",
      description: "Chooses a whole folder instead of files",
      table: { type: { summary: "boolean" } }
    },
    defaultCamera: {
      control: "inline-radio",
      options: ["user", "environment"],
      description: "On a phone, the camera to capture with",
      table: { type: { summary: '"user" | "environment"' } }
    },
    onSelect: {
      action: "select",
      description: "Called with the chosen files",
      table: { type: { summary: "(files: FileList | null) => void" } }
    }
  }
} satisfies Meta<typeof FileTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

// The names of the chosen files, under the trigger. Called as a function,
// not rendered as a component, so a story's code shows the markup
const chosen = (names: string[]): React.ReactElement => (
  <p>{names.length > 0 ? names.join(", ") : "No files chosen"}</p>
);

const UploadStory = (args: Story["args"]): React.ReactElement => {
  const [names, setNames] = useState<string[]>([]);

  return (
    <div className="tds-stack tds-items-start">
      <FileTrigger
        {...args}
        onSelect={(files) => {
          setNames(files ? [...files].map((file) => file.name) : []);
          args?.onSelect?.(files);
        }}
      >
        <Button variant="secondary">
          <FileUploadIcon aria-hidden />
          Upload data
        </Button>
      </FileTrigger>
      {chosen(names)}
    </div>
  );
};

/** Opens the file picker from its child, here a Button, and passes the
 * chosen files to onSelect. It has no look of its own: the child is the
 * button people see */
export const Default: Story = {
  render: UploadStory
};

/** acceptedFileTypes limits the picker; allowsMultiple lets several files be
 * chosen at once */
export const AcceptedTypes: Story = {
  args: {
    acceptedFileTypes: [".geojson", ".json", ".csv", ".kml", ".zip"],
    allowsMultiple: true
  },
  render: UploadStory
};

/** acceptDirectory chooses a whole folder */
export const Folder: Story = {
  args: { acceptDirectory: true },
  render: UploadStory
};
