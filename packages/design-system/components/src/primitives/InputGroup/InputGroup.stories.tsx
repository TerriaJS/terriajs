import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ChevronUpIcon,
  CopyIcon,
  EyeClosedIcon,
  EyeIcon,
  FileUploadIcon,
  LinkIcon,
  MapPinIcon,
  SearchIcon,
  SparklesIcon,
  StackPlusIcon,
  UserIcon,
  WorldIcon
} from "@terria/design-system-icons";
import { useState } from "react";
import { InputGroup } from ".";
import { Button } from "../Button";
import { Chip } from "../Chip";
import { Description, FieldError, Label, TextField } from "../Field";
import { Kbd } from "../Kbd";
import { Spinner } from "../Spinner";
import { Tooltip } from "../Tooltip";
import { figmaDesign } from "../../figma";
import "./input-group.stories.css";

const meta = {
  title: "Example/InputGroup",
  component: InputGroup,
  parameters: figmaDesign("InputGroup"),
  subcomponents: {
    "InputGroup.Prefix": InputGroup.Prefix,
    "InputGroup.Input": InputGroup.Input,
    "InputGroup.TextArea": InputGroup.TextArea,
    "InputGroup.Suffix": InputGroup.Suffix
  },
  args: { variant: "primary", isDivided: false, fullWidth: true },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary"] },
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"]
    }
  },
  decorators: [
    // parameters.wide gives a story room for a row of controls
    (Story, { parameters }) => (
      <div
        className={
          parameters["wide"] === true
            ? "input-group-stories-wide"
            : "input-group-stories-width"
        }
      >
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A prefix and a suffix around the input. In a TextField, the field's Label
 * names the input */
export const Default: Story = {
  render: (args) => (
    <TextField fullWidth>
      <Label>Price</Label>
      <InputGroup {...args}>
        <InputGroup.Prefix>$</InputGroup.Prefix>
        <InputGroup.Input placeholder="0.00" />
        <InputGroup.Suffix>AUD</InputGroup.Suffix>
      </InputGroup>
    </TextField>
  )
};

/** isDivided draws a line between each affix and the input */
export const Divided: Story = {
  args: { isDivided: true },
  render: Default.render
};

export const Secondary: Story = {
  args: { variant: "secondary" },
  render: Default.render
};

/** In a field, the group fills the field's width. On its own it keeps the
 * input's natural width, unless fullWidth stretches it */
export const FullWidth: Story = {
  parameters: { wide: true },
  render: (args) => (
    <div className="tds-stack tds-items-start">
      <TextField>
        <Label>In a field</Label>
        <InputGroup {...args}>
          <InputGroup.Prefix>$</InputGroup.Prefix>
          <InputGroup.Input placeholder="0.00" />
          <InputGroup.Suffix>AUD</InputGroup.Suffix>
        </InputGroup>
      </TextField>
      <TextField fullWidth>
        <Label>In a fullWidth field</Label>
        <InputGroup {...args}>
          <InputGroup.Prefix>$</InputGroup.Prefix>
          <InputGroup.Input placeholder="0.00" />
          <InputGroup.Suffix>AUD</InputGroup.Suffix>
        </InputGroup>
      </TextField>
      <InputGroup {...args} fullWidth={false}>
        <InputGroup.Prefix>$</InputGroup.Prefix>
        <InputGroup.Input aria-label="On its own" placeholder="On its own" />
        <InputGroup.Suffix>AUD</InputGroup.Suffix>
      </InputGroup>
      <InputGroup {...args} fullWidth>
        <InputGroup.Prefix>$</InputGroup.Prefix>
        <InputGroup.Input
          aria-label="On its own, fullWidth"
          placeholder="On its own, fullWidth"
        />
        <InputGroup.Suffix>AUD</InputGroup.Suffix>
      </InputGroup>
    </div>
  )
};

// ============================================================
// PREFIXES AND SUFFIXES
// ============================================================

export const IconPrefix: Story = {
  render: (args) => (
    <TextField fullWidth>
      <Label>Username</Label>
      <InputGroup {...args}>
        <InputGroup.Prefix>
          <UserIcon aria-hidden size={16} />
        </InputGroup.Prefix>
        <InputGroup.Input placeholder="jane.citizen" />
      </InputGroup>
      <Description>Shown on the maps you share</Description>
    </TextField>
  )
};

export const IconSuffix: Story = {
  render: (args) => (
    <TextField fullWidth>
      <Label>Location</Label>
      <InputGroup {...args}>
        <InputGroup.Input placeholder="Address or coordinates" />
        <InputGroup.Suffix>
          <MapPinIcon aria-hidden size={16} />
        </InputGroup.Suffix>
      </InputGroup>
      <Description>The map zooms to it</Description>
    </TextField>
  )
};

export const TextPrefix: Story = {
  render: (args) => (
    <TextField fullWidth>
      <Label>Server</Label>
      <InputGroup {...args}>
        <InputGroup.Prefix>https://</InputGroup.Prefix>
        <InputGroup.Input placeholder="example.com/wms" />
      </InputGroup>
    </TextField>
  )
};

export const TextSuffix: Story = {
  render: (args) => (
    <TextField fullWidth>
      <Label>Buffer distance</Label>
      <InputGroup {...args}>
        <InputGroup.Input placeholder="0" />
        <InputGroup.Suffix>km</InputGroup.Suffix>
      </InputGroup>
    </TextField>
  )
};

export const IconPrefixAndTextSuffix: Story = {
  render: (args) => (
    <TextField fullWidth>
      <Label>Website</Label>
      <InputGroup {...args}>
        <InputGroup.Prefix>
          <WorldIcon aria-hidden size={16} />
        </InputGroup.Prefix>
        <InputGroup.Input placeholder="terria" />
        <InputGroup.Suffix>.io</InputGroup.Suffix>
      </InputGroup>
    </TextField>
  )
};

/** A control in an affix takes the field's text color, not the muted one */
export const CopyButton: Story = {
  render: (args) => (
    <TextField
      fullWidth
      defaultValue="https://map.terria.io/#share=s-abc123"
      isReadOnly
    >
      <Label>Share link</Label>
      <InputGroup {...args}>
        <InputGroup.Prefix>
          <LinkIcon aria-hidden size={16} />
        </InputGroup.Prefix>
        <InputGroup.Input />
        <InputGroup.Suffix>
          <Button variant="ghost" size="sm" isIconOnly aria-label="Copy link">
            <CopyIcon aria-hidden size={16} />
          </Button>
        </InputGroup.Suffix>
      </InputGroup>
    </TextField>
  )
};

const PasswordStory = (args: Story["args"]): React.ReactElement => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TextField fullWidth type={isVisible ? "text" : "password"}>
      <Label>Password</Label>
      <InputGroup {...args}>
        <InputGroup.Input />
        <InputGroup.Suffix>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={isVisible ? "Hide password" : "Show password"}
            onPress={() => {
              setIsVisible((visible) => !visible);
            }}
          >
            {isVisible ? (
              <EyeClosedIcon aria-hidden size={16} />
            ) : (
              <EyeIcon aria-hidden size={16} />
            )}
          </Button>
        </InputGroup.Suffix>
      </InputGroup>
    </TextField>
  );
};

/** A button toggles between hiding and showing the password */
export const Password: Story = {
  render: PasswordStory
};

/** A Spinner while results load; the field's own label names the search */
export const Loading: Story = {
  render: (args) => (
    <TextField fullWidth defaultValue="Bridges">
      <Label>Search layers</Label>
      <InputGroup {...args}>
        <InputGroup.Prefix>
          <SearchIcon aria-hidden size={16} />
        </InputGroup.Prefix>
        <InputGroup.Input />
        <InputGroup.Suffix>
          <Spinner aria-label="Searching" color="current" size="sm" />
        </InputGroup.Suffix>
      </InputGroup>
    </TextField>
  )
};

/** The shortcut that focuses the field */
export const KeyboardShortcut: Story = {
  render: (args) => (
    <TextField fullWidth aria-label="Search the catalogue">
      <InputGroup {...args}>
        <InputGroup.Prefix>
          <SearchIcon aria-hidden size={16} />
        </InputGroup.Prefix>
        <InputGroup.Input placeholder="Search the catalogue" />
        <InputGroup.Suffix>
          <Kbd variant="default">
            <Kbd.Abbr keyValue="command" />
            <Kbd.Content>K</Kbd.Content>
          </Kbd>
        </InputGroup.Suffix>
      </InputGroup>
    </TextField>
  )
};

export const BadgeSuffix: Story = {
  render: (args) => (
    <TextField fullWidth>
      <Label>Workspace</Label>
      <InputGroup {...args}>
        <InputGroup.Input placeholder="My workspace" />
        <InputGroup.Suffix>
          <Chip size="md" color="accent" variant="soft">
            <Chip.Label>Pro</Chip.Label>
          </Chip>
        </InputGroup.Suffix>
      </InputGroup>
    </TextField>
  )
};

// ============================================================
// TEXT AREA
// ============================================================

const FeedbackStory = (args: Story["args"]): React.ReactElement => {
  const [feedback, setFeedback] = useState("");

  return (
    <TextField
      fullWidth
      isInvalid={feedback.length > 200}
      onChange={setFeedback}
    >
      <Label>Feedback</Label>
      <InputGroup {...args}>
        <InputGroup.Prefix>
          <UserIcon aria-hidden size={16} />
        </InputGroup.Prefix>
        <InputGroup.TextArea
          rows={4}
          placeholder="Tell us what you think of the map"
          value={feedback}
        />
      </InputGroup>
      <Description>{feedback.length}/200 characters</Description>
      <FieldError>Feedback must be 200 characters or fewer</FieldError>
    </TextField>
  );
};

/** InputGroup.TextArea in place of the Input: the affixes line up with its
 * first line */
export const TextArea: Story = {
  render: FeedbackStory
};

export const TextAreaWithButton: Story = {
  render: (args) => (
    <TextField fullWidth>
      <Label>Story description</Label>
      <InputGroup {...args}>
        <InputGroup.TextArea rows={3} placeholder="Describe this scene" />
        <InputGroup.Suffix>
          <Button variant="ghost" size="sm" isIconOnly aria-label="Copy">
            <CopyIcon aria-hidden size={16} />
          </Button>
        </InputGroup.Suffix>
      </InputGroup>
    </TextField>
  )
};

const ComposerStory = (args: Story["args"]): React.ReactElement => {
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);

  const send = (): void => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setPrompt("");
    }, 1000);
  };

  return (
    <TextField
      fullWidth
      aria-label="Prompt"
      value={prompt}
      onChange={setPrompt}
    >
      <InputGroup {...args}>
        <InputGroup.Prefix>
          <Button variant="outline" size="sm">
            <StackPlusIcon aria-hidden size={16} />
            Add layers
          </Button>
        </InputGroup.Prefix>
        <InputGroup.TextArea rows={4} placeholder="Ask about this map" />
        <InputGroup.Suffix>
          <Tooltip content="Upload a file">
            <Button variant="tertiary" size="sm" isIconOnly aria-label="Upload">
              <FileUploadIcon aria-hidden size={16} />
            </Button>
          </Tooltip>
          <Tooltip content="Add a link">
            <Button variant="tertiary" size="sm" isIconOnly aria-label="Link">
              <LinkIcon aria-hidden size={16} />
            </Button>
          </Tooltip>
          <span className="tds-row tds-ms-auto">
            <Tooltip content="Suggest a prompt">
              <Button variant="ghost" size="sm" isIconOnly aria-label="Suggest">
                <SparklesIcon aria-hidden size={16} />
              </Button>
            </Tooltip>
            <Tooltip content="Send">
              <Button
                size="sm"
                isIconOnly
                aria-label="Send"
                isDisabled={prompt.trim() === ""}
                isPending={isSending}
                pendingLabel="Sending"
                onPress={send}
              >
                <ChevronUpIcon aria-hidden size={16} />
              </Button>
            </Tooltip>
          </span>
        </InputGroup.Suffix>
      </InputGroup>
    </TextField>
  );
};

/** orientation="vertical" stacks the prefix above the text area and the
 * suffix below it, as rows of controls; tds-ms-auto pushes a group of them
 * to the end. Here the group has no visible label, so the field needs an
 * aria-label */
export const Composer: Story = {
  args: { orientation: "vertical" },
  parameters: { wide: true },
  render: ComposerStory
};

/** Vertical and divided: lines run across between the rows */
export const ComposerDivided: Story = {
  args: { orientation: "vertical", isDivided: true },
  parameters: { wide: true },
  render: ComposerStory
};

// ============================================================
// STATES
// ============================================================

export const Required: Story = {
  render: (args) => (
    <TextField fullWidth isRequired>
      <Label>Price</Label>
      <InputGroup {...args}>
        <InputGroup.Prefix>$</InputGroup.Prefix>
        <InputGroup.Input placeholder="0.00" />
        <InputGroup.Suffix>AUD</InputGroup.Suffix>
      </InputGroup>
    </TextField>
  )
};

/** The field's invalid state reaches the group through its input */
export const Invalid: Story = {
  render: (args) => (
    <TextField fullWidth isInvalid defaultValue="-5">
      <Label>Price</Label>
      <InputGroup {...args}>
        <InputGroup.Prefix>$</InputGroup.Prefix>
        <InputGroup.Input />
        <InputGroup.Suffix>AUD</InputGroup.Suffix>
      </InputGroup>
      <Description>Excluding GST</Description>
      <FieldError>The price can&apos;t be negative</FieldError>
    </TextField>
  )
};

export const Disabled: Story = {
  render: (args) => (
    <TextField fullWidth isDisabled>
      <Label>Price</Label>
      <InputGroup {...args}>
        <InputGroup.Prefix>$</InputGroup.Prefix>
        <InputGroup.Input placeholder="0.00" />
        <InputGroup.Suffix>AUD</InputGroup.Suffix>
      </InputGroup>
    </TextField>
  )
};
