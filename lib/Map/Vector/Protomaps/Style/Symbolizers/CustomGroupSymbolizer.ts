import Point from "@mapbox/point-geometry";
import { Bbox, Feature, LabelSymbolizer, Layout } from "protomaps-leaflet";

export default class CustomGroupSymbolizer implements LabelSymbolizer {
  list: LabelSymbolizer[];

  constructor(list: LabelSymbolizer[]) {
    this.list = list;
  }

  public place(layout: Layout, geom: Point[][], feature: Feature) {
    let bbox: Bbox | undefined;
    let anchor: Point | undefined;
    let draws: ((ctx: CanvasRenderingContext2D) => void)[] = [];
    this.list.forEach((symbolizer) => {
      const labels = symbolizer.place(layout, geom, feature);
      if (!labels) return;

      const label = labels[0];
      bbox = bbox ? mergeBbox(bbox, label.bboxes[0]) : label.bboxes[0];
      anchor ??= label.anchor;
      draws.push(label.draw);
    });

    if (!bbox || !anchor) {
      return;
    }

    const draw = (ctx: CanvasRenderingContext2D) => {
      for (const d of draws) {
        d(ctx);
      }
    };

    return [{ anchor: anchor, bboxes: [bbox], draw: draw }];
  }
}

const mergeBbox = (b1: Bbox, b2: Bbox) => {
  return {
    minX: Math.min(b1.minX, b2.minX),
    minY: Math.min(b1.minY, b2.minY),
    maxX: Math.max(b1.maxX, b2.maxX),
    maxY: Math.max(b1.maxY, b2.maxY)
  };
};
