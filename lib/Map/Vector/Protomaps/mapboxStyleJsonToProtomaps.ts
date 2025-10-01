import {
  CircleSymbolizer,
  JsonObject,
  Justify,
  LabelRule,
  LineSymbolizer,
  PaintRule,
  PolygonSymbolizer,
  Sheet
} from "protomaps-leaflet";
import TerriaError from "../../../Core/TerriaError";
import IndexedSpriteSheet from "./Style/IndexedSpriteSheet";
import BackgroundSymbolizer from "./Style/Symbolizers/BackgroundSymbolizer";
import CustomGroupSymbolizer from "./Style/Symbolizers/CustomGroupSymbolizer";
import CustomIconSymbolizer from "./Style/Symbolizers/CustomIconSymbolizer";
import CustomLabelSymbolizer from "./Style/Symbolizers/CustomLabelSymbolizer";
import {
  Expr,
  Thunk,
  evalBool,
  evalColor,
  evalEnum,
  evalNumber,
  evalString,
  evalStringArray,
  mapAllThunks
} from "./Style/expr";

/** This file is adapted from from https://github.com/protomaps/protomaps-leaflet/blob/a08304417ef36fef03679976cd3e5a971fec19a2/src/compat/json_style.ts
 * License: BSD-3-Clause
 * Copyright 2021-2024 Protomaps LLC
 * Full license https://github.com/protomaps/protomaps-leaflet/blob/main/LICENSE
 */

export function evalLineWidth(widthExpr: Expr, gapExpr: Expr) {
  return mapAllThunks(
    [evalNumber(widthExpr, 1), evalNumber(gapExpr, 0)],
    ([width, gap]) => width + gap
  );
}

const evalLineCap = evalEnum(["butt", "round", "square"] as CanvasLineCap[]);

const evalLineJoin = evalEnum(["bevel", "miter", "round"] as CanvasLineJoin[]);

const textJustify = (value: string) =>
  value === "left"
    ? Justify.Left
    : value === "center"
    ? Justify.Center
    : value === "right"
    ? Justify.Right
    : undefined;

interface FontSub {
  face: string;
  weight?: number;
  style?: string;
}

function evalFont(fontExpr: JsonObject, fontSubMap: Record<string, FontSub>) {
  return mapAllThunks(
    [
      evalStringArray(["literal", fontExpr?.["text-font"] ?? []], []),
      evalNumber(fontExpr?.["text-size"], 16)
    ],
    ([textFonts, textSize]) => {
      textSize = Math.round(textSize); //window.devicePixelRatio
      const fontFaces = textFonts.reduce<FontSub[]>(
        (acc, face) => (face in fontSubMap ? [...acc, fontSubMap[face]] : acc),
        []
      );
      if (fontFaces.length === 0) fontFaces.push({ face: "sans-serif" });

      const weight = fontFaces[0]?.weight;
      const style = fontFaces[0]?.style;
      return [
        weight ?? "",
        style ?? "",
        textSize ? `${textSize}px` : "",
        fontFaces.map((f) => f.face).join(",")
      ]
        .join(" ")
        .trim();
    }
  );
}

function transformText(
  textThunk: Thunk<string | undefined>,
  transformThunk: Thunk<string>
): Thunk<string | undefined> {
  return mapAllThunks([textThunk, transformThunk], ([text, transform]) => {
    return text && transform === "uppercase"
      ? text.toLocaleUpperCase()
      : transform === "lowercase"
      ? transform.toLocaleLowerCase()
      : text;
  });
}

function buildSpriteSheets(sprite: any): Map<string, Sheet> {
  const sprites =
    typeof sprite === "string"
      ? [{ id: "", url: sprite }]
      : Array.isArray(sprite)
      ? sprite
      : [];

  const spriteSheets = new Map<string, IndexedSpriteSheet>();
  for (sprite of sprites) {
    const { id, url } = sprite ?? {};
    if (typeof id === "string" && typeof url === "string") {
      spriteSheets.set(id, new IndexedSpriteSheet(url));
    }
  }

  return spriteSheets;
}

/** Convert mapbox style json to Protomaps paint and label rules.
 * This supports a very small subset of mapbox style spec:
 */
export function mapboxStyleJsonToProtomaps(
  obj: any,
  fontSubMap: Record<string, FontSub>
) {
  if (!obj || !obj.layers) return undefined;

  const paintRules: PaintRule[] = [];
  const labelRules: LabelRule[] = [];
  let backgroundRule: { symbolizer: BackgroundSymbolizer } | undefined;
  const refs = new Map<string, any>();
  const spriteSheets = buildSpriteSheets(obj.sprite);
  try {
    for (const layer of obj.layers) {
      refs.set(layer.id, layer);

      if (layer.layout && layer.layout.visibility === "none") {
        continue;
      }

      if (layer.ref) {
        const referenced = refs.get(layer.ref);
        layer.type = referenced.type;
        layer.filter = referenced.filter;
        layer.source = referenced.source;
        layer["source-layer"] = referenced["source-layer"];
      }

      const filter = layer.filter ? evalBool(layer.filter, false) : undefined;

      const commonLayerOpts = {
        minzoom: layer.minzoom,
        maxzoom: layer.maxzoom
      };
      if (layer.type === "background") {
        backgroundRule = {
          symbolizer: new BackgroundSymbolizer({
            backgroundColor: evalColor(
              layer.paint["background-color"],
              "black"
            ),
            backgroundOpacity: evalNumber(layer.paint["background-opacity"], 1)
          })
        };
      } else if (layer.type === "fill") {
        paintRules.push({
          ...commonLayerOpts,
          dataLayer: layer["source-layer"],
          filter,
          symbolizer: new PolygonSymbolizer({
            fill: evalColor(layer.paint["fill-color"], "black"),
            opacity: evalNumber(layer.paint["fill-opacity"], 1)
          })
        });
      } else if (layer.type === "fill-extrusion") {
        // simulate fill-extrusion with plain fill
        paintRules.push({
          ...commonLayerOpts,
          dataLayer: layer["source-layer"],
          filter: filter,
          symbolizer: new PolygonSymbolizer({
            fill: evalColor(layer.paint["fill-extrusion-color"], "black"),
            opacity: layer.paint["fill-extrusion-opacity"]
          })
        });
      } else if (layer.type === "line") {
        paintRules.push({
          ...commonLayerOpts,
          dataLayer: layer["source-layer"],
          filter: filter,
          symbolizer: new LineSymbolizer({
            color: evalColor(layer.paint["line-color"], "black"),
            width: evalLineWidth(
              layer.paint["line-width"],
              layer.paint["line-gap-width"]
            ),
            opacity: evalNumber(layer.paint["line-opacity"], 1),
            lineCap: evalLineCap(layer.paint["line-cap"], "butt"),
            lineJoin: evalLineJoin(layer.paint["line-join"], "miter"),
            dash: layer.paint["line-dasharray"],
            dashColor: evalColor(layer.paint["line-color"], "black"),
            dashWidth: evalLineWidth(
              layer.paint["line-width"],
              layer.paint["line-gap-width"]
            )
          })
        });
      } else if (layer.type === "symbol" && layer.layout) {
        const labelSymbolizers = [];

        if (layer.layout["icon-image"]) {
          labelSymbolizers.push(
            new CustomIconSymbolizer({
              name: evalString(layer.layout["icon-image"]),
              sheets: spriteSheets,
              rotate: layer.layout["icon-rotate"]
                ? evalNumber(layer.layout["icon-rotate"])
                : undefined,
              rotationAlignment: layer.layout["icon-rotation-alignment"]
                ? evalString(layer.layout["icon-rotation-alignment"])
                : undefined,
              size: layer.layout["icon-size"]
                ? evalNumber(layer.layout["icon-size"])
                : undefined
            })
          );
        }

        if (layer.layout["text-field"]) {
          labelSymbolizers.push(
            new CustomLabelSymbolizer({
              symbolPlacement: evalString(layer.layout["symbol-placement"]),
              rotationAlignment: layer.layout["text-rotation-alignment"]
                ? evalString(layer.layout["text-rotation-alignment"])
                : undefined,
              font: evalFont(layer.layout, fontSubMap),
              fill: evalColor(layer.paint?.["text-color"], "black"),
              stroke: evalColor(layer.paint?.["text-halo-color"], "black"),
              textField: transformText(
                evalString(layer.layout["text-field"]),
                evalString(layer.layout["text-transform"], "none")
              ),
              textAnchor: layer.layout["text-anchor"]
                ? evalString(layer.layout["text-anchor"])
                : undefined,
              textVariableAnchor: layer.layout["text-variable-anchor"]
                ? evalStringArray(layer.layout["text-variable-anchor"])
                : undefined,
              textOffset: Array.isArray(layer.layout["text-offset"])
                ? () => layer.layout["text-offset"]
                : undefined,
              justify: textJustify(layer.layout["text-justify"]),
              fontSize: layer.layout["text-size"]
                ? evalNumber(layer.layout["text-size"], 16)
                : undefined
            })
          );
        }

        labelRules.push({
          ...commonLayerOpts,
          dataLayer: layer["source-layer"],
          filter,
          symbolizer: new CustomGroupSymbolizer(labelSymbolizers)
        });
      } else if (layer.type === "circle") {
        paintRules.push({
          ...commonLayerOpts,
          dataLayer: layer["source-layer"],
          filter: filter,
          symbolizer: new CircleSymbolizer({
            radius: layer.paint["circle-radius"],
            fill: evalColor(layer.paint["text-color"], "black"),
            stroke: evalColor(layer.paint["circle-stroke-color"], "black"),
            width: layer.paint["circle-stroke-width"]
          })
        });
      } else {
        console.log(`Unhandled layer ${layer.type}`);
      }
    }

    labelRules.reverse();
  } catch (e) {
    TerriaError.from(e, "Error parsing mapbox style").log();
  }

  return {
    paintRules,
    labelRules,
    backgroundRule,
    tasks: [...Array.from(spriteSheets).map(([_, sheet]) => sheet.load())]
  };
}
