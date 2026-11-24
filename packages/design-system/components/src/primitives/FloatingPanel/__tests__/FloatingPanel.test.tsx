import { useState } from "react";
import { describe, expect, it } from "vitest";
import { page, userEvent, type Locator } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../../Button";
import { FloatingPanel } from "..";

// A map with a panel over it, opened from a button beside the map
const FeatureInfo = ({
  defaultOpen = false
}: {
  defaultOpen?: boolean;
}): React.ReactElement => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div style={{ position: "relative", inlineSize: 800, blockSize: 600 }}>
      <Button
        onPress={() => {
          setIsOpen(true);
        }}
      >
        Show feature
      </Button>
      <Button>Zoom in</Button>
      <FloatingPanel isOpen={isOpen} onOpenChange={setIsOpen}>
        <FloatingPanel.CloseTrigger />
        <FloatingPanel.Header>
          <FloatingPanel.Heading>Feature information</FloatingPanel.Heading>
        </FloatingPanel.Header>
        <FloatingPanel.Body>Population: 5,312,000</FloatingPanel.Body>
      </FloatingPanel>
    </div>
  );
};

const dialog = (): Locator =>
  page.getByRole("dialog", { name: "Feature information" });

describe("FloatingPanel", () => {
  it("shows a dialog named by its heading while open, and nothing when closed", async () => {
    const screen = await render(<FeatureInfo />);
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();

    await screen.getByRole("button", { name: "Show feature" }).click();

    await expect.element(dialog()).toBeVisible();
  });

  it("moves focus into itself when it opens", async () => {
    const screen = await render(<FeatureInfo />);

    await screen.getByRole("button", { name: "Show feature" }).click();

    await expect
      .poll(() => dialog().element().contains(document.activeElement))
      .toBe(true);
  });

  it("leaves the page around it usable while it's open", async () => {
    const screen = await render(<FeatureInfo defaultOpen />);
    const zoomIn = screen.getByRole("button", { name: "Zoom in" });

    expect(zoomIn.element().closest("[inert], [aria-hidden]")).toBeNull();
    await zoomIn.click();

    expect(document.activeElement).toBe(zoomIn.element());
    await expect.element(dialog()).toBeVisible();
  });

  it("closes from its close button", async () => {
    await render(<FeatureInfo defaultOpen />);

    await page.getByRole("button", { name: "Close" }).click();

    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape from inside it, giving focus back to what opened it", async () => {
    const screen = await render(<FeatureInfo />);
    const opener = screen.getByRole("button", { name: "Show feature" });
    await opener.click();
    await expect
      .poll(() => dialog().element().contains(document.activeElement))
      .toBe(true);

    await userEvent.keyboard("{Escape}");

    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(opener.element());
  });

  it("adds no landmarks to the page, however many are open", async () => {
    await render(
      <>
        {["Sydney", "Parramatta"].map((place) => (
          <FloatingPanel key={place} isOpen>
            <FloatingPanel.Header>
              <FloatingPanel.Heading>{place}</FloatingPanel.Heading>
            </FloatingPanel.Header>
            <FloatingPanel.Footer>
              <Button>Zoom to {place}</Button>
            </FloatingPanel.Footer>
          </FloatingPanel>
        ))}
      </>
    );

    expect(page.getByRole("banner").elements()).toHaveLength(0);
    expect(page.getByRole("contentinfo").elements()).toHaveLength(0);
  });

  const TwoPanels = (): React.ReactElement => (
    <div style={{ position: "relative", inlineSize: 800, blockSize: 600 }}>
      <FloatingPanel isOpen>
        <FloatingPanel.Heading>Feature information</FloatingPanel.Heading>
        <Button>Zoom to feature</Button>
      </FloatingPanel>
      <FloatingPanel isOpen>
        <FloatingPanel.Heading>Measure</FloatingPanel.Heading>
      </FloatingPanel>
    </div>
  );
  const zIndex = (name: string): number =>
    Number(
      getComputedStyle(page.getByRole("dialog", { name }).element()).zIndex
    );

  it("brings the panel last pressed in front of the others", async () => {
    await render(<TwoPanels />);

    await page.getByRole("button", { name: "Zoom to feature" }).click();

    expect(zIndex("Feature information")).toBeGreaterThan(zIndex("Measure"));
  });

  it("brings the panel focus moves into in front of the others", async () => {
    await render(<TwoPanels />);

    page.getByRole("button", { name: "Zoom to feature" }).element().focus();

    await expect
      .poll(() => zIndex("Feature information"))
      .toBeGreaterThan(zIndex("Measure"));
  });
});
