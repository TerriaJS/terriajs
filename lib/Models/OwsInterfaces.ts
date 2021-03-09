import filterOutUndefined from "../Core/filterOutUndefined";
import { isJsonObject, isJsonString } from "../Core/Json";

export interface OnlineResource {
  "xlink:type"?: string;
  "xlink:href": string;
}

export interface CapabilitiesStyle {
  readonly Identifier: string;
  readonly Name: string;
  readonly Title: string;
  readonly Abstract?: string;
  readonly Keywords?: string;
  readonly LegendURL?: CapabilitiesLegend | ReadonlyArray<CapabilitiesLegend>;
}

export interface CapabilitiesLegend {
  readonly OnlineResource?: OnlineResource;
  readonly MinScaleDenominator?: number;
  readonly MaxScaleDenominator?: number;
  readonly Format?: string;
  readonly width?: number;
  readonly height?: number;
}

export interface OwsKeywordList {
  readonly Keyword: string | string[];
  readonly type?: string;
}

export function parseOwsKeywordList(json: any): OwsKeywordList | undefined {
  if (!isJsonObject(json)) return undefined;
  const type = isJsonString(json.type) ? json.type : undefined;
  const Keyword = isJsonString(json.Keyword)
    ? json.Keyword
    : Array.isArray(json.Keyword)
    ? filterOutUndefined(
        json.Keyword.map(s => (isJsonString(s) ? s : undefined))
      )
    : [];
  return {
    type,
    Keyword
  };
}

export function parseOnlineResource(json: any): OnlineResource | undefined {
  if (!isJsonObject(json)) return undefined;

  const href = isJsonString(json["xlink:href"])
    ? json["xlink:href"]
    : undefined;
  if (href === undefined) return;

  const type = isJsonString(json["xlink:type"])
    ? json["xlink:type"]
    : undefined;

  return {
    "xlink:type": type,
    "xlink:href": href
  };
}
