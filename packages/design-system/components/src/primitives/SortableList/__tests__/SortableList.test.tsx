import { afterEach, describe, expect, it, vi } from "vitest";
import { render, type RenderResult } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { SortableList, type SortableListProps } from "..";
import { Disclosure } from "../../Disclosure";
import { Slider } from "../../Slider";

type Layer = { id: string; name: string };

const LAYERS: Layer[] = [
  { id: "roads", name: "Roads" },
  { id: "rivers", name: "Rivers" },
  { id: "suburbs", name: "Suburbs" }
];

const layerList = (
  props: Partial<SortableListProps<Layer>> = {}
): React.ReactElement => (
  <SortableList
    aria-label="Layers"
    items={LAYERS}
    getItemText={(layer) => layer.name}
    onReorder={vi.fn()}
    {...props}
  >
    {(layer, { isDragging }) => (
      <div data-testid={layer.id} data-dragging={isDragging || undefined}>
        <SortableList.DragHandle />
        {layer.name}
      </div>
    )}
  </SortableList>
);

const renderList = (
  props: Partial<SortableListProps<Layer>> = {}
): Promise<RenderResult> => render(layerList(props));

// The items' keys in the order the rows are drawn
const rowOrder = (screen: RenderResult): (string | null)[] =>
  [...screen.container.querySelectorAll('[role="row"][data-key]')].map((row) =>
    row.getAttribute("data-key")
  );

// Picks an item up by its drag handle from the keyboard
const pickUp = async (screen: RenderResult, name: string): Promise<void> => {
  screen
    .getByRole("button", { name: new RegExp(`Drag ${name}`) })
    .element()
    .focus();
  await userEvent.keyboard("{Enter}");
  // The drag starts once focus moves to the first place it could land
  await expect
    .poll(() => document.activeElement?.getAttribute("aria-roledescription"))
    .toBe("drop indicator");
};

describe("SortableList", () => {
  // A drag left going is global, and would stop the next test starting one
  afterEach(async () => {
    await userEvent.keyboard("{Escape}");
  });

  it("lists the items as rows, each with a drag handle named for it", async () => {
    const screen = await renderList();

    await expect
      .element(screen.getByRole("grid", { name: "Layers" }))
      .toBeVisible();
    for (const layer of LAYERS) {
      await expect
        .element(screen.getByRole("row", { name: new RegExp(layer.name) }))
        .toBeVisible();
      await expect
        .element(
          screen.getByRole("button", { name: new RegExp(`Drag ${layer.name}`) })
        )
        .toBeVisible();
    }
  });

  it("takes its items from any iterable, read once", async () => {
    function* layers(): Generator<Layer> {
      yield* LAYERS;
    }
    const screen = await renderList({ items: layers() });

    await expect
      .element(screen.getByRole("row", { name: "Suburbs" }))
      .toBeVisible();
  });

  // A drag starting draws it again too
  it("keeps an iterable's items as it draws again", async () => {
    function* layers(): Generator<Layer> {
      yield* LAYERS;
    }
    const items = layers();
    const screen = await render(layerList({ items }));

    await screen.rerender(layerList({ items }));

    expect(rowOrder(screen)).toEqual(["roads", "rivers", "suburbs"]);
  });

  it("doesn't draw the items again as a pointer drag moves", async () => {
    let draws = 0;
    const screen = await render(
      <SortableList
        aria-label="Layers"
        items={LAYERS}
        getItemText={(layer) => layer.name}
        onReorder={vi.fn()}
      >
        {(layer) => {
          draws += 1;
          return (
            <div>
              <SortableList.DragHandle />
              {layer.name}
            </div>
          );
        }}
      </SortableList>
    );
    const row = screen.getByRole("row", { name: "Roads" }).element();
    const dataTransfer = new DataTransfer();
    row.dispatchEvent(
      new DragEvent("dragstart", { bubbles: true, dataTransfer })
    );
    await expect.element(row).toHaveAttribute("data-dragging");
    // Lets the drag start finish drawing
    await new Promise((resolve) => setTimeout(resolve, 100));
    const drawn = draws;

    // Off the list, so only the pointer moves, not where the item would land
    for (const y of [10, 20, 30]) {
      document.body.dispatchEvent(
        new DragEvent("dragover", {
          bubbles: true,
          cancelable: true,
          clientX: 10,
          clientY: y,
          dataTransfer
        })
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(draws).toBe(drawn);
    row.dispatchEvent(
      new DragEvent("dragend", { bubbles: true, dataTransfer })
    );
  });

  it("shows a focus ring on the list itself when it takes keyboard focus, as when empty", async () => {
    const screen = await renderList({
      items: [],
      renderEmptyState: () => "No layers"
    });

    await userEvent.tab();

    const list = screen.getByRole("grid", { name: "Layers" }).element();
    expect(document.activeElement).toBe(list);
    expect(getComputedStyle(list).outlineStyle).not.toBe("none");
  });

  it("keeps the handle working inside a component with buttons of its own, such as a Disclosure", async () => {
    const screen = await render(
      <SortableList
        aria-label="Layers"
        items={LAYERS}
        getItemText={(layer) => layer.name}
        onReorder={vi.fn()}
      >
        {(layer) => (
          <Disclosure>
            <SortableList.DragHandle />
            <Disclosure.Heading>
              <Disclosure.Trigger>{layer.name}</Disclosure.Trigger>
            </Disclosure.Heading>
            <Disclosure.Content>Details</Disclosure.Content>
          </Disclosure>
        )}
      </SortableList>
    );

    await expect
      .element(screen.getByRole("button", { name: /Drag Roads/ }))
      .toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Roads" }));
    await expect
      .element(screen.getByRole("button", { name: "Roads" }))
      .toHaveAttribute("aria-expanded", "true");
  });

  it("leaves the arrow keys to the controls in an item, such as a slider", async () => {
    const screen = await render(
      <SortableList
        aria-label="Layers"
        items={LAYERS}
        getItemText={(layer) => layer.name}
        onReorder={vi.fn()}
      >
        {(layer) => (
          <div>
            <SortableList.DragHandle />
            {layer.name}
            <Slider label={`${layer.name} opacity`} defaultValue={80} />
          </div>
        )}
      </SortableList>
    );
    const opacity = screen.getByRole("slider", { name: "Roads opacity" });

    opacity.element().focus();
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");

    await expect.element(opacity).toHaveFocus();
    await expect.element(opacity).toHaveValue("78");
  });

  it("reorders from the keyboard: Enter picks up, arrows move, Enter drops", async () => {
    const onReorder = vi.fn();
    const screen = await renderList({ onReorder });

    await pickUp(screen, "Roads");
    // Picking up lands between Roads and Rivers; one down is past Rivers
    await userEvent.keyboard("{ArrowDown}{Enter}");

    await expect.poll(() => onReorder.mock.calls.length).toBe(1);
    const [event] = onReorder.mock.calls[0] as [
      { keys: Set<string>; target: { key: string; dropPosition: string } }
    ];
    expect([...event.keys]).toEqual(["roads"]);
    expect(event.target).toMatchObject({
      key: "suburbs",
      dropPosition: "before"
    });
  });

  it("picks up any row from the keyboard: arrows to the row, Tab to its handle, then Enter", async () => {
    await renderList();

    await userEvent.tab();
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.tab();
    expect(document.activeElement?.getAttribute("aria-label")).toMatch(
      /Drag Rivers/
    );
    await userEvent.keyboard("{Enter}");

    await expect
      .poll(() => document.activeElement?.getAttribute("aria-roledescription"))
      .toBe("drop indicator");
  });

  it("doesn't reorder when dropped right where it is", async () => {
    const onReorder = vi.fn();
    const screen = await renderList({ onReorder });

    // Picking up lands just after Roads itself
    await pickUp(screen, "Roads");
    await userEvent.keyboard("{Enter}");

    await expect
      .poll(() => document.activeElement?.getAttribute("aria-roledescription"))
      .not.toBe("drop indicator");
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("tells the item it's being dragged", async () => {
    const screen = await renderList();

    await pickUp(screen, "Roads");

    await expect
      .element(screen.getByTestId("roads"))
      .toHaveAttribute("data-dragging");
    await expect
      .element(screen.getByTestId("rivers"))
      .not.toHaveAttribute("data-dragging");
  });

  it("shows a line where it would land by default", async () => {
    const screen = await renderList();

    await pickUp(screen, "Roads");
    await userEvent.keyboard("{ArrowDown}");

    expect(
      screen.container.querySelector(
        ".tds-sortable-list-drop-indicator[data-drop-target]"
      )
    ).not.toBeNull();
  });

  it("moves the dragged item itself to where it would land with the item indicator", async () => {
    const onReorder = vi.fn();
    const screen = await renderList({ dropIndicator: "item", onReorder });

    await pickUp(screen, "Roads");
    await userEvent.keyboard("{ArrowDown}");

    await expect
      .poll(() => rowOrder(screen))
      .toEqual(["rivers", "roads", "suburbs"]);
    expect(onReorder).not.toHaveBeenCalled();

    await userEvent.keyboard("{Enter}");

    await expect.poll(() => onReorder.mock.calls.length).toBe(1);
    const [event] = onReorder.mock.calls[0] as [
      { keys: Set<string>; target: { key: string; dropPosition: string } }
    ];
    expect([...event.keys]).toEqual(["roads"]);
    expect(event.target).toMatchObject({
      key: "suburbs",
      dropPosition: "before"
    });
  });

  it("drops the item where it was released with the item indicator, even at once", async () => {
    const onReorder = vi.fn();
    const screen = await renderList({ dropIndicator: "item", onReorder });

    // A real pointer drag that releases straight away
    await userEvent.dragAndDrop(
      screen.getByRole("row", { name: "Suburbs" }),
      screen.getByRole("row", { name: "Roads" })
    );

    await expect.poll(() => onReorder.mock.calls.length).toBe(1);
  });

  it("puts the item back when the drag is cancelled with the item indicator", async () => {
    const onReorder = vi.fn();
    const screen = await renderList({ dropIndicator: "item", onReorder });

    await pickUp(screen, "Roads");
    await userEvent.keyboard("{ArrowDown}");
    await expect
      .poll(() => rowOrder(screen))
      .toEqual(["rivers", "roads", "suburbs"]);
    await userEvent.keyboard("{Escape}");

    await expect
      .poll(() => rowOrder(screen))
      .toEqual(["roads", "rivers", "suburbs"]);
    expect(onReorder).not.toHaveBeenCalled();
  });

  // Narrower than the page, so a copy placed from the other side would miss it
  it.each(["ltr", "rtl"])(
    "keeps the dragged item's copy on its column with axis y, %s",
    async (dir) => {
      const screen = await render(
        <div dir={dir} style={{ inlineSize: 320 }}>
          {layerList({ axis: "y" })}
        </div>
      );
      const row = screen.getByRole("row", { name: "Roads" }).element();
      const start = row.getBoundingClientRect();

      // A pointer drag, which a test can't make with the mouse
      row.dispatchEvent(
        new DragEvent("dragstart", {
          bubbles: true,
          clientX: start.left + 10,
          clientY: start.top + 10,
          dataTransfer: new DataTransfer()
        })
      );
      await expect.element(row).toHaveAttribute("data-dragging");
      // Over a row, which handles it and stops it there
      screen
        .getByRole("row", { name: "Rivers" })
        .element()
        .dispatchEvent(
          new DragEvent("dragover", {
            bubbles: true,
            cancelable: true,
            dataTransfer: new DataTransfer(),
            clientX: start.left + 200,
            clientY: start.top + 60
          })
        );

      const overlay = (): DOMRect | undefined =>
        document
          .querySelector('[data-tds="sortable-list-drag-overlay"]')
          ?.getBoundingClientRect();
      await expect.poll(() => overlay()?.top).toBe(start.top + 50);
      expect(overlay()?.left).toBe(start.left);

      row.dispatchEvent(
        new DragEvent("dragend", {
          bubbles: true,
          dataTransfer: new DataTransfer()
        })
      );
      await expect.poll(overlay).toBeUndefined();
    }
  );

  it("scrolls to where it would land when dragged from the keyboard", async () => {
    const screen = await renderList({
      style: { maxBlockSize: 40, overflow: "auto" }
    });

    await pickUp(screen, "Roads");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");

    await expect
      .poll(() => screen.getByRole("grid").element().scrollTop)
      .toBeGreaterThan(0);
  });

  describe("scrolling while dragging", () => {
    // Enough layers that scrolling doesn't reach the end during a test
    const MANY = Array.from({ length: 60 }, (_, index) => ({
      id: `layer-${String(index)}`,
      name: `Layer ${String(index)}`
    }));

    afterEach(() => {
      window.scrollTo(0, 0);
    });

    // A pointer drag of the first layer in a list that scrolls, or on a page
    // that does
    const startDrag = async ({
      onPage = false,
      ...props
    }: { onPage?: boolean } & Partial<SortableListProps<Layer>> = {}): Promise<{
      list: HTMLElement;
      over: (y: number) => void;
    }> => {
      const screen = await render(
        <SortableList
          aria-label="Layers"
          items={MANY}
          getItemText={(layer) => layer.name}
          onReorder={vi.fn()}
          style={onPage ? undefined : { maxBlockSize: 200, overflow: "auto" }}
          {...props}
        >
          {(layer) => (
            <div>
              <SortableList.DragHandle />
              {layer.name}
            </div>
          )}
        </SortableList>
      );
      const list = screen.getByRole("grid").element() as HTMLElement;
      const row = screen.getByRole("row", { name: "Layer 0" }).element();
      const dataTransfer = new DataTransfer();
      row.dispatchEvent(
        new DragEvent("dragstart", { bubbles: true, dataTransfer })
      );
      await expect.element(row).toHaveAttribute("data-dragging");
      const { left } = list.getBoundingClientRect();
      return {
        list,
        over: (y) => {
          document.body.dispatchEvent(
            new DragEvent("dragover", {
              bubbles: true,
              cancelable: true,
              clientX: left + 10,
              clientY: y,
              dataTransfer
            })
          );
        }
      };
    };

    it("scrolls while the pointer is within the scroll zone at the list's edge", async () => {
      const { list, over } = await startDrag({ scrollEdge: 40 });

      // Inside the list, 20px from its bottom
      over(list.getBoundingClientRect().bottom - 20);

      await expect.poll(() => list.scrollTop).toBeGreaterThan(0);
    });

    it("scrolls down from the bottom zone even when the zones are deeper than half the list", async () => {
      const { list, over } = await startDrag({ scrollEdge: 400 });

      over(list.getBoundingClientRect().bottom - 20);

      await expect.poll(() => list.scrollTop).toBeGreaterThan(0);
    });

    it("scrolls at the speed scrollSpeed sets, in pixels a second", async () => {
      const { list, over } = await startDrag({ scrollSpeed: 30 });

      // Past the bottom, so at full speed: about 9px in 300ms
      over(list.getBoundingClientRect().bottom + 20);
      await expect.poll(() => list.scrollTop).toBeGreaterThan(0);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(list.scrollTop).toBeLessThan(40);
    });

    it("scrolls the page when it's the page that scrolls the list", async () => {
      const { over } = await startDrag({ scrollEdge: 40, onPage: true });

      // Near the bottom of the window
      over(window.innerHeight - 20);

      await expect.poll(() => window.scrollY).toBeGreaterThan(0);
    });

    it("doesn't scroll while the pointer is further in than the scroll zone", async () => {
      // Within the default zone, but not this one
      const { list, over } = await startDrag({ scrollEdge: 10 });

      over(list.getBoundingClientRect().bottom - 30);
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(list.scrollTop).toBe(0);
    });

    it("stops scrolling once the pointer has left the page", async () => {
      const { list, over } = await startDrag();

      // Last seen below the list, then gone: no more drag events arrive
      over(list.getBoundingClientRect().bottom + 50);
      await expect.poll(() => list.scrollTop).toBeGreaterThan(0);
      await new Promise((resolve) => setTimeout(resolve, 800));
      const stopped = list.scrollTop;
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(list.scrollTop).toBe(stopped);
    });
  });

  it("keeps scrolling while a pointer drag is below the list", async () => {
    const screen = await renderList({
      style: { maxBlockSize: 40, overflow: "auto" }
    });
    const list = screen.getByRole("grid").element();
    const row = screen.getByRole("row", { name: "Roads" }).element();
    const { bottom, left } = list.getBoundingClientRect();

    row.dispatchEvent(
      new DragEvent("dragstart", {
        bubbles: true,
        clientX: left + 10,
        clientY: 10,
        dataTransfer: new DataTransfer()
      })
    );
    await expect.element(row).toHaveAttribute("data-dragging");
    // Off the list, where the browser stops scrolling it
    document.body.dispatchEvent(
      new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
        clientX: left + 10,
        clientY: bottom + 50,
        dataTransfer: new DataTransfer()
      })
    );

    await expect.poll(() => list.scrollTop).toBeGreaterThan(0);

    row.dispatchEvent(
      new DragEvent("dragend", {
        bubbles: true,
        dataTransfer: new DataTransfer()
      })
    );
  });

  it("pictures the dragged item at rest, as wide as its row, for the browser", async () => {
    const screen = await renderList();
    const row = screen.getByRole("row", { name: "Roads" }).element();
    const { left, top, width } = row.getBoundingClientRect();
    const dataTransfer = new DataTransfer();
    const picture: { html?: string; width?: number } = {};
    dataTransfer.setDragImage = (element) => {
      picture.html = element.outerHTML;
      picture.width = element.getBoundingClientRect().width;
    };

    row.dispatchEvent(
      new DragEvent("dragstart", {
        bubbles: true,
        clientX: left + 10,
        clientY: top + 10,
        dataTransfer
      })
    );

    expect(picture.html).toContain("Roads");
    expect(picture.html).not.toContain("data-dragging");
    expect(picture.width).toBe(width);

    row.dispatchEvent(
      new DragEvent("dragend", { bubbles: true, dataTransfer })
    );
  });

  describe("the copies that follow the pointer", () => {
    // Rows whose checkbox keeps its own state, starting ticked
    const renderWithCheckboxes = (
      props: Partial<SortableListProps<Layer>> = {}
    ): Promise<RenderResult> =>
      render(
        <SortableList
          aria-label="Layers"
          items={LAYERS}
          getItemText={(layer) => layer.name}
          onReorder={vi.fn()}
          {...props}
        >
          {(layer) => (
            <div>
              <input
                type="checkbox"
                defaultChecked
                aria-label={`Show ${layer.name}`}
              />
              <SortableList.DragHandle />
              {layer.name}
            </div>
          )}
        </SortableList>
      );

    it("picture the item as it looks now, not as it was first drawn", async () => {
      const screen = await renderWithCheckboxes();
      await userEvent.click(
        screen.getByRole("checkbox", { name: "Show Roads" })
      );
      const row = screen.getByRole("row", { name: "Roads" }).element();
      const dataTransfer = new DataTransfer();
      let pictured: boolean | undefined;
      dataTransfer.setDragImage = (element) => {
        pictured = element.querySelector("input")?.checked;
      };

      row.dispatchEvent(
        new DragEvent("dragstart", { bubbles: true, dataTransfer })
      );

      expect(pictured).toBe(false);
      row.dispatchEvent(
        new DragEvent("dragend", { bubbles: true, dataTransfer })
      );
    });

    it("draw the item as it looks now along the axis", async () => {
      const screen = await renderWithCheckboxes({ axis: "y" });
      await userEvent.click(
        screen.getByRole("checkbox", { name: "Show Roads" })
      );
      const row = screen.getByRole("row", { name: "Roads" }).element();
      const dataTransfer = new DataTransfer();

      row.dispatchEvent(
        new DragEvent("dragstart", { bubbles: true, dataTransfer })
      );
      await expect.element(row).toHaveAttribute("data-dragging");
      document.body.dispatchEvent(
        new DragEvent("dragover", {
          bubbles: true,
          cancelable: true,
          clientY: 40,
          dataTransfer
        })
      );

      await expect
        .poll(
          () =>
            document.querySelector<HTMLInputElement>(
              '[data-tds="sortable-list-drag-overlay"] input'
            )?.checked
        )
        .toBe(false);
      row.dispatchEvent(
        new DragEvent("dragend", { bubbles: true, dataTransfer })
      );
    });
  });

  it("carries no text, so a text field or another app ignores the drop", async () => {
    const screen = await renderList();
    const row = screen.getByRole("row", { name: "Roads" }).element();
    const dataTransfer = new DataTransfer();

    row.dispatchEvent(
      new DragEvent("dragstart", { bubbles: true, dataTransfer })
    );

    expect(dataTransfer.types).not.toHaveLength(0);
    expect(dataTransfer.getData("text/plain")).toBe("");
    row.dispatchEvent(
      new DragEvent("dragend", { bubbles: true, dataTransfer })
    );
  });

  it("gives renderDragPreview the dragged items", async () => {
    const renderDragPreview = vi.fn(() => <div>Moving</div>);
    const screen = await renderList({ renderDragPreview });
    const row = screen.getByRole("row", { name: "Rivers" }).element();
    const dataTransfer = new DataTransfer();

    row.dispatchEvent(
      new DragEvent("dragstart", { bubbles: true, dataTransfer })
    );

    expect(renderDragPreview).toHaveBeenCalledWith([LAYERS[1]]);

    row.dispatchEvent(
      new DragEvent("dragend", { bubbles: true, dataTransfer })
    );
  });

  it("shows a grab cursor over the handle", async () => {
    const screen = await renderList();
    const handle = screen
      .getByRole("button", { name: /Drag Roads/ })
      .element()
      .getBoundingClientRect();

    const under = document.elementFromPoint(
      handle.left + handle.width / 2,
      handle.top + handle.height / 2
    );

    expect(under && getComputedStyle(under).cursor).toBe("grab");
  });

  describe("where a pointer drag starts", () => {
    // Presses the pointer on the middle of an element, on whatever is there
    // to the pointer, then drags its row. False when the drag is refused
    const dragFrom = (element: Element): boolean => {
      const row = element.closest('[role="row"]');
      if (!row) throw new Error("not in a row");
      const { left, top, width, height } = element.getBoundingClientRect();
      const clientX = left + width / 2;
      const clientY = top + height / 2;
      const pressed = document.elementFromPoint(clientX, clientY) ?? element;
      pressed.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, clientX, clientY })
      );
      return row.dispatchEvent(
        new DragEvent("dragstart", {
          bubbles: true,
          cancelable: true,
          dataTransfer: new DataTransfer()
        })
      );
    };

    it("starts only once the press has been held for dragDelay", async () => {
      const screen = await renderList({ dragDelay: 200 });
      const title = screen.getByText("Roads").element();

      // Moved straight after the press
      expect(dragFrom(title)).toBe(false);

      // Held, then moved
      const row = title.closest('[role="row"]');
      title.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 250));
      expect(
        row?.dispatchEvent(
          new DragEvent("dragstart", {
            bubbles: true,
            cancelable: true,
            dataTransfer: new DataTransfer()
          })
        )
      ).toBe(true);
    });

    it("starts anywhere on the item by default", async () => {
      const screen = await renderList();

      expect(dragFrom(screen.getByText("Roads").element())).toBe(true);
    });

    it("starts only on the handle with dragFrom handle", async () => {
      const screen = await renderList({ dragFrom: "handle" });

      expect(dragFrom(screen.getByText("Roads").element())).toBe(false);
      expect(
        dragFrom(screen.getByRole("button", { name: /Drag Roads/ }).element())
      ).toBe(true);
      await expect
        .element(screen.getByRole("row", { name: "Roads" }))
        .toHaveAttribute("data-dragging");
    });
  });
});
