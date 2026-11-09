import { describe, expect, it } from "vitest";
import { page, userEvent, type Locator } from "vitest/browser";
import { render } from "vitest-browser-react";
import { FileUploadIcon } from "@terria/design-system-icons";
import { Button } from "../../Button";
import { FileTrigger } from "../../FileTrigger";
import { hover, snap } from "../../../visual";
import { DropZone, type DropZoneProps } from "..";
import "../drop-zone.stories.css";

// The stories' look: the design system leaves a drop zone's to its usage
const addData = (props: DropZoneProps = {}): React.ReactElement => (
  <DropZone className="drop-zone-story" {...props}>
    <FileUploadIcon aria-hidden size={24} />
    <DropZone.Label>
      Drop files or a link here to add them to the map
    </DropZone.Label>
    <FileTrigger allowsMultiple>
      <Button size="sm" variant="secondary">
        Browse files
      </Button>
    </FileTrigger>
  </DropZone>
);

const zone = (): Locator =>
  page.elementLocator(
    document.querySelector('[data-tds="drop-zone"]') ?? document.body
  );

// A file dragged in from outside the page: the events the browser sends,
// with a file in them, over the zone's middle
const dragFileOver = (target: Locator): void => {
  const element = target.element();
  const box = element.getBoundingClientRect();
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(
    new File(["{}"], "suburbs.geojson", { type: "application/geo+json" })
  );
  for (const type of ["dragenter", "dragover"]) {
    element.dispatchEvent(
      new DragEvent(type, {
        bubbles: true,
        cancelable: true,
        dataTransfer,
        clientX: box.x + box.width / 2,
        clientY: box.y + box.height / 2
      })
    );
  }
};

describe("DropZone", () => {
  it("default", async () => {
    await render(addData());
    await snap();
  });

  it("hovered", async () => {
    await render(addData());
    await hover(zone());
    await expect.element(zone()).toHaveAttribute("data-hovered");
    await snap();
  });

  // Tabbing reaches the zone first, then the button in it
  it("focused", async () => {
    await render(addData());
    await userEvent.tab();
    await expect.element(zone()).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("drop target", async () => {
    await render(addData());
    dragFileOver(zone());
    await expect.element(zone()).toHaveAttribute("data-drop-target");
    await snap();
  });

  it("disabled", async () => {
    await render(addData({ isDisabled: true }));
    await snap();
  });
});
