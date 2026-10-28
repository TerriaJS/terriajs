import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { Button } from "../../../primitives/Button";

const box = (element: Element): DOMRect => element.getBoundingClientRect();

describe("layout: flex", () => {
  it("stacks a tds-stack's children in a column", async () => {
    const screen = await render(
      <div className="tds-stack">
        <span>First</span>
        <span>Second</span>
      </div>
    );
    const first = box(screen.getByText("First").element());
    const second = box(screen.getByText("Second").element());

    expect(second.top).toBeGreaterThan(first.bottom);
    expect(second.left).toBe(first.left);
  });

  it("spaces a tds-stack's children by its gap alone, not their margins too", async () => {
    const screen = await render(
      <div className="tds-stack">
        <p>First paragraph</p>
        <p>Second paragraph</p>
      </div>
    );
    const first = box(screen.getByText("First paragraph").element());
    const second = box(screen.getByText("Second paragraph").element());

    // The stack's 12px gap, without the 8px between paragraphs in text
    expect(second.top - first.bottom).toBe(12);
  });

  it("keeps a margin set on a child, over the layout's", async () => {
    const screen = await render(
      <div className="tds-stack">
        <p>First paragraph</p>
        <p className="spaced">Second paragraph</p>
      </div>
    );
    const style = document.createElement("style");
    style.textContent = ".spaced { margin-block-start: 20px; }";
    document.head.append(style);
    const first = box(screen.getByText("First paragraph").element());
    const second = box(screen.getByText("Second paragraph").element());
    style.remove();

    expect(second.top - first.bottom).toBe(32);
  });

  it("puts a tds-cluster's children in a row, wrapping when they don't fit", async () => {
    const cluster = (width: number): React.ReactElement => (
      <div className="tds-cluster" style={{ inlineSize: width }}>
        <div>Roads layer</div>
        <div>Labels layer</div>
      </div>
    );
    const tops = (screen: Awaited<ReturnType<typeof render>>): number[] =>
      ["Roads layer", "Labels layer"].map(
        (text) => box(screen.getByText(text).element()).top
      );

    const wide = await render(cluster(400));
    const [roads, labels] = tops(wide);
    expect(labels).toBe(roads);
    await wide.unmount();

    const narrow = await render(cluster(100));
    const [narrowRoads = 0, narrowLabels = 0] = tops(narrow);
    expect(narrowLabels).toBeGreaterThan(narrowRoads);
  });

  it("spaces children by a tds-flex-gap-* class over a layout's own gap", async () => {
    const screen = await render(
      <div className="tds-stack tds-flex-gap-xs">
        <span>First</span>
        <span>Second</span>
      </div>
    );
    const first = box(screen.getByText("First").element());
    const second = box(screen.getByText("Second").element());

    expect(second.top - first.bottom).toBe(4);
  });

  it("keeps a nested layout's own gap, not its parent's", async () => {
    const screen = await render(
      <div className="tds-stack tds-flex-gap-xl">
        <div className="tds-stack">
          <span>First</span>
          <span>Second</span>
        </div>
      </div>
    );
    const first = box(screen.getByText("First").element());
    const second = box(screen.getByText("Second").element());

    // The inner stack's 12px, not the outer stack's 24px
    expect(second.top - first.bottom).toBe(12);
  });

  it("aligns children by a tds-items-* class over a layout's own alignment", async () => {
    const screen = await render(
      <div className="tds-cluster tds-items-start">
        <div>Short</div>
        <div className="tds-stack">
          <div>Tall</div>
          <div>item</div>
        </div>
      </div>
    );

    expect(box(screen.getByText("Short").element()).top).toBe(
      box(screen.getByText("Tall").element()).top
    );
  });
});

describe("layout: grid", () => {
  it("fits a tds-grid-fit's children in as many columns as there's room for", async () => {
    const grid = (width: number): React.ReactElement => (
      <div className="tds-grid-fit" style={{ inlineSize: width }}>
        <div>Roads</div>
        <div>Labels</div>
        <div>Boundaries</div>
      </div>
    );
    const tops = (screen: Awaited<ReturnType<typeof render>>): number[] =>
      ["Roads", "Labels", "Boundaries"].map(
        (text) => box(screen.getByText(text).element()).top
      );

    // Three 15rem columns fit side by side
    const wide = await render(grid(800));
    expect(new Set(tops(wide)).size).toBe(1);
    await wide.unmount();

    // One column: each child on its own row
    const narrow = await render(grid(200));
    expect(new Set(tops(narrow)).size).toBe(3);
  });

  it("keeps a tds-grid-fit's few children at their minimum width with auto-fill", async () => {
    const grid = (layout: "auto-fit" | "auto-fill"): React.ReactElement => (
      <div
        className="tds-grid-fit"
        style={
          {
            inlineSize: 800,
            "--terria-ds-grid-auto-layout": layout,
            "--terria-ds-grid-item-min": "10rem"
          } as React.CSSProperties
        }
      >
        <div>Roads</div>
        <div>Labels</div>
      </div>
    );
    const width = (screen: Awaited<ReturnType<typeof render>>): number =>
      box(screen.getByText("Roads").element()).width;

    // auto-fit stretches the two children across the row
    const fit = await render(grid("auto-fit"));
    expect(width(fit)).toBeGreaterThan(300);
    await fit.unmount();

    // auto-fill keeps the empty columns, so they stay 10rem
    const fill = await render(grid("auto-fill"));
    expect(width(fill)).toBeLessThan(200);
  });

  it("stops a tds-grid-fit's columns growing past --terria-ds-grid-item-max", async () => {
    const screen = await render(
      <div
        className="tds-grid-fit"
        style={
          {
            inlineSize: 800,
            "--terria-ds-grid-item-min": "8rem",
            "--terria-ds-grid-item-max": "10rem"
          } as React.CSSProperties
        }
      >
        <div>Roads</div>
      </div>
    );

    expect(box(screen.getByText("Roads").element()).width).toBe(160);
  });

  it("keeps a nested tds-grid-fit's own minimum width, not its parent's", async () => {
    const screen = await render(
      <div
        className="tds-grid-fit"
        style={
          {
            inlineSize: 800,
            "--terria-ds-grid-item-min": "40rem"
          } as React.CSSProperties
        }
      >
        <div className="tds-grid-fit">
          <div>Roads</div>
          <div>Labels</div>
        </div>
      </div>
    );

    // The inner grid's 15rem default fits both side by side in 640px
    expect(box(screen.getByText("Labels").element()).top).toBe(
      box(screen.getByText("Roads").element()).top
    );
  });

  it("spaces a grid's children by a tds-grid-gap-* class over its own gap", async () => {
    const screen = await render(
      <div className="tds-grid tds-grid-gap-xs">
        <div>First</div>
        <div>Second</div>
      </div>
    );
    const first = box(screen.getByText("First").element());
    const second = box(screen.getByText("Second").element());

    expect(second.top - first.bottom).toBe(4);
  });
});

describe("layout: spacing", () => {
  it("spaces a grid's columns and rows apart separately with tds-grid-gap-x and -y", async () => {
    const screen = await render(
      <div
        className="tds-grid tds-grid-gap-x-xl tds-grid-gap-y-xs"
        style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
      >
        <div>One</div>
        <div>Two</div>
        <div>Three</div>
      </div>
    );
    const one = box(screen.getByText("One").element());
    const two = box(screen.getByText("Two").element());
    const three = box(screen.getByText("Three").element());

    expect(two.left - one.right).toBe(24);
    expect(three.top - one.bottom).toBe(4);
  });

  it("pads a component by a tds-p* class over the component's own padding", async () => {
    const screen = await render(<Button className="tds-px-xl">Save</Button>);

    expect(
      getComputedStyle(screen.getByRole("button").element()).paddingInlineStart
    ).toBe("24px");
  });

  it("spaces a layout's child by a tds-m* class, over the layout clearing it", async () => {
    const screen = await render(
      <div className="tds-stack">
        <p>First paragraph</p>
        <p className="tds-mt-lg">Second paragraph</p>
      </div>
    );
    const first = box(screen.getByText("First paragraph").element());
    const second = box(screen.getByText("Second paragraph").element());

    // The stack's 12px gap and the 16px margin
    expect(second.top - first.bottom).toBe(28);
  });

  it("pushes a child to the end of a row with tds-ms-auto", async () => {
    const screen = await render(
      <div className="tds-row" style={{ inlineSize: 400 }}>
        <span>Title</span>
        <span className="tds-ms-auto">Action</span>
      </div>
    );
    const row = box(
      screen.getByText("Title").element().parentElement ?? document.body
    );

    expect(box(screen.getByText("Action").element()).right).toBe(row.right);
  });
});
