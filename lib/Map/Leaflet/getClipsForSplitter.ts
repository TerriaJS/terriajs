type Point = { readonly x: number; readonly y: number };

type ClipInputs = {
  readonly size: Point;
  readonly nw: Point;
  readonly se: Point;
  readonly splitPosition: number;
};

type ClipResult = {
  readonly left: string;
  readonly right: string;
  readonly clipX: number;
};

export default function getClipsForSplitter({
  size,
  nw,
  se,
  splitPosition
}: ClipInputs): ClipResult {
  const clipX = Math.round(nw.x + size.x * splitPosition);
  const left =
    `polygon(${nw.x}px ${nw.y}px, ${clipX}px ${nw.y}px, ` +
    `${clipX}px ${se.y}px, ${nw.x}px ${se.y}px)`;
  const right =
    `polygon(${clipX}px ${nw.y}px, ${se.x}px ${nw.y}px, ` +
    `${se.x}px ${se.y}px, ${clipX}px ${se.y}px)`;

  return { left, right, clipX };
}
