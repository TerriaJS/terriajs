import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

describe("reset.css", () => {
  it("fits media to its container", async () => {
    const screen = await render(<canvas data-testid="canvas" />);

    expect(
      getComputedStyle(screen.getByTestId("canvas").element()).maxInlineSize
    ).toBe("100%");
  });

  it("leaves alone what's inside data-tds-no-reset, like a map library's own DOM", async () => {
    const screen = await render(
      <div data-tds-no-reset>
        <canvas data-testid="canvas" />
        <div data-testid="pane" />
      </div>
    );

    const canvas = getComputedStyle(screen.getByTestId("canvas").element());
    expect(canvas.maxInlineSize).toBe("none");
    expect(canvas.display).toBe("inline");
    expect(
      getComputedStyle(screen.getByTestId("pane").element()).boxSizing
    ).toBe("content-box");
  });
});
