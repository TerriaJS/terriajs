import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

describe("typography.css", () => {
  it("gives tds-numeric figures of equal width, so changing numbers don't shift", async () => {
    const screen = await render(<span className="tds-numeric">1,234.56</span>);

    expect(
      getComputedStyle(screen.getByText("1,234.56").element())
        .fontVariantNumeric
    ).toBe("tabular-nums");
  });

  it("keeps the room above a heading that directly follows another in tds-flow", async () => {
    const screen = await render(
      <div className="tds-flow">
        <h2>Guidelines</h2>
        <h3>Headings</h3>
        <p>Choose the level by structure.</p>
      </div>
    );

    const heading = screen.getByRole("heading", { name: "Headings" }).element();
    const paragraph = screen
      .getByText("Choose the level by structure.")
      .element();
    // 1.5em of the 24px heading above it; the text after it keeps the tight
    // 0.5em, of its own 16px
    expect(getComputedStyle(heading).marginBlockStart).toBe("36px");
    expect(getComputedStyle(paragraph).marginBlockStart).toBe("8px");
  });
});
