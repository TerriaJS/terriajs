import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { MapPinIcon } from "@terria/design-system-icons";
import { focusVisible, hover, press, snap } from "../../../visual";
import { Button } from "../../Button";
import { Alert, type AlertStatus } from "..";

const MESSAGES: Record<AlertStatus, [string, string, string]> = {
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

const STATUSES = Object.keys(MESSAGES) as AlertStatus[];

const alert = (status: AlertStatus): React.ReactElement => {
  const [title, description, action] = MESSAGES[status];
  return (
    <Alert status={status}>
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
};

describe.each(STATUSES)("Alert %s", (status) => {
  it("default", async () => {
    await render(alert(status));
    await snap();
  });

  // The action takes the status's colours, and its hover too
  it("action hovered", async () => {
    const screen = await render(alert(status));
    await hover(screen.getByRole("button"));
    await snap();
  });

  it("action focused", async () => {
    const screen = await render(alert(status));
    await focusVisible(screen.getByRole("button"));
    await snap();
  });

  it("action pressed", async () => {
    const screen = await render(alert(status));
    await press(screen.getByRole("button"));
    await snap();
  });
});

describe("Alert", () => {
  it("title only", async () => {
    await render(
      <Alert status="success">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Layer added to the map</Alert.Title>
        </Alert.Content>
      </Alert>
    );
    await snap();
  });

  it("custom indicator", async () => {
    await render(
      <Alert status="accent">
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
    );
    await snap();
  });

  it("long text", async () => {
    await render(
      <Alert status="warning">
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
    );
    await snap();
  });
});
