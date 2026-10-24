import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { Badge } from ".";

const ANCHOR_SIZE = 40;

const renderAnchored = (
  placement?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
): ReturnType<typeof render> =>
  render(
    <Badge.Anchor data-testid="anchor">
      <span
        style={{
          display: "block",
          inlineSize: ANCHOR_SIZE,
          blockSize: ANCHOR_SIZE
        }}
      />
      <Badge placement={placement}>5</Badge>
    </Badge.Anchor>
  );

const rects = async (
  screen: Awaited<ReturnType<typeof render>>
): Promise<{ anchor: DOMRect; badge: DOMRect }> => {
  await expect.element(screen.getByText("5")).toBeVisible();
  const badge = screen.getByText("5").element().closest("[data-tds='badge']");
  if (badge === null) throw new Error("The badge has no element");
  return {
    anchor: screen.getByTestId("anchor").element().getBoundingClientRect(),
    badge: badge.getBoundingClientRect()
  };
};

describe("Badge", () => {
  it("wraps text content in a label", async () => {
    const screen = await render(<Badge>New</Badge>);

    await expect
      .element(screen.getByText("New"))
      .toHaveAttribute("data-tds", "badge-label");
  });

  it("sits on its anchor's top-right corner by default", async () => {
    const { anchor, badge } = await rects(await renderAnchored());

    expect(badge.left).toBeLessThan(anchor.right);
    expect(badge.right).toBeGreaterThan(anchor.right);
    expect(badge.top).toBeLessThan(anchor.top);
    expect(badge.bottom).toBeGreaterThan(anchor.top);
  });

  it("sits on the corner its placement names", async () => {
    const { anchor, badge } = await rects(await renderAnchored("bottom-left"));

    expect(badge.left).toBeLessThan(anchor.left);
    expect(badge.right).toBeGreaterThan(anchor.left);
    expect(badge.top).toBeLessThan(anchor.bottom);
    expect(badge.bottom).toBeGreaterThan(anchor.bottom);
  });

  it("mirrors its corner in right-to-left", async () => {
    const screen = await render(
      <div dir="rtl">
        <Badge.Anchor data-testid="anchor">
          <span
            style={{
              display: "block",
              inlineSize: ANCHOR_SIZE,
              blockSize: ANCHOR_SIZE
            }}
          />
          <Badge>5</Badge>
        </Badge.Anchor>
      </div>
    );
    const { anchor, badge } = await rects(screen);

    // Top-right reads as top-left: the start of the line, still at the top
    expect(badge.left).toBeLessThan(anchor.left);
    expect(badge.right).toBeGreaterThan(anchor.left);
    expect(badge.top).toBeLessThan(anchor.top);
  });

  it("sits inline, after its text, outside an anchor", async () => {
    const screen = await render(
      <p>
        <span>Selected layers</span> <Badge data-testid="badge">1</Badge>
      </p>
    );

    const badge = screen.getByTestId("badge").element();
    expect(getComputedStyle(badge).position).toBe("static");
    expect(badge.getBoundingClientRect().left).toBeGreaterThan(
      screen.getByText("Selected layers").element().getBoundingClientRect().left
    );
  });

  it("forwards its ref to the badge element", async () => {
    const ref = createRef<HTMLSpanElement>();
    await render(<Badge ref={ref}>5</Badge>);

    expect(ref.current?.getAttribute("data-tds")).toBe("badge");
  });
});
