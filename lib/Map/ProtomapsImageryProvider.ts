import Point from "@mapbox/point-geometry";
import i18next from "i18next";
import { Labelers, LabelRule } from "protomaps/src/labeler";
import { painter, Rule as PaintRule } from "protomaps/src/painter";
import { PmtilesSource, ZxySource } from "protomaps/src/tilecache";
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

interface Coords {
  z: number;
  x: number;
  y: number;
}

interface Options {
  url: string;
  minimumZoom?: number;
  maximumZoom?: number;
  maximumNativeZoom?: number;
  rectangle?: Rectangle;
  credit?: Credit | string;
  paintRules: PaintRule[];
  labelRules: LabelRule[];
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
  private readonly source: PmtilesSource | ZxySource;

  constructor(options: Options) {
    this._tilingScheme = new WebMercatorTilingScheme();

    this._tileWidth = 256;
    this._tileHeight = 256;

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
    // this.paint_rules = [
    //   {
    //     dataLayer: "admin",
    //     symbolizer: new LineSymbolizer({ color: "#ffffff" }),
    //     minzoom: this.minimumLevel,
    //     maxzoom: this.maximumLevel
    //   },
    //   {
    //     dataLayer: "road",
    //     symbolizer: new LineSymbolizer({ color: "#ffdd99" }),
    //     minzoom: this.minimumLevel,
    //     maxzoom: this.maximumLevel
    //   }
    // ];
    // this.label_rules = [
    //   {
    //     dataLayer: "place_label",
    //     symbolizer: new CenteredTextSymbolizer({
    //       fill:"white",
    // width:2,
    // stroke:"black",
    //     }),
    //     filter: p => p.type === "country"
    //   },
    //   {
    //     dataLayer: "place_label",
    //     symbolizer: new CenteredTextSymbolizer({
    //       fill: "#ccc",
    //       stroke: "#555",
    //       width: 1,
    //       fontSize: 12
    //     }),
    //     filter: p => p.type === "state"
    //   }
    // ];

    //   {
    //     dataLayer: "places",
    //     symbolizer: new protomaps.CenteredTextSymbolizer({
    //         properties:["name:en"],
    //         fill:"white",
    //         width:2,
    //         stroke:"black",
    //         font:(z,f) => {
    //             if (f["pmap:kind"] === "country") return "600 16px sans-serif"
    //             else if (f["pmap:kind"] === "city") return "400 14px sans-serif"
    //             else if (f["pmap:kind"] === "neighbourhood") return "200 12px sans-serif"
    //             return "800 18px sans-serif"
    //         }
    //     })
    // }

    if (options.url.endsWith(".pmtiles")) {
      this.source = new PmtilesSource(options.url);
    } else {
      this.source = new ZxySource(options.url);
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
    await this.renderTile({ x, y, z: level }, canvas);

    return canvas;
  }

  public async renderTile(coords: Coords, canvas: HTMLCanvasElement) {
    // Adapted from https://github.com/protomaps/protomaps.js/blob/master/src/frontends/leaflet.ts

    // This removes all AbortControllers from the source
    // If we don't do this, we will get cancelled requests due to how Cesium can request multiple levels of tiles.
    this.source.controllers = [];
    const data = await this.source.get(coords, this.tileHeight);
    const tile = {
      data: data,
      z: coords.z,
      data_tile: coords,
      scale: 1,
      origin: new Point(coords.x * 256, coords.y * 256),
      dim: this.tileWidth
    };

    this.labelers.add(tile);

    let labelData = this.labelers.getIndex(tile.z);

    const BUF = 16;
    const bbox = [
      256 * coords.x - BUF,
      256 * coords.y - BUF,
      256 * (coords.x + 1) + BUF,
      256 * (coords.y + 1) + BUF
    ];
    const origin = new Point(256 * coords.x, 256 * coords.y);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(this.tileWidth / 256, 0, 0, this.tileHeight / 256, 0, 0);
    ctx.clearRect(0, 0, 256, 256);

    painter(
      ctx,
      [tile],
      labelData,
      this.paintRules,
      bbox,
      origin,
      false,
      false
    );
  }

  async pickFeatures(
    x: number,
    y: number,
    level: number,
    longitude: number,
    latitude: number
  ): Promise<ImageryLayerFeatureInfo[]> {
    return [];
  }

  // public queryFeatures(lng: number, lat: number, zoom: number) {
  //   return this.view.queryFeatures(lng, lat, zoom);
  // }
}
