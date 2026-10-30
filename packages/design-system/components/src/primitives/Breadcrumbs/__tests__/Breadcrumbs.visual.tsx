import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { focusVisible, hover, press, snap } from "../../../visual";
import { Breadcrumbs } from "..";

const trail = (separator?: string): React.ReactElement => (
  <Breadcrumbs separator={separator}>
    <Breadcrumbs.Item href="#home">Home</Breadcrumbs.Item>
    <Breadcrumbs.Item href="#private" isDisabled>
      Private workspace
    </Breadcrumbs.Item>
    <Breadcrumbs.Item href="#components">Components</Breadcrumbs.Item>
    <Breadcrumbs.Item href="#breadcrumbs">Breadcrumbs</Breadcrumbs.Item>
  </Breadcrumbs>
);

describe("Breadcrumbs", () => {
  it("default", async () => {
    await render(trail());
    await snap();
  });

  it("link hovered", async () => {
    const screen = await render(trail());
    await hover(screen.getByRole("link", { name: "Home" }));
    await snap();
  });

  it("link focused", async () => {
    const screen = await render(trail());
    const link = screen.getByRole("link", { name: "Home" });
    await focusVisible(link);
    await expect.element(link).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("link hovered and focused", async () => {
    const screen = await render(trail());
    const link = screen.getByRole("link", { name: "Home" });
    await focusVisible(link);
    await hover(link);
    await expect.element(link).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("link pressed", async () => {
    const screen = await render(trail());
    const link = screen.getByRole("link", { name: "Components" });
    await press(link);
    await expect.element(link).toHaveAttribute("data-pressed");
    await snap();
  });

  it("current page hovered", async () => {
    const screen = await render(trail());
    await hover(screen.getByText("Breadcrumbs", { exact: true }));
    await snap();
  });

  it("disabled link hovered", async () => {
    const screen = await render(trail());
    await hover(screen.getByText("Private workspace"));
    await snap();
  });

  it("custom separator", async () => {
    await render(trail("/"));
    await snap();
  });

  it("without hrefs", async () => {
    await render(
      <Breadcrumbs aria-label="Catalogue path" onAction={() => undefined}>
        {["Data catalogue", "Transport", "Roads"].map((name) => (
          <Breadcrumbs.Item key={name} id={name}>
            {name}
          </Breadcrumbs.Item>
        ))}
      </Breadcrumbs>
    );
    await snap();
  });
});
