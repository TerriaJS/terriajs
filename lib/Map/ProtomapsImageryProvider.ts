import Point from "@mapbox/point-geometry";
import { GeoJsonObject } from "geojson";
import i18next from "i18next";
import {
  Bbox,
  Feature,
  GeomType,
  Labelers,
  LabelRule,
  painter,
  PmtilesSource,
  PreparedTile,
  Rule as PaintRule,
  TileCache,
  TileSource,
  View,
  Zxy,
  ZxySource
} from "protomaps";
import { Cartographic } from "terriajs-cesium";
import Credit from "terriajs-cesium/Source/Core/Credit";
import DefaultProxy from "terriajs-cesium/Source/Core/DefaultProxy";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import TileDiscardPolicy from "terriajs-cesium/Source/Scene/TileDiscardPolicy";
import when from "terriajs-cesium/Source/ThirdParty/when";
import isDefined from "../Core/isDefined";
import { ImageryProviderWithGridLayerSupport } from "./ImageryProviderLeafletGridLayer";

type GeojsonVtFeature = {
  id: any;
  type:
    | "Point"
    | "MultiPoint"
    | "LineString"
    | "MultiLineString"
    | "Polygon"
    | "MultiPolygon";
  geometry: [number, number][][] | [number, number][];
  tags: any;
};

type GeojsonVtTile = {
  features: GeojsonVtFeature[];
  numPoints: number;
  numSimplified: number;
  numFeatures: number;
  source: any;
  x: number;
  y: number;
  z: number;
  transformed: boolean;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

const geojsonvt = require("geojson-vt").default;

interface Coords {
  z: number;
  x: number;
  y: number;
}

interface Options {
  url: string | GeoJsonObject;
  minimumZoom?: number;
  maximumZoom?: number;
  maximumNativeZoom?: number;
  rectangle?: Rectangle;
  credit?: Credit | string;
  paintRules: PaintRule[];
  labelRules: LabelRule[];
}

const BUF = 16;
const tilesize = 256;
const geojsonvtExtent = 4096;

export class GeojsonSource implements TileSource {
  private readonly geojsonUrlOrObject: string | GeoJsonObject;
  geojsonObject: GeoJsonObject | undefined;
  controllers: any[];
  shouldCancelZooms: boolean;

  tileIndex: Promise<any> | undefined;

  constructor(url: string | GeoJsonObject, shouldCancelZooms: boolean) {
    this.geojsonUrlOrObject = url;
    this.controllers = [];
    this.shouldCancelZooms = shouldCancelZooms;
  }

  private async fetchData() {
    if (typeof this.geojsonUrlOrObject === "string") {
      this.geojsonObject = await (await fetch(this.geojsonUrlOrObject)).json();
    } else {
      this.geojsonObject = this.geojsonUrlOrObject;
    }
    return geojsonvt(this.geojsonObject, {
      buffer: 64,
      extent: geojsonvtExtent,
      maxZoom: 24
    });
  }

  public async get(c: Zxy, tileSize: number): Promise<Map<string, Feature[]>> {
    if (!this.tileIndex) {
      this.tileIndex = this.fetchData();
    }

    // // request a particular tile
    const tile = (await this.tileIndex).getTile(c.z, c.x, c.y) as GeojsonVtTile;
    let result = new Map<string, Feature[]>();
    const scale = tilesize / geojsonvtExtent;

    if (tile && tile.features && tile.features.length > 0) {
      result.set(
        "layer",
        tile.features.map(f => {
          let transformedGeom: Point[] | Point[][] = [];
          let numVertices = 0;
          let bbox: Bbox = {
            minX: Infinity,
            minY: Infinity,
            maxX: -Infinity,
            maxY: -Infinity
          };
          // Multi geometry
          if (Array.isArray(f.geometry[0][0])) {
            const geom = f.geometry as [number, number][][];
            transformedGeom = geom.map(g1 =>
              g1.map(g2 => {
                g2 = [g2[0] * scale, g2[1] * scale];
                if (bbox.minX > g2[0]) {
                  bbox.minX = g2[0];
                }

                if (bbox.maxX < g2[0]) {
                  bbox.maxX = g2[0];
                }

                if (bbox.minY > g2[1]) {
                  bbox.minY = g2[1];
                }

                if (bbox.maxY < g2[1]) {
                  bbox.maxY = g2[1];
                }
                return new Point(g2[0], g2[1]);
              })
            );
            numVertices = transformedGeom.reduce<number>(
              (count, current) => count + current.length,
              0
            );
          }
          // Flat geometry
          else {
            const geom = f.geometry as [number, number][];
            transformedGeom = geom.map(g1 => {
              g1 = [g1[0] * scale, g1[1] * scale];

              if (bbox.minX > g1[0]) {
                bbox.minX = g1[0];
              }

              if (bbox.maxX < g1[0]) {
                bbox.maxX = g1[0];
              }

              if (bbox.minY > g1[1]) {
                bbox.minY = g1[1];
              }

              if (bbox.maxY < g1[1]) {
                bbox.maxY = g1[1];
              }
              return new Point(g1[0], g1[1]);
            });
            numVertices = transformedGeom.length;
          }

          const feature: Feature = {
            properties: f.tags,
            bbox,
            geomType:
              f.type === "Point" || f.type === "MultiPoint"
                ? GeomType.Point
                : f.type === "LineString" || f.type === "MultiLineString"
                ? GeomType.Line
                : GeomType.Polygon,
            geom: transformedGeom as any,
            numVertices
          };

          return feature;
        })
      );
    }

    return result;
  }
}

export default class ProtomapsImageryProvider
  implements ImageryProviderWithGridLayerSupport {
  private readonly _tilingScheme: WebMercatorTilingScheme;
  private readonly _tileWidth: number;
  private readonly _tileHeight: number;
  private readonly _minimumLevel: number;
  private readonly _maximumLevel: number;
  private readonly _rectangle: Rectangle;
  private readonly _errorEvent = new CesiumEvent();
  private readonly _ready = true;
  private readonly _credit?: Credit | string;

  // Protomaps properties
  private readonly paintRules: PaintRule[];
  private readonly labelRules: LabelRule[];
  private readonly labelers: Labelers;
  private readonly source: PmtilesSource | ZxySource | GeojsonSource;
  private readonly view: View | undefined;

  constructor(options: Options) {
    this._tilingScheme = new WebMercatorTilingScheme();

    this._tileWidth = tilesize;
    this._tileHeight = tilesize;

    this._minimumLevel = defaultValue(options.minimumZoom, 0);
    this._maximumLevel = defaultValue(options.maximumZoom, Infinity);

    this._rectangle = isDefined(options.rectangle)
      ? Rectangle.intersection(
          options.rectangle,
          this._tilingScheme.rectangle
        ) || this._tilingScheme.rectangle
      : this._tilingScheme.rectangle;

    // Check the number of tiles at the minimum level.  If it's more than four,
    // throw an exception, because starting at the higher minimum
    // level will cause too many tiles to be downloaded and rendered.
    const swTile = this._tilingScheme.positionToTileXY(
      Rectangle.southwest(this._rectangle),
      this._minimumLevel
    );
    const neTile = this._tilingScheme.positionToTileXY(
      Rectangle.northeast(this._rectangle),
      this._minimumLevel
    );
    const tileCount =
      (Math.abs(neTile.x - swTile.x) + 1) * (Math.abs(neTile.y - swTile.y) + 1);
    if (tileCount > 4) {
      throw new DeveloperError(
        i18next.t("map.mapboxVectorTileImageryProvider.moreThanFourTiles", {
          tileCount: tileCount
        })
      );
    }

    this._errorEvent = new CesiumEvent();

    this._ready = true;

    this._credit = options.credit;

    // // Protomaps
    this.paintRules = options.paintRules;
    this.labelRules = options.labelRules;

    if (typeof options.url === "string") {
      if (options.url.endsWith(".pmtiles")) {
        this.source = new PmtilesSource(options.url, false);
        let cache = new TileCache(this.source, 1024);
        this.view = new View(cache, 14, 2);
      } else if (
        options.url.endsWith(".json") ||
        options.url.endsWith(".geojson")
      ) {
        this.source = new GeojsonSource(options.url, false);
      } else {
        this.source = new ZxySource(options.url, false);
        let cache = new TileCache(this.source, 1024);
        this.view = new View(cache, 14, 2);
      }
    } else {
      this.source = new GeojsonSource(options.url, false);
    }

    this.labelers = new Labelers(
      document.createElement("canvas").getContext("2d"),
      this.labelRules,
      () => undefined
    );
  }

  get tileWidth() {
    return this._tileWidth;
  }

  get tileHeight() {
    return this._tileHeight;
  }

  get maximumLevel() {
    return this._maximumLevel;
  }

  get minimumLevel() {
    return this._minimumLevel;
  }

  get tilingScheme() {
    return this._tilingScheme;
  }

  get rectangle() {
    return this._rectangle;
  }

  get errorEvent() {
    return this._errorEvent;
  }

  get ready() {
    return this._ready;
  }

  get defaultNightAlpha() {
    return undefined;
  }

  get defaultDayAlpha() {
    return undefined;
  }

  get hasAlphaChannel() {
    return true;
  }

  get credit(): Credit {
    let credit = this._credit;
    if (credit === undefined) {
      return <any>undefined;
    } else if (typeof credit === "string") {
      credit = new Credit(credit);
    }
    return credit;
  }

  get defaultAlpha(): number {
    return <any>undefined;
  }

  get defaultBrightness(): number {
    return <any>undefined;
  }

  get defaultContrast(): number {
    return <any>undefined;
  }

  get defaultGamma(): number {
    return <any>undefined;
  }

  get defaultHue(): number {
    return <any>undefined;
  }

  get defaultSaturation(): number {
    return <any>undefined;
  }

  get defaultMagnificationFilter(): any {
    return undefined;
  }

  get defaultMinificationFilter(): any {
    return undefined;
  }

  get proxy(): DefaultProxy {
    return <any>undefined;
  }

  get readyPromise(): Promise<boolean> {
    return when(true);
  }

  get tileDiscardPolicy(): TileDiscardPolicy {
    return <any>undefined;
  }

  getTileCredits(x: number, y: number, level: number): Credit[] {
    return [];
  }

  async requestImage(x: number, y: number, level: number) {
    const canvas = document.createElement("canvas");
    canvas.width = this.tileWidth;
    canvas.height = this.tileHeight;
    return await this.requestImageForCanvas(x, y, level, canvas);
  }

  async requestImageForCanvas(
    x: number,
    y: number,
    level: number,
    canvas: HTMLCanvasElement
  ) {
    try {
      await this.renderTile({ x, y, z: level }, canvas);
    } catch (e) {
      console.log(e);
    }

    return canvas;
  }

  public async renderTile(coords: Coords, canvas: HTMLCanvasElement) {
    // Adapted from https://github.com/protomaps/protomaps.js/blob/master/src/frontends/leaflet.ts

    let tile: PreparedTile | undefined = undefined;
    if (this.source instanceof GeojsonSource) {
      const data = await this.source.get(coords, this.tileHeight);

      tile = {
        data: data,
        z: coords.z,
        data_tile: coords,
        scale: 1,
        origin: new Point(coords.x * 256, coords.y * 256),
        dim: this.tileWidth
      };
    } else if (this.view) {
      tile = await this.view.getDisplayTile(coords);
    }

    if (!tile) return;

    this.labelers.add(tile);

    let labelData = this.labelers.getIndex(tile.z);

    const bbox = {
      minX: 256 * coords.x - BUF,
      minY: 256 * coords.y - BUF,
      maxX: 256 * (coords.x + 1) + BUF,
      maxY: 256 * (coords.y + 1) + BUF
    };
    const origin = new Point(256 * coords.x, 256 * coords.y);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(this.tileWidth / 256, 0, 0, this.tileHeight / 256, 0, 0);
    ctx.clearRect(0, 0, 256, 256);

    painter(ctx, [tile], labelData, this.paintRules, bbox, origin, false, "");
  }

  async pickFeatures(
    x: number,
    y: number,
    level: number,
    longitude: number,
    latitude: number
  ): Promise<ImageryLayerFeatureInfo[]> {
    if (this.view) {
      return this.view.queryFeatures(longitude, latitude, level).map(f => {
        const featureInfo = new ImageryLayerFeatureInfo();

        featureInfo.properties = f.properties;
        featureInfo.position = new Cartographic(longitude, latitude);

        featureInfo.configureDescriptionFromProperties(f.properties);
        featureInfo.configureNameFromProperties(f.properties);

        return featureInfo;
      });
    } else if (this.source instanceof GeojsonSource) {
      // this.source.geojsonObject
    }
    return [];
  }
}
