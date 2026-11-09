import type { Meta, StoryObj } from "@storybook/react-vite";

import { MapPinIcon } from "@terria/design-system-icons";
import { Button } from "../Button";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIndicator,
  AlertTitle,
  type AlertStatus
} from ".";
import { figmaDesign } from "../../figma";

const meta = {
  title: "Example/Alert",
  component: Alert,
  parameters: figmaDesign("Alert"),
  subcomponents: { AlertIndicator, AlertContent, AlertTitle, AlertDescription },
  // Each story renders its own content; this only satisfies the required arg
  args: { status: "default", children: null },
  argTypes: {
    status: {
      control: "inline-radio",
      options: ["default", "accent", "success", "warning", "danger"]
    }
  },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 460 }}>
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Alert {...args}>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>This is an alert</Alert.Title>
        <Alert.Description>Add description in this place</Alert.Description>
      </Alert.Content>
      <Button size="sm" variant="outline">
        Label
      </Button>
    </Alert>
  )
};

const messages: Record<AlertStatus, [string, string, string]> = {
  default: ["Map shared", "Anyone with the link can view it", "Copy link"],
  accent: [
    "New data available",
    "Census 2026 layers are in the catalogue",
    "Browse"
  ],
  success: ["Layer added", "Suburbs 2021 is on the map", "Zoom to"],
  warning: ["Large dataset", "This layer may load slowly on mobile", "Details"],
  danger: ["Layer failed to load", "Check the data source URL", "Retry"]
};

export const Statuses: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16 }}>
      {(Object.keys(messages) as AlertStatus[]).map((status) => {
        const [title, description, action] = messages[status];
        return (
          <Alert key={status} status={status}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{title}</Alert.Title>
              <Alert.Description>{description}</Alert.Description>
            </Alert.Content>
            <Button size="sm" variant="outline">
              {action}
            </Button>
          </Alert>
        );
      })}
    </div>
  )
};

export const TitleOnly: Story = {
  args: { status: "success" },
  render: (args) => (
    <Alert {...args}>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Layer added to the map</Alert.Title>
      </Alert.Content>
    </Alert>
  )
};

export const CustomIndicator: Story = {
  args: { status: "accent" },
  render: (args) => (
    <Alert {...args}>
      <Alert.Indicator>
        <MapPinIcon size={16} />
      </Alert.Indicator>
      <Alert.Content>
        <Alert.Title>Location found</Alert.Title>
        <Alert.Description>
          The map is centred on your position
        </Alert.Description>
      </Alert.Content>
    </Alert>
  )
};

export const LongText: Story = {
  args: { status: "warning" },
  render: (args) => (
    <Alert {...args}>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Some features are hidden at this zoom level</Alert.Title>
        <Alert.Description>
          Zoom in to see individual parcels. Above 1:50,000 the layer shows
          aggregated suburb boundaries so the map stays responsive.
        </Alert.Description>
      </Alert.Content>
      <Button size="sm" variant="outline">
        Zoom in
      </Button>
    </Alert>
  )
};
