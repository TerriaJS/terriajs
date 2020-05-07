import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import when from "terriajs-cesium/Source/ThirdParty/when";
import isDefined from "../Core/isDefined";
import TextureMagnificationFilter from "terriajs-cesium/Source/Renderer/TextureMagnificationFilter";

import { plot as plottyPlot, colorscales as plottyColourscales } from "plotty";
import GeographicTilingScheme from "terriajs-cesium/Source/Core/GeographicTilingScheme";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";

export interface RasterImageryProviderOptions {
  pixels: number[];
  height: number;
  width: number;
  noDataValue?: number;
  valueDomain: number[];
  rectangle: Rectangle;
  ellipsoid?: Ellipsoid;
  minimumZoom?: number;
  maximumZoom?: number;
  colourScale?: string
}

export default class RasterImageryProvider implements ImageryProvider {
  static readonly colorscales = Object.keys(plottyColourscales)
  private readonly _tilingScheme: GeographicTilingScheme;
  private readonly _tileWidth: number;
  private readonly _tileHeight: number;
  private readonly _minimumLevel: number;
  private readonly _maximumLevel: number;
  // private readonly _maximumNativeLevel: number;
  private readonly _rectangle: Rectangle;

  private readonly _errorEvent = new CesiumEvent();
  private readonly _readyPromise: Promise<boolean>
  private readonly _ready = true;

  private _pixels: number[];
  private _pixelHeight: number;
  private _pixelWidth: number;
  private _noDataValue: number;
  private _valueDomain: number[];

  private _colourScale: string;

  private _defaultMagnificationFilter: number;

  private _canvas: HTMLCanvasElement | undefined;
  private _canvasWidth:number;
  private _canvasHeight:number;
  
  constructor(options: RasterImageryProviderOptions) {
    this._tilingScheme = new GeographicTilingScheme({
      rectangle: options.rectangle,
      numberOfLevelZeroTilesX: 1,
      numberOfLevelZeroTilesY: 1,
      ellipsoid: defaultValue(options.ellipsoid, Ellipsoid.WGS84)
    });

    this._defaultMagnificationFilter = TextureMagnificationFilter.NEAREST;

    this._tileWidth = 0;
    this._tileHeight = 0;

    this._minimumLevel = defaultValue(options.minimumZoom, 0);
    this._maximumLevel = defaultValue(options.maximumZoom, Infinity);

    this._rectangle = isDefined(options.rectangle)
      ? Rectangle.intersection(options.rectangle, this._tilingScheme.rectangle)
      : this._tilingScheme.rectangle;

    this._errorEvent = new CesiumEvent();
    
    this._canvasWidth = options.width;
    this._canvasHeight = options.height;

    this._pixels = options.pixels;

    this._pixelWidth =
      Math.abs(this.rectangle.east - this.rectangle.west) / this._canvasWidth;
    this._pixelHeight =
      Math.abs(this.rectangle.south - this.rectangle.north) /
      this._canvasHeight;

    this._noDataValue = defaultValue(options.noDataValue, -3.4028234663852886e38);

    this._valueDomain = options.valueDomain;

    this._colourScale = defaultValue(options.colourScale, 'viridis');

    this._readyPromise = when.defer();

    this._ready = true;
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

  get hasAlphaChannel() {
    return true;
  }

  get credit(): Cesium.Credit {
    return <any>undefined;
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
    return this._defaultMagnificationFilter;
  }

  get defaultMinificationFilter(): any {
    return undefined;
  }

  get proxy(): Cesium.Proxy {
    return <any>undefined;
  }

  get readyPromise(): Promise<boolean> {
    return this._readyPromise
  }

  get tileDiscardPolicy(): Cesium.TileDiscardPolicy {
    return <any>undefined;
  }

  getTileCredits(x: number, y: number, level: number): Cesium.Credit[] {
    return [];
  }

  requestImage(
    x: number,
    y: number,
    level: number
  ): Promise<HTMLCanvasElement> {
    this._canvas = document.createElement("canvas");
    this._canvas.width = this._canvasWidth
    this._canvas.height = this._canvasHeight

    const plot = new plottyPlot({
      domain: this._valueDomain,
      canvas: this._canvas,
      data: this._pixels,
      width: this._canvas.width,
      height: this._canvas.height,

      colorScale: this._colourScale
    });

    plot.setNoDataValue(this._noDataValue);
    plot.setClamp(false, true);
    plot.render();

    return Promise.resolve(this._canvas);
  }

  pickFeatures(
    x: number,
    y: number,
    level: number,
    longitude: number,
    latitude: number
  ): Promise<ImageryLayerFeatureInfo[]> {
    return Promise.resolve([]);
  }
}
