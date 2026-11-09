import { describe, expect, it } from "vitest";
import { page, type Locator } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Chip } from "../../Chip";
import { Surface } from "../../Surface";
import { ScrollShadow, type ScrollShadowProps } from "..";
import "../scroll-shadow.stories.css";

const LAYERS = [
  "Suburbs 2021",
  "Population density",
  "Median household income",
  "Bushfire-prone land",
  "Flood planning area",
  "Heritage items",
  "Public transport stops",
  "Bike paths",
  "Schools",
  "Hospitals",
  "Parks and reserves",
  "Land zoning"
];

// A list of map layers, taller than its box
const layers = (props: ScrollShadowProps = {}): React.ReactElement => (
  <ScrollShadow className="scroll-shadow-stories-list" tabIndex={0} {...props}>
    {LAYERS.map((layer) => (
      <p key={layer} className="scroll-shadow-stories-item">
        {layer}
      </p>
    ))}
  </ScrollShadow>
);

// A row of chips, wider than its box
const chips = (props: ScrollShadowProps = {}): React.ReactElement => (
  <ScrollShadow
    className="scroll-shadow-stories-strip"
    tabIndex={0}
    orientation="horizontal"
    {...props}
  >
    <div className="scroll-shadow-stories-row">
      {LAYERS.map((layer) => (
        <Chip key={layer}>{layer}</Chip>
      ))}
    </div>
  </ScrollShadow>
);

const area = (): Locator =>
  page.elementLocator(
    document.querySelector('[data-tds="scroll-shadow"]') ?? document.body
  );

// Scrolls as a person would, then waits for the shadows to follow: the
// component marks which ends have more past them, a frame later
const scrollTo = async (
  where: "start" | "middle" | "end",
  shadows: Record<string, string>
): Promise<void> => {
  const element = area().element() as HTMLElement;
  const vertical = element.dataset["orientation"] === "vertical";
  const length = vertical
    ? element.scrollHeight - element.clientHeight
    : element.scrollWidth - element.clientWidth;
  const position = { start: 0, middle: length / 2, end: length }[where];
  element.scrollTo(vertical ? { top: position } : { left: position });
  for (const [attribute, value] of Object.entries(shadows)) {
    await expect.element(area()).toHaveAttribute(attribute, value);
  }
};

const VERTICAL = {
  start: { "data-bottom-scroll": "true", "data-top-scroll": "false" },
  middle: { "data-top-bottom-scroll": "true" },
  end: { "data-top-scroll": "true", "data-bottom-scroll": "false" }
};

const HORIZONTAL = {
  start: { "data-right-scroll": "true", "data-left-scroll": "false" },
  middle: { "data-left-right-scroll": "true" },
  end: { "data-left-scroll": "true", "data-right-scroll": "false" }
};

// snap(), but leaving animations be: Vitest's screenshots otherwise stop
// them, which leaves the fade's scroll-driven animations without a timeline,
// so it never shows. The test setup already keeps time-based ones still
const snap = async (): Promise<void> => {
  const name = expect.getState().currentTestName ?? "screenshot";
  const container = area().element().closest("body > div") ?? document.body;
  for (const theme of ["light", "dark"]) {
    document.documentElement.setAttribute("data-theme", theme);
    await expect(page.elementLocator(container)).toMatchScreenshot(
      `${name} ${theme}`,
      { screenshotOptions: { animations: "allow" } }
    );
  }
};

const POSITIONS = ["start", "middle", "end"] as const;

describe.each(["fade", "blur"] as const)("ScrollShadow %s", (variant) => {
  it.each(POSITIONS)("vertical, scrolled to the %s", async (where) => {
    await render(layers({ variant }));
    await scrollTo(where, VERTICAL[where]);
    await snap();
  });

  it.each(POSITIONS)("horizontal, scrolled to the %s", async (where) => {
    await render(chips({ variant }));
    await scrollTo(where, HORIZONTAL[where]);
    await snap();
  });

  it("hidden scrollbar, scrolled to the middle", async () => {
    await render(layers({ variant, hideScrollBar: true }));
    await scrollTo("middle", VERTICAL.middle);
    await snap();
  });
});

describe("ScrollShadow", () => {
  // The blur takes the surface's tint, not the page's
  it("blur on a surface, scrolled to the middle", async () => {
    await render(
      <Surface className="scroll-shadow-stories-surface">
        {layers({ variant: "blur" })}
      </Surface>
    );
    await scrollTo("middle", VERTICAL.middle);
    await snap();
  });

  // Set by visibility, not the scroll
  it("controlled, bottom only", async () => {
    await render(layers({ visibility: "bottom" }));
    await expect.element(area()).toHaveAttribute("data-bottom-scroll", "true");
    await snap();
  });
});
