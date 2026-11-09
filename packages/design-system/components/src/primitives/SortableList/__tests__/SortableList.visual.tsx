import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { focusVisible, hover, snap } from "../../../visual";
import { SortableList, type SortableListDropIndicator } from "..";
import "../sortable-list.stories.css";

type Layer = { id: string; name: string; description?: string };

const LAYERS: Layer[] = [
  { id: "roads", name: "Roads" },
  {
    id: "rivers",
    name: "Rivers",
    description: "Major rivers and creeks, from the national hydrography."
  },
  { id: "suburbs", name: "Suburbs (2021 census)" }
];

const layers = (
  dropIndicator: SortableListDropIndicator = "line"
): React.ReactElement => (
  <div className="sortable-list-story">
    <SortableList
      aria-label="Layers on the map"
      items={LAYERS}
      getItemText={(layer) => layer.name}
      onReorder={() => undefined}
      dropIndicator={dropIndicator}
    >
      {(layer, { isDragging }) => (
        <div
          className="sortable-list-story-row"
          data-dragging={isDragging || undefined}
        >
          <SortableList.DragHandle />
          <div>
            {layer.name}
            {layer.description && (
              <span className="sortable-list-story-description">
                {layer.description}
              </span>
            )}
          </div>
        </div>
      )}
    </SortableList>
  </div>
);

// Drags from the pointer aren't covered: the browser's native drag can't be
// held mid-way for a screenshot. The keyboard drag shows the same states
describe("SortableList", () => {
  it("default", async () => {
    await render(layers());
    await snap();
  });

  it("item hovered", async () => {
    const screen = await render(layers());
    await hover(screen.getByRole("row", { name: "Rivers" }));
    await snap();
  });

  it("item focused", async () => {
    const screen = await render(layers());
    const row = screen.getByRole("row", { name: "Roads" });
    await focusVisible(row);
    await expect.element(row).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("drag handle focused", async () => {
    const screen = await render(layers());
    const handle = screen
      .getByRole("row", { name: "Roads" })
      .getByRole("button", { name: /drag/i });
    await focusVisible(handle);
    await expect.element(handle).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it.each(["line", "item"] as const)(
    "dragged with the keyboard, %s indicator",
    async (dropIndicator) => {
      const screen = await render(layers(dropIndicator));
      const row = screen.getByRole("row", { name: "Roads" });
      await focusVisible(row.getByRole("button", { name: /drag/i }));
      await userEvent.keyboard("{Enter}");
      await expect.element(row).toHaveAttribute("data-dragging");
      await userEvent.keyboard("{ArrowDown}{ArrowDown}");
      await expect
        .poll(() => document.querySelector("[data-drop-target]"))
        .not.toBeNull();
      await snap();
      // A keyboard drag is React Aria's, page-wide: left going, it would
      // carry into the next test
      await userEvent.keyboard("{Escape}");
    }
  );
});
