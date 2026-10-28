import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { DropZone } from "..";

// What a browser fires when a link is dragged over an element and dropped.
// A dropped file can't be simulated: React Aria reads files through their
// file-system entry, which only files from the computer have
const dropLink = (target: Element, url: string): void => {
  const dataTransfer = new DataTransfer();
  dataTransfer.setData("text/uri-list", url);
  // A browser sets these from the drag and the drop target; synthetic
  // events don't
  dataTransfer.effectAllowed = "all";
  dataTransfer.dropEffect = "copy";
  const fire = (type: string): void => {
    target.dispatchEvent(
      new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer })
    );
  };
  fire("dragenter");
  fire("dragover");
  fire("drop");
};

describe("DropZone", () => {
  it("is named by its label", async () => {
    // React Aria says what the zone is, then the label
    const screen = await render(
      <DropZone>
        <DropZone.Label>Drop files to add them to the map</DropZone.Label>
      </DropZone>
    );

    await expect
      .element(
        screen.getByRole("button", {
          name: /Drop files to add them to the map/
        })
      )
      .toBeInTheDocument();
  });

  it("passes what's dropped on it to onDrop", async () => {
    const onDrop = vi.fn();
    const screen = await render(
      <DropZone onDrop={onDrop} data-testid="zone">
        <DropZone.Label>Drop a link to add its data</DropZone.Label>
      </DropZone>
    );

    dropLink(
      screen.getByTestId("zone").element(),
      "https://example.com/roads.geojson"
    );

    await expect.poll(() => onDrop.mock.calls.length).toBe(1);
    const [event] = onDrop.mock.calls[0] as [
      {
        items: {
          kind: string;
          getText: (type: string) => Promise<string>;
        }[];
      }
    ];
    expect(event.items[0]?.kind).toBe("text");
    expect(await event.items[0]?.getText("text/uri-list")).toBe(
      "https://example.com/roads.geojson"
    );
  });
});
