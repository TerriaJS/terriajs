import { describe, expect, it, vi } from "vitest";
import { render, type RenderResult } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Breadcrumbs, type BreadcrumbsProps } from "..";

const renderTrail = (
  props: Partial<BreadcrumbsProps> = {}
): Promise<RenderResult> =>
  render(
    <Breadcrumbs {...props}>
      <Breadcrumbs.Item href="#home">Home</Breadcrumbs.Item>
      <Breadcrumbs.Item href="#catalogue">Catalogue</Breadcrumbs.Item>
      <Breadcrumbs.Item href="#transport">Transport</Breadcrumbs.Item>
    </Breadcrumbs>
  );

const separators = (container: HTMLElement): Element[] => [
  ...container.querySelectorAll('[data-tds="breadcrumbs-separator"]')
];

describe("Breadcrumbs", () => {
  it("is a navigation landmark named Breadcrumbs unless named otherwise", async () => {
    const screen = await renderTrail();
    await expect
      .element(screen.getByRole("navigation", { name: "Breadcrumbs" }))
      .toBeInTheDocument();

    const named = await renderTrail({ "aria-label": "Catalogue path" });
    await expect
      .element(named.getByRole("navigation", { name: "Catalogue path" }))
      .toBeInTheDocument();
  });

  it("links every item but the last, which is the current page", async () => {
    const screen = await renderTrail();

    await expect
      .element(screen.getByRole("link", { name: "Home" }))
      .toHaveAttribute("href", "#home");
    await expect
      .element(screen.getByText("Transport"))
      .toHaveAttribute("aria-current", "page");
  });

  it("puts a separator between items, not after the last", async () => {
    const screen = await renderTrail();

    expect(separators(screen.container)).toHaveLength(2);
    for (const separator of separators(screen.container)) {
      expect(separator.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("takes a custom separator", async () => {
    const screen = await renderTrail({ separator: "/" });

    expect(separators(screen.container).map((s) => s.textContent)).toEqual([
      "/",
      "/"
    ]);
  });

  it("calls onAction with the pressed item's id", async () => {
    const onAction = vi.fn();
    const screen = await render(
      <Breadcrumbs onAction={onAction}>
        <Breadcrumbs.Item id="root">Data catalogue</Breadcrumbs.Item>
        <Breadcrumbs.Item id="roads">Roads</Breadcrumbs.Item>
      </Breadcrumbs>
    );

    await userEvent.click(screen.getByText("Data catalogue"));

    expect(onAction).toHaveBeenCalledWith("root");
  });
});
