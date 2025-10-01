import Point from "@mapbox/point-geometry";
import {
  CenteredSymbolizer,
  Feature,
  Label,
  LabelSymbolizer,
  Layout,
  LineLabelSymbolizer,
  OffsetSymbolizer,
  TextPlacements,
  TextSymbolizer,
  TextSymbolizerOptions
} from "protomaps-leaflet";
import { AttrOption, getAttrValue } from "./attr";

interface CustomLabelSymbolizerOptions extends TextSymbolizerOptions {
  textField: (zoom?: number, f?: Feature) => string | undefined;
  textOffset?: (zoom?: number, f?: Feature) => number[] | undefined;
  textAnchor?: (zoom?: number, f?: Feature) => string | undefined;
  textVariableAnchor?: (zoom?: number, f?: Feature) => string[] | undefined;
  symbolPlacement: (zoom?: number, f?: Feature) => string | undefined;
  rotationAlignment?: (zoom?: number, f?: Feature) => string | undefined;
}

/**
 * A text label symbolizer that places the label along a line or at a point
 */
export default class CustomLabelSymbolizer implements LabelSymbolizer {
  readonly options;

  readonly getText: (zoom: number, f: Feature) => string | undefined;

  constructor(options: CustomLabelSymbolizerOptions) {
    this.options = options;

    // Method to override default protomaps text getter
    this.getText = (z: number, f: Feature) => {
      const value = this.options.textField(z, f);
      // return undefined for blank strings avoid an infinite loop bug in protomaps
      // This happens here when the computed spacing is 0 and the loop doesn't advance:
      // https://github.com/protomaps/protomaps-leaflet/blob/a5f2c0c8888f4e95bfbda0f7bb5a85be20511eec/src/line.ts#L143
      return value?.trim() ? value : undefined;
    };
  }

  place(
    layout: Layout,
    geom: Point[][],
    feature: Feature
  ): Label[] | undefined {
    const zoom = layout.zoom;
    const symbolPlacement = this.options.symbolPlacement(zoom, feature);
    const rotationAlignment =
      this.options.rotationAlignment?.(zoom, feature) ?? "auto";

    // line placement is ignored when text-rotation-alignment is viewport
    if (rotationAlignment !== "viewport" && symbolPlacement === "line") {
      return this.lineLabelSymbolizer.place(layout, geom, feature);
    } else {
      return this.placeWithOffset(
        layout,
        geom,
        feature,
        this.pointLabelSymbolizer
      );
    }
  }

  get lineLabelSymbolizer() {
    const lineLabelSymbolizer = new LineLabelSymbolizer(this.options);
    lineLabelSymbolizer.text.get = this.getText;
    return lineLabelSymbolizer;
  }

  get pointLabelSymbolizer() {
    const textSymbolizer = new TextSymbolizer(this.options);
    textSymbolizer.text.get = this.getText;
    return textSymbolizer;
  }

  /**
   * Place at an offset if it is defined
   */
  placeWithOffset(
    layout: Layout,
    geom: Point[][],
    feature: Feature,
    symbolizer: LabelSymbolizer
  ) {
    // If text-anchor is specified place using OffsetSymbolizer, otherwise use CenteredSymbolizer
    const zoom = layout.zoom;
    const textAnchor = this.options.textAnchor?.(zoom, feature);
    const textVariableAnchor = this.options.textVariableAnchor?.(zoom, feature);

    // text-variable-anchor overrides text-anchor
    const placements = textVariableAnchor
      ? anchorsToPlacements(textVariableAnchor)
      : textAnchor
      ? anchorsToPlacements([textAnchor])
      : undefined;

    // Use a centered symbolizer when no placements specified
    if (!placements?.length) {
      return new CenteredSymbolizer(symbolizer).place(layout, geom, feature);
    }

    const [offsetX, offsetY] =
      computeOffsetPixels(
        zoom,
        feature,
        this.options.textOffset,
        this.options.fontSize
      ) ?? [];

    return new OffsetSymbolizer(symbolizer, {
      placements,
      offsetX,
      offsetY
    }).place(layout, geom, feature);
  }
}

/**
 * Compute pixel offset given offset in `em` units and font size.
 */
function computeOffsetPixels(
  zoom: number,
  feature: Feature,
  offsetOpt: AttrOption<number[] | undefined> | undefined,
  fontSizeOpt: AttrOption<number> | undefined
) {
  const textOffset = getAttrValue(offsetOpt, zoom, feature);
  if (!textOffset || !Array.isArray(textOffset)) {
    return;
  }

  const [xem, yem] = textOffset;
  if (typeof xem !== "number" || typeof yem !== "number") {
    return;
  }

  const fontSize = getAttrValue(fontSizeOpt, zoom, feature) ?? 16;
  return [xem * fontSize, yem * fontSize];
}

const anchorToPlacementMapping: Record<string, TextPlacements> = {
  // Follows:
  // https://docs.mapbox.com/style-spec/reference/layers/?size=n_10_n#layout-symbol-text-anchor

  // left side of the text is placed closed to the anchor so the text appears to the right of anchor
  left: TextPlacements.E,
  right: TextPlacements.W,

  // top of the text is placed closed to the anchor so that the text appears below the anchor
  top: TextPlacements.S,
  bottom: TextPlacements.N
};

/**
 * Convert anchor strings to equivalent TextPlacements
 */
const anchorsToPlacements = (anchors: any[]) => {
  const placements: TextPlacements[] = [];
  anchors.forEach((anchor) => {
    if (anchor in anchorToPlacementMapping) {
      placements.push(anchorToPlacementMapping[anchor]);
    }
  });
  return placements;
};
