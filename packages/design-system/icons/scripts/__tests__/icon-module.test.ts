import { describe, expect, it } from "vitest";
import {
  exportName,
  renderIndex,
  renderNames,
  renderSprite,
  spriteId
} from "../icon-module.ts";

describe("exportName", () => {
  it("names an icon's component in PascalCase, ending in Icon", () => {
    expect(exportName("chevron-down", "regular")).toBe("ChevronDownIcon");
    expect(exportName("share-2", "regular")).toBe("Share2Icon");
  });

  it("marks the filled variant in the name", () => {
    expect(exportName("alert-triangle", "filled")).toBe(
      "AlertTriangleFilledIcon"
    );
  });
});

describe("renderIndex", () => {
  it("re-exports every icon from its file", () => {
    const file = renderIndex(["MapIcon", "XIcon"]);

    expect(file).toContain('export { MapIcon } from "./MapIcon";');
    expect(file).toContain('export { XIcon } from "./XIcon";');
  });
});

describe("renderSprite", () => {
  it("makes each icon a symbol, named by its file, that <use> can draw", () => {
    const sprite = renderSprite([
      {
        id: "map",
        svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M1 1h2"/></svg>'
      }
    ]);

    expect(sprite).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg"><symbol id="map" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M1 1h2"/></symbol></svg>\n'
    );
  });
});

describe("spriteId", () => {
  it("names an icon's symbol by its file, marking the filled variant", () => {
    expect(spriteId("map-pin", "regular")).toBe("map-pin");
    expect(spriteId("map-pin", "filled")).toBe("map-pin-filled");
  });
});

describe("renderNames", () => {
  it("types the sprite's ids, so a wrong one doesn't compile", () => {
    expect(renderNames(["map", "x"])).toContain(
      'export type IconName = "map" | "x";'
    );
  });
});
