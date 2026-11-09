import { describe, expect, it } from "vitest";
import {
  findIcons,
  normalizeSvg,
  resolveIcons,
  type FigmaNode
} from "../icons.ts";

const component = (id: string, name: string): FigmaNode => ({
  id,
  name,
  type: "COMPONENT"
});

const frame = (id: string, name: string, children: FigmaNode[]): FigmaNode => ({
  id,
  name,
  type: "FRAME",
  children
});

describe("findIcons", () => {
  it("finds every terria-icons component as a regular icon, however deep", () => {
    const page = frame("0:1", "Icons", [
      frame("1:1", "icons", [component("2:1", "terria-icons/map")]),
      component("2:2", "terria-icons/chevron-down")
    ]);

    expect(findIcons(page)).toEqual([
      { id: "2:1", name: "map", style: "regular" },
      { id: "2:2", name: "chevron-down", style: "regular" }
    ]);
  });

  it("finds the filled and regular variants inside a terria-icons frame", () => {
    const page = frame("0:1", "Icons", [
      frame("1:1", "terria-icons/alert-triangle", [
        component("2:1", "style=filled"),
        component("2:2", "style=regular")
      ])
    ]);

    expect(findIcons(page)).toEqual([
      { id: "2:1", name: "alert-triangle", style: "filled" },
      { id: "2:2", name: "alert-triangle", style: "regular" }
    ]);
  });

  it("leaves out anything that isn't a named icon component", () => {
    const page = frame("0:1", "Icons", [
      component("2:1", "placeholder"),
      frame("2:2", "terria-icons/not-a-component", []),
      { id: "2:3", name: "terria-icons/label", type: "TEXT" }
    ]);

    expect(findIcons(page)).toEqual([]);
  });
});

const exported = (body: string, viewBox = "0 0 24 24"): string =>
  `<svg width="24" height="24" viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

describe("normalizeSvg", () => {
  it("draws the icon in currentColor, so it takes the text colour", () => {
    const svg = normalizeSvg(
      "map",
      exported('<path d="M2 2h20v20H2z" fill="#111827"/>')
    );

    expect(svg).toContain('fill="currentColor"');
    expect(svg).not.toContain("#111827");
  });

  it("keeps the viewBox and drops the fixed size, so it scales", () => {
    const svg = normalizeSvg(
      "map",
      exported('<path d="M2 2h20v20H2z" fill="#111827"/>')
    );

    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).not.toMatch(/\b(width|height)=/);
  });

  it("rejects an icon in more than one colour, which currentColor would lose", () => {
    expect(() =>
      normalizeSvg(
        "flag",
        exported(
          '<path d="M2 2h10v10H2z" fill="#111827"/><path d="M12 12h10v10H12z" fill="#dc2626"/>'
        )
      )
    ).toThrow(/flag.*more than one colour/);
  });

  it("rejects an icon that isn't drawn on the 24×24 grid", () => {
    expect(() =>
      normalizeSvg(
        "map",
        exported('<path d="M2 2h12v12H2z" fill="#111827"/>', "0 0 16 16")
      )
    ).toThrow(/map.*0 0 16 16/);
  });
});

describe("resolveIcons", () => {
  it("keeps one copy of an icon that appears twice, drawn the same", () => {
    const icons = resolveIcons([
      { id: "1:1", path: "map.svg", svg: "<svg>a</svg>" },
      { id: "1:2", path: "map.svg", svg: "<svg>a</svg>" }
    ]);

    expect(icons).toEqual([
      { id: "1:1", path: "map.svg", svg: "<svg>a</svg>" }
    ]);
  });

  it("rejects two different icons with the same name, naming both", () => {
    expect(() =>
      resolveIcons([
        { id: "1:1", path: "photo-plus.svg", svg: "<svg>a</svg>" },
        { id: "1:2", path: "photo-plus.svg", svg: "<svg>b</svg>" }
      ])
    ).toThrow(/photo-plus\.svg.*1:1.*1:2/);
  });
});
