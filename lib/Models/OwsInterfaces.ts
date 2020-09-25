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
