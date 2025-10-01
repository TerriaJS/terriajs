import { Feature } from "protomaps-leaflet";

export type AttrOption<T> = T | ((zoom: number, f?: Feature) => T);

export function getAttrValue<T>(
  attrOption: AttrOption<T>,
  zoom: number,
  f: Feature
): T {
  return typeof attrOption === "function"
    ? (attrOption as any)(zoom, f)
    : attrOption;
}
