import {
  CenteredSymbolizer,
  CenteredTextSymbolizer,
  Feature,
  LabelSymbolizer,
  TextSymbolizer,
  TextSymbolizerOptions
} from "protomaps-leaflet";
import { PROTOMAPS_DEFAULT_TILE_SIZE } from "../../../ImageryProvider/ProtomapsImageryProvider";

interface TextFieldOptions {
  textField?: (zoom?: number, f?: Feature) => string | undefined;
}

export class CustomCenteredTextSymbolizer extends CenteredTextSymbolizer {
  centered: LabelSymbolizer;

  constructor(
    options: Omit<TextSymbolizerOptions, "labelProps"> & TextFieldOptions
  ) {
    super(options);
    const textFieldSymbolizer = new TextSymbolizer(options);
    // The protomaps implementation only supports reading text value from
    // a feature's property but we want to be able to generate labels from any
    // text string. This is a hacky override to make it work. TODO: implement
    // the text transform code from protomaps-leaflet
    textFieldSymbolizer.text.get = (z, f) => options.textField?.(z, f);
    this.centered = new CenteredSymbolizer(textFieldSymbolizer);
  }
}

export interface BackgroundRule {
  symbolizer: BackgroundSymbolizer;
}

export class BackgroundSymbolizer {
  backgroundColor: (z?: number, f?: Feature) => string;
  backgroundOpacity: (z?: number, f?: Feature) => number;

  constructor(options: {
    backgroundColor: (z?: number, f?: Feature) => string;
    backgroundOpacity: (z?: number, f?: Feature) => number;
  }) {
    this.backgroundColor = options.backgroundColor;
    this.backgroundOpacity = options.backgroundOpacity;
  }

  draw(ctx: CanvasRenderingContext2D, z: number): void {
    ctx.globalAlpha = this.backgroundOpacity(z);
    ctx.fillStyle = this.backgroundColor(z);
    ctx.fillRect(
      0,
      0,
      PROTOMAPS_DEFAULT_TILE_SIZE,
      PROTOMAPS_DEFAULT_TILE_SIZE
    );
  }
}
