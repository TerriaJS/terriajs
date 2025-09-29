import Point from "@mapbox/point-geometry";
import {
  CenteredSymbolizer,
  CenteredTextSymbolizer,
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

interface CustomLabelSymbolizerOptions extends TextSymbolizerOptions {
  textField: (zoom?: number, f?: Feature) => string | undefined;
  textAnchor: (zoom?: number, f?: Feature) => string | undefined;
  symbolPlacement: (zoom?: number, f?: Feature) => string | undefined;
  rotationAlignment?: (zoom?: number, f?: Feature) => string | undefined;
}

/**
 * A text label symbolizer that places the label along a line or at a point
 */
export default class CustomLabelSymbolizer implements LabelSymbolizer {
  readonly options;
  readonly lineLabelSymbolizer: LineLabelSymbolizer;
  readonly centeredTextSymbolizer: CenteredTextSymbolizer;

  constructor(options: CustomLabelSymbolizerOptions) {
    this.options = options;
    this.lineLabelSymbolizer = new LineLabelSymbolizer(this.options);
    // The protomaps LineLabelSymbolizer reads the label from feature property,
    // override it here to show any text.
    this.lineLabelSymbolizer.text.get = (z, f) => this.options.textField(z, f);

    this.centeredTextSymbolizer = new CustomCenteredTextSymbolizer(
      this.options
    );
  }

  place(
    layout: Layout,
    geom: Point[][],
    feature: Feature
  ): Label[] | undefined {
    const zoom = layout.zoom;
    const symbolPlacement = this.options.symbolPlacement(zoom, feature);
    let rotationAlignment =
      this.options.rotationAlignment?.(zoom, feature) ?? "auto";

    const placeWithOffset = (symbolizer: LabelSymbolizer) => {
      const textAnchor = this.options.textAnchor(zoom, feature);
      const placement = {
        left: TextPlacements.E,
        right: TextPlacements.E,
        top: TextPlacements.N,
        bottom: TextPlacements.S
      }[textAnchor ?? ""];

      if (!placement) {
        return symbolizer.place(layout, geom, feature);
      }
      return new OffsetSymbolizer(symbolizer, {
        placements: [placement]
      }).place(layout, geom, feature);
    };

    if (symbolPlacement === "line" && rotationAlignment !== "viewport") {
      return placeWithOffset(this.lineLabelSymbolizer);
    } else {
      return placeWithOffset(this.centeredTextSymbolizer);
    }
  }
}

interface CustomTextFieldSymbolizerOptions extends TextSymbolizerOptions {
  textField: (zoom?: number, f?: Feature) => string | undefined;
}

export class CustomCenteredTextSymbolizer implements LabelSymbolizer {
  centered: LabelSymbolizer;

  constructor(options: CustomTextFieldSymbolizerOptions) {
    const textFieldSymbolizer = new TextSymbolizer(options);
    // The protomaps LineLabelSymbolizer reads the label from feature property,
    // override it here to show any text.
    textFieldSymbolizer.text.get = (z, f) => options.textField(z, f);
    this.centered = new CenteredSymbolizer(textFieldSymbolizer);
  }

  public place(layout: Layout, geom: Point[][], feature: Feature) {
    return this.centered.place(layout, geom, feature);
  }
}
