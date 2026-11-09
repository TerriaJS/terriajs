import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { snap } from "../../../visual";
import { Button } from "../../Button";
import { Surface, type SurfaceVariant } from "..";
import "../surface.stories.css";

const VARIANTS: SurfaceVariant[] = [
  "default",
  "secondary",
  "tertiary",
  "transparent"
];

const surface = (variant: SurfaceVariant): React.ReactElement => (
  <Surface variant={variant}>
    <div className="surface-stories-content">
      <strong>Suburbs 2021</strong>
      <p>Population counts by suburb from the 2021 census.</p>
      <Button size="sm" variant="secondary">
        Add to the map
      </Button>
    </div>
  </Surface>
);

describe.each(VARIANTS)("Surface %s", (variant) => {
  it("default", async () => {
    await render(surface(variant));
    await snap();
  });

  // Over a busy background, like the map, which it blurs
  it("over the map", async () => {
    await render(<div className="surface-stories-map">{surface(variant)}</div>);
    await snap();
  });
});
