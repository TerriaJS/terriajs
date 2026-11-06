import designSystemLayers from "@terria/design-system/layers.css?raw";
import { describe, expect, it } from "vitest";
import { LAYER_ORDER } from "../layerOrder";

describe("layerOrder", () => {
  it("puts the cascade layers' order first in the page", () => {
    expect(document.head.firstElementChild?.textContent).toBe(LAYER_ORDER);
  });

  it("keeps the design system's own order, with the new UI's layers after it", () => {
    // The statement, not the mentions of @layer in its comment
    const declared = /^@layer ([^;{]+);/m.exec(designSystemLayers)?.[1];
    expect(LAYER_ORDER).toBe(
      `@layer ${String(declared)}, tjs.components, tjs.overrides;`
    );
  });
});
