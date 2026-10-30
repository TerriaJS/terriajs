import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { snap } from "../../../visual";
import { Separator, type SeparatorVariant } from "..";
import "./separator.visual.css";

const VARIANTS: SeparatorVariant[] = ["primary", "secondary", "tertiary"];

describe.each(VARIANTS)("Separator %s", (variant) => {
  it("horizontal", async () => {
    await render(
      <div className="separator-visual-column">
        <span>Layers</span>
        <Separator variant={variant} />
        <span>Base maps</span>
      </div>
    );
    await snap();
  });

  it("vertical", async () => {
    await render(
      <div className="separator-visual-row">
        <span>Zoom</span>
        <Separator variant={variant} orientation="vertical" />
        <span>Measure</span>
        <Separator variant={variant} orientation="vertical" />
        <span>Share</span>
      </div>
    );
    await snap();
  });
});
