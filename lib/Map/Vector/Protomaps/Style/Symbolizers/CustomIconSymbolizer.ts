import { Feature, LabelSymbolizer, Layout, Sheet } from "protomaps-leaflet";
import { Thunk } from "../expr";
import Point from "@mapbox/point-geometry";

export interface CustomIconSymbolizerOptions {
  name: (zoom?: number, f?: Feature) => string | undefined;
  sheets: Map<string, Sheet>;
  rotate?: (zoom?: number, f?: Feature) => number | undefined;
  rotationAlignment?: (zoom?: number, f?: Feature) => string | undefined;
  size?: (zoom?: number, f?: Feature) => number | undefined;
}

/**
 * A symbolizer for icons that can read a sprite sheet with raster sprite and index.
 */
export default class CustomIconSymbolizer implements LabelSymbolizer {
  sheets: Map<string, Sheet>;
  dpr: number;

  name: Thunk<string | undefined>;
  rotate?: Thunk<number | undefined>;
  rotationAlignment?: Thunk<string | undefined>;
  size?: Thunk<number | undefined>;

  _icon?: { name: string; glyph: ReturnType<Sheet["get"]>; sheet: Sheet };

  constructor(options: CustomIconSymbolizerOptions) {
    this.sheets = options.sheets;
    this.dpr = window.devicePixelRatio;
    this.name = options.name;
    this.rotate = options.rotate;
    this.rotationAlignment = options.rotationAlignment;
    this.size = options.size;
  }

  getIcon(zoom: number, feature: Feature) {
    if (this._icon) {
      return this._icon;
    }

    const name = this.name(zoom, feature);
    let [sheetName, iconName] = name?.split(":") ?? [];
    if (iconName === undefined) {
      [sheetName, iconName] = ["", sheetName];
    }
    const sheet = this.sheets.get(sheetName);
    const glyph = sheet?.get(iconName);
    const icon = name && glyph && sheet ? { name, glyph, sheet } : undefined;

    // persist the icon we found if name is not dynamic
    if (icon && this.name.length === 0) {
      this._icon = icon;
    }

    return icon;
  }

  place(layout: Layout, geom: Point[][], feature: Feature) {
    const rotationAlignment = this.rotationAlignment?.(layout.zoom, feature);
    if (rotationAlignment === "map") {
      // TODO: implement 'map' alignment similar LineLabelsymbolizer but for icons.
      return;
    }
    const icon = this.getIcon(layout.zoom, feature);
    if (!icon) {
      return;
    }

    const { glyph, sheet } = icon;
    const a = new Point(geom[0][0].x, geom[0][0].y);

    const pixelRatio = (glyph as any).pixelRatio || 1;

    // Resize the glyph to respect pixel ratio
    const resizedGlyph = {
      // center the glyph
      x: -glyph.w / 2 / pixelRatio,
      y: -glyph.h / 2 / pixelRatio,
      w: glyph.w / pixelRatio,
      h: glyph.h / pixelRatio
    };

    const rotate = this.rotate?.(layout.zoom, feature);
    const size = this.size?.(layout.zoom, feature);

    const bbox = {
      minX: a.x - resizedGlyph.w,
      minY: a.y - resizedGlyph.h,
      maxX: a.x + resizedGlyph.w,
      maxY: a.y + resizedGlyph.h
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      ctx.globalAlpha = 1;
      if (rotate) ctx.rotate(rotate);
      if (size) ctx.scale(size, size);
      ctx.drawImage(
        sheet.canvas,
        glyph.x,
        glyph.y,
        glyph.w,
        glyph.h,
        resizedGlyph.x,
        resizedGlyph.y,
        resizedGlyph.w,
        resizedGlyph.h
      );
      ctx.restore();
    };
    return [{ anchor: a, bboxes: [bbox], draw: draw }];
  }
}
