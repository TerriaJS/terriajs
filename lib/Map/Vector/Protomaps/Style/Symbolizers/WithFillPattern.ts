import Point from "@mapbox/point-geometry";
import { Feature, PaintSymbolizer } from "protomaps-leaflet";
import SpriteSheets from "../SpriteSheets";
import { AttrOption, getAttrValue } from "./attr";

/**
 * A HoC symbolizer that sets a fill pattern before symbolizing using the given
 * symbolizer.
 */
export default class WithFillPattern implements PaintSymbolizer {
  readonly fillPattern: AttrOption<string | undefined> | undefined;
  readonly spriteSheets: SpriteSheets;
  readonly symbolizer: PaintSymbolizer;

  private readonly isDynamic: boolean;
  private _image: HTMLCanvasElement | undefined;

  constructor(
    fillPattern: AttrOption<string | undefined>,
    spriteSheets: SpriteSheets,
    symbolizer: PaintSymbolizer
  ) {
    this.fillPattern = fillPattern;
    this.spriteSheets = spriteSheets;
    this.symbolizer = symbolizer;
    this.isDynamic = this.fillPattern ? this.fillPattern.length > 0 : false;
  }

  before(ctx: CanvasRenderingContext2D, zoom: number) {
    this.symbolizer.before?.(ctx, zoom);

    const image = this._image ?? this.buildPatternImage(zoom);
    if (image) {
      const pattern = ctx.createPattern(image, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
      }

      if (!this.isDynamic) {
        // if the pattern is not zoom dependent we can memoize the image
        this._image = image;
      }
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    geom: Point[][],
    z: number,
    feature: Feature
  ) {
    return this.symbolizer.draw(ctx, geom, z, feature);
  }

  buildPatternImage(zoom: number): HTMLCanvasElement | undefined {
    const fillPattern = getAttrValue(this.fillPattern, zoom);
    const sprite = fillPattern
      ? this.spriteSheets.getIcon(fillPattern)
      : undefined;
    if (!sprite) {
      return;
    }

    const glyph = sprite.glyph;
    const pixelRatio = (glyph as any).pixelRatio || 1;
    // Resize the glyph to respect pixel ratio
    const resizedGlyph = {
      // center the glyph
      x: -glyph.w / 2 / pixelRatio,
      y: -glyph.h / 2 / pixelRatio,
      w: glyph.w / pixelRatio,
      h: glyph.h / pixelRatio
    };

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = resizedGlyph.w;
    canvas.height = resizedGlyph.h;

    if (ctx === null) {
      return;
    }

    ctx.drawImage(
      sprite.sheet.canvas,
      glyph.x,
      glyph.y,
      glyph.w,
      glyph.h,
      resizedGlyph.x,
      resizedGlyph.y,
      resizedGlyph.w,
      resizedGlyph.h
    );

    return canvas;
  }
}
