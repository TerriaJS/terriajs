import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { ScrollShadow, type ScrollShadowProps } from ".";

const LAYERS = Array.from({ length: 20 }, (_, i) => `Layer ${String(i + 1)}`);

// 100px tall or wide, holding 20 rows of 20px: more than fits
const renderLayers = async (
  props: ScrollShadowProps = {}
): Promise<HTMLElement> => {
  const horizontal = props.orientation === "horizontal";
  const screen = await render(
    <ScrollShadow
      data-testid="scroll"
      style={
        horizontal ? { inlineSize: 100, display: "flex" } : { blockSize: 100 }
      }
      {...props}
    >
      {LAYERS.map((layer) => (
        <div
          key={layer}
          style={
            horizontal
              ? { flex: "none", inlineSize: 20 }
              : { blockSize: 20, overflow: "hidden" }
          }
        >
          {layer}
        </div>
      ))}
    </ScrollShadow>
  );
  return screen.getByTestId("scroll").element() as HTMLElement;
};

// Which ends shadow, read from the data attributes, as HeroUI names them
const shadows = (el: HTMLElement): string => {
  const { dataset } = el;
  if (dataset["topBottomScroll"] === "true") return "top-bottom";
  if (dataset["leftRightScroll"] === "true") return "left-right";
  for (const end of ["top", "bottom", "left", "right"]) {
    if (dataset[`${end}Scroll`] === "true") return end;
  }
  return "none";
};

// Two frames: long enough for a scroll or resize to have been handled
const settle = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });

describe("ScrollShadow", () => {
  it("scrolls what doesn't fit", async () => {
    const scroll = await renderLayers();

    expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight);
    scroll.scrollTop = 40;
    expect(scroll.scrollTop).toBe(40);
  });

  it("shadows only the bottom at the top", async () => {
    const scroll = await renderLayers();

    await expect.poll(() => shadows(scroll)).toBe("bottom");
  });

  it("shadows both ends partway through", async () => {
    const scroll = await renderLayers();

    scroll.scrollTop = 100;

    await expect.poll(() => shadows(scroll)).toBe("top-bottom");
  });

  it("shadows only the top at the bottom", async () => {
    const scroll = await renderLayers();

    scroll.scrollTop = scroll.scrollHeight;

    await expect.poll(() => shadows(scroll)).toBe("top");
  });

  it("shadows neither end when everything fits", async () => {
    const screen = await render(
      <ScrollShadow data-testid="scroll">
        <p>Suburbs 2021</p>
      </ScrollShadow>
    );
    const scroll = screen.getByTestId("scroll").element() as HTMLElement;
    await settle();

    expect(shadows(scroll)).toBe("none");
  });

  it("scrolls sideways when horizontal, shadowing left and right", async () => {
    const scroll = await renderLayers({ orientation: "horizontal" });

    expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
    await expect.poll(() => shadows(scroll)).toBe("right");

    scroll.scrollLeft = scroll.scrollWidth;

    await expect.poll(() => shadows(scroll)).toBe("left");
  });

  it("marks its orientation and mode", async () => {
    const scroll = await renderLayers();

    expect(scroll).toHaveAttribute("data-orientation", "vertical");
    expect(scroll).toHaveAttribute("data-scroll-shadow-mode", "auto");
  });

  // The stylesheet's defaults, from the tokens, unless the props set them
  it("sizes its shadow and offset from the stylesheet unless given them", async () => {
    const shadow = (el: HTMLElement, name: string): string =>
      getComputedStyle(el).getPropertyValue(
        `--terria-ds-scroll-shadow-${name}`
      );

    const plain = await renderLayers();
    expect(plain.style.getPropertyValue("--terria-ds-scroll-shadow-size")).toBe(
      ""
    );
    expect(shadow(plain, "size")).toBe("2.5rem");
    expect(shadow(plain, "offset")).toBe("0px");
  });

  it("sizes its shadow and offset from its props", async () => {
    const scroll = await renderLayers({ size: 24, offset: 8 });

    expect(
      scroll.style.getPropertyValue("--terria-ds-scroll-shadow-size")
    ).toBe("24px");
    expect(
      scroll.style.getPropertyValue("--terria-ds-scroll-shadow-offset")
    ).toBe("8px");
  });

  it("defaults to the fade variant", async () => {
    const scroll = await renderLayers();

    expect(scroll).toHaveAttribute("data-tds-variant", "fade");
  });

  it("marks the blur variant", async () => {
    const scroll = await renderLayers({ variant: "blur" });

    expect(scroll).toHaveAttribute("data-tds-variant", "blur");
  });

  it("can hide its scrollbar", async () => {
    const scroll = await renderLayers({ hideScrollBar: true });

    expect(getComputedStyle(scroll).scrollbarWidth).toBe("none");
  });

  it("takes a className, other props and a ref", async () => {
    const ref = createRef<HTMLDivElement>();
    const screen = await render(
      <ScrollShadow
        ref={ref}
        className="legend"
        role="region"
        aria-label="Legend"
      />
    );

    const scroll = screen.getByRole("region", { name: "Legend" });
    await expect.element(scroll).toHaveClass("legend");
    expect(ref.current).toBe(scroll.element());
  });

  it("keeps its own data-tds, and scrolling, when given another", async () => {
    const screen = await render(
      <ScrollShadow
        data-testid="scroll"
        data-tds="layers"
        style={{ blockSize: 100 }}
      >
        <div style={{ blockSize: 400 }} />
      </ScrollShadow>
    );
    const scroll = screen.getByTestId("scroll").element() as HTMLElement;

    expect(scroll).toHaveAttribute("data-tds", "scroll-shadow");
    scroll.scrollTop = 40;
    expect(scroll.scrollTop).toBe(40);
  });
});

// Content changing inside it without it rendering again, as when a child
// component loads more. No scrollbar, so its box never resizes
describe("ScrollShadow, as content changes", () => {
  const row = (name: string): HTMLDivElement => {
    const div = document.createElement("div");
    div.textContent = name;
    div.style.blockSize = "20px";
    return div;
  };

  it("shadows the bottom once rows are added past what fits", async () => {
    const screen = await render(
      <ScrollShadow
        data-testid="scroll"
        hideScrollBar
        style={{ blockSize: 100 }}
      >
        <div style={{ blockSize: 20 }}>Suburbs</div>
      </ScrollShadow>
    );
    const scroll = screen.getByTestId("scroll").element() as HTMLElement;
    await settle();
    expect(shadows(scroll)).toBe("none");

    scroll.append(...LAYERS.map(row));

    await expect.poll(() => shadows(scroll)).toBe("bottom");
  });

  it("shadows the bottom once a row grows past what fits", async () => {
    const screen = await render(
      <ScrollShadow
        data-testid="scroll"
        hideScrollBar
        style={{ blockSize: 100 }}
      >
        <div data-testid="row" style={{ blockSize: 20 }}>
          Suburbs
        </div>
      </ScrollShadow>
    );
    const scroll = screen.getByTestId("scroll").element() as HTMLElement;
    await settle();
    expect(shadows(scroll)).toBe("none");

    (screen.getByTestId("row").element() as HTMLElement).style.blockSize =
      "300px";

    await expect.poll(() => shadows(scroll)).toBe("bottom");
  });
});

describe("ScrollShadow offset", () => {
  it("waits until scrolled past the offset to shadow the top", async () => {
    const scroll = await renderLayers({ offset: 30 });

    scroll.scrollTop = 20;
    await settle();
    expect(shadows(scroll)).toBe("bottom");

    scroll.scrollTop = 40;
    await expect.poll(() => shadows(scroll)).toBe("top-bottom");
  });

  it("stops shadowing the bottom within the offset of it", async () => {
    const scroll = await renderLayers({ offset: 30 });
    const max = scroll.scrollHeight - scroll.clientHeight;

    scroll.scrollTop = max - 40;
    await expect.poll(() => shadows(scroll)).toBe("top-bottom");

    scroll.scrollTop = max - 20;
    await expect.poll(() => shadows(scroll)).toBe("top");
  });

  it("sets the offset as a custom property", async () => {
    const scroll = await renderLayers({ offset: 30 });

    expect(
      scroll.style.getPropertyValue("--terria-ds-scroll-shadow-offset")
    ).toBe("30px");
  });
});

describe("ScrollShadow without detection", () => {
  it("shadows neither end when isEnabled is false", async () => {
    const scroll = await renderLayers({ isEnabled: false });

    scroll.scrollTop = 100;
    await settle();

    expect(shadows(scroll)).toBe("none");
    expect(scroll).toHaveAttribute("data-scroll-shadow-mode", "manual");
  });
});

describe("ScrollShadow controlled visibility", () => {
  it.each([
    ["both", "top-bottom"],
    ["top", "top"],
    ["bottom", "bottom"],
    ["none", "none"]
  ] as const)(
    "shadows what %s says, wherever it's scrolled",
    async (visibility, shown) => {
      const scroll = await renderLayers({ visibility });

      scroll.scrollTop = 100;
      await settle();

      expect(shadows(scroll)).toBe(shown);
      expect(scroll).toHaveAttribute("data-scroll-shadow-mode", "manual");
    }
  );

  it("reads both as left and right when horizontal", async () => {
    const scroll = await renderLayers({
      orientation: "horizontal",
      visibility: "both"
    });

    expect(shadows(scroll)).toBe("left-right");
  });

  it("says which ends shadow as it's scrolled", async () => {
    const onVisibilityChange = vi.fn();
    const scroll = await renderLayers({ onVisibilityChange });

    await expect
      .poll(() => onVisibilityChange)
      .toHaveBeenLastCalledWith("bottom");

    scroll.scrollTop = 100;
    await expect
      .poll(() => onVisibilityChange)
      .toHaveBeenLastCalledWith("both");

    scroll.scrollTop = scroll.scrollHeight;
    await expect.poll(() => onVisibilityChange).toHaveBeenLastCalledWith("top");
  });

  it("says left and right when horizontal, and none when it all fits", async () => {
    const onVisibilityChange = vi.fn();
    const scroll = await renderLayers({
      orientation: "horizontal",
      onVisibilityChange
    });

    await expect
      .poll(() => onVisibilityChange)
      .toHaveBeenLastCalledWith("right");

    scroll.scrollLeft = scroll.scrollWidth;
    await expect
      .poll(() => onVisibilityChange)
      .toHaveBeenLastCalledWith("left");

    scroll.style.inlineSize = "1000px";
    await expect
      .poll(() => onVisibilityChange)
      .toHaveBeenLastCalledWith("none");
  });

  it("says each change once, not on every render", async () => {
    const onVisibilityChange = vi.fn();
    const scroll = await renderLayers({ onVisibilityChange });
    await expect.poll(() => onVisibilityChange).toHaveBeenCalledOnce();

    scroll.scrollTop = 10;
    scroll.scrollTop = 20;
    await expect.poll(() => onVisibilityChange).toHaveBeenCalledTimes(2);
    await settle();
    expect(onVisibilityChange).toHaveBeenCalledTimes(2);
  });
});

// The fade leaves the scrollbar's strip solid. Scrollbars that overlay the
// content, as on macOS, take no room, so no strip is left
describe("ScrollShadow scrollbar strip", () => {
  const strip = (el: HTMLElement): string =>
    el.style.getPropertyValue("--terria-ds-scroll-shadow-scrollbar-size");

  it("is as wide as the scrollbar, when vertical", async () => {
    const scroll = await renderLayers();

    await expect
      .poll(() => strip(scroll))
      .toBe(`${String(scroll.offsetWidth - scroll.clientWidth)}px`);
  });

  it("is as tall as the scrollbar, when horizontal", async () => {
    const scroll = await renderLayers({ orientation: "horizontal" });

    await expect
      .poll(() => strip(scroll))
      .toBe(`${String(scroll.offsetHeight - scroll.clientHeight)}px`);
  });

  it("is gone with the scrollbar hidden", async () => {
    const scroll = await renderLayers({ hideScrollBar: true });

    await expect.poll(() => strip(scroll)).toBe("0px");
  });
});
