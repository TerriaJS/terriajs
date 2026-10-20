import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { Alert, type AlertStatus } from ".";

const renderAlert = (
  status: AlertStatus,
  indicator?: React.ReactNode
): ReturnType<typeof render> =>
  render(
    <Alert status={status}>
      <Alert.Indicator data-testid="indicator">{indicator}</Alert.Indicator>
      <Alert.Content>
        <Alert.Title>Layer failed to load</Alert.Title>
        <Alert.Description>Check the data source URL</Alert.Description>
      </Alert.Content>
    </Alert>
  );

describe("Alert", () => {
  it("shows the title and description", async () => {
    const screen = await renderAlert("danger");

    await expect
      .element(screen.getByText("Layer failed to load"))
      .toBeVisible();
    await expect
      .element(screen.getByText("Check the data source URL"))
      .toBeVisible();
  });

  it.each<[AlertStatus, string]>([
    ["default", "lucide-circle-alert"],
    ["accent", "lucide-circle-alert"],
    ["success", "lucide-check"],
    ["warning", "lucide-triangle-alert"],
    ["danger", "lucide-circle-alert"]
  ])("shows the %s icon, hidden from screen readers", async (status, icon) => {
    const screen = await renderAlert(status);
    const indicator = screen.getByTestId("indicator");

    await expect.element(indicator).toHaveAttribute("aria-hidden", "true");
    expect(indicator.element().querySelector(`svg.${icon}`)).not.toBeNull();
  });

  it("uses a custom icon instead of the status icon", async () => {
    const screen = await renderAlert("success", <span>🗺️</span>);

    await expect
      .element(screen.getByTestId("indicator"))
      .toHaveTextContent("🗺️");
    expect(
      screen.getByTestId("indicator").element().querySelector("svg")
    ).toBeNull();
  });

  it("lets each part render a custom element that keeps its props", async () => {
    const screen = await render(
      <Alert status="success">
        <Alert.Content>
          <Alert.Title
            render={(props) => <p {...props} className="custom-title" />}
          >
            Layer added
          </Alert.Title>
        </Alert.Content>
      </Alert>
    );

    const title = screen.getByText("Layer added");
    await expect.element(title).toHaveClass("custom-title");
    await expect.element(title).toHaveAttribute("data-tds", "alert-title");
  });
});

// React 18 drops `ref` from plain function components; each part forwards it
describe("Alert refs", () => {
  it("reaches each part's element", async () => {
    const refs = {
      root: createRef<HTMLDivElement>(),
      indicator: createRef<HTMLDivElement>(),
      content: createRef<HTMLDivElement>(),
      title: createRef<HTMLParagraphElement>(),
      description: createRef<HTMLSpanElement>()
    };
    await render(
      <Alert ref={refs.root}>
        <Alert.Indicator ref={refs.indicator} />
        <Alert.Content ref={refs.content}>
          <Alert.Title ref={refs.title}>Layer added</Alert.Title>
          <Alert.Description ref={refs.description}>
            On the map
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );

    expect(refs.root.current?.getAttribute("data-tds")).toBe("alert");
    expect(refs.indicator.current?.getAttribute("data-tds")).toBe(
      "alert-indicator"
    );
    expect(refs.content.current?.getAttribute("data-tds")).toBe(
      "alert-content"
    );
    expect(refs.title.current?.getAttribute("data-tds")).toBe("alert-title");
    expect(refs.description.current?.getAttribute("data-tds")).toBe(
      "alert-description"
    );
  });
});
