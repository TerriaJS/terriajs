import { optimize } from "svgo";

// The parts of a Figma REST API node the icon search reads
type FigmaNode = {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
};

type IconStyle = "regular" | "filled";

type Icon = { id: string; name: string; style: IconStyle };

const PREFIX = "terria-icons/";
const VARIANT = /^style=(regular|filled)$/;

// Every icon component under a node: a component named terria-icons/<name>,
// or a style=regular or style=filled component in a terria-icons/<name> frame
const findIcons = (node: FigmaNode, group?: string): Icon[] => {
  if (node.type === "COMPONENT") {
    if (node.name.startsWith(PREFIX)) {
      return [
        { id: node.id, name: node.name.slice(PREFIX.length), style: "regular" }
      ];
    }
    const variant = VARIANT.exec(node.name)?.[1];
    if (group && (variant === "regular" || variant === "filled")) {
      return [{ id: node.id, name: group, style: variant }];
    }
    return [];
  }
  const name = node.name.startsWith(PREFIX)
    ? node.name.slice(PREFIX.length)
    : undefined;
  return (node.children ?? []).flatMap((child) => findIcons(child, name));
};

const VIEW_BOX = "0 0 24 24";
const COLOR = /\b(?:fill|stroke)="([^"]+)"/g;

// An exported icon, ready to commit: drawn in currentColor so it takes the
// text colour, sized by its viewBox only, and minified. Rejects what
// currentColor or the 24px grid can't represent
const normalizeSvg = (name: string, svg: string): string => {
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1];
  if (viewBox !== VIEW_BOX) {
    throw new Error(`${name}: viewBox is ${String(viewBox)}, not ${VIEW_BOX}`);
  }
  const colors = new Set(
    [...svg.matchAll(COLOR)]
      .map(([, color]) => color?.toLowerCase())
      .filter(
        (color): color is string =>
          color !== undefined && color !== "none" && color !== "currentcolor"
      )
  );
  if (colors.size > 1) {
    throw new Error(
      `${name}: drawn in more than one colour (${[...colors].join(", ")})`
    );
  }
  return optimize(svg, {
    multipass: true,
    plugins: [
      "preset-default",
      "removeDimensions",
      { name: "convertColors", params: { currentColor: true } }
    ]
  }).data;
};

type IconFile = { id: string; path: string; svg: string };

// One file per path. Figma can hold the same icon twice; that's fine when
// they're drawn the same, and an error when two different icons would
// overwrite each other
const resolveIcons = (files: IconFile[]): IconFile[] => {
  const byPath = new Map<string, IconFile[]>();
  for (const file of files) {
    byPath.set(file.path, [...(byPath.get(file.path) ?? []), file]);
  }
  return [...byPath.entries()].map(([path, copies]) => {
    const [first, ...rest] = copies;
    if (!first) throw new Error(`${path}: no icon`);
    if (rest.some((copy) => copy.svg !== first.svg)) {
      throw new Error(
        `${path}: different icons share this name (Figma nodes ${copies
          .map((copy) => copy.id)
          .join(", ")})`
      );
    }
    return first;
  });
};

export { findIcons, normalizeSvg, resolveIcons };
export type { FigmaNode, IconStyle, Icon, IconFile };
