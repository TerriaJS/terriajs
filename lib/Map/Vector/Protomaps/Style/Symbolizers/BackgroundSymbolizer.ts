import { Feature } from "protomaps-leaflet";
import { PROTOMAPS_DEFAULT_TILE_SIZE } from "../../../../ImageryProvider/ProtomapsImageryProvider";

export interface BackgroundRule {
  symbolizer: BackgroundSymbolizer;
}

/**
 * A symbolizer for background layer type
 */
export default class BackgroundSymbolizer {
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
