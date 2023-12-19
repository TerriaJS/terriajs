//// @ts-nocheck

/** This file has been taken from https://github.com/hongfaqiu/TIFFImageryProvider and modified by the Terria team.
 * We diverge from that repo as of commit d7cc3cbd889cf78ed544e2e8df11667861497d59
 */

import Event from "terriajs-cesium/Source/Core/Event";
import GeographicTilingScheme from "terriajs-cesium/Source/Core/GeographicTilingScheme";
import Credit from "terriajs-cesium/Source/Core/Credit";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import GeoTIFF, { Pool } from "geotiff";

import defined from "terriajs-cesium/Source/Core/defined";
const parseGeoRaster = require("georaster");
import GeoRasterLayer, { GeoRaster } from "georaster-layer-for-leaflet";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import { ImageryProviderWithGridLayerSupport } from "../../Map/Leaflet/ImageryProviderLeafletGridLayer";
import Terria from "../../Models/Terria";
import { makeObservable } from "mobx";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import GeorasterTerriaLayer from "../../Map/Leaflet/GeorasterTerriaLayer";

// Georaster Layer for Leaflet Imports

const tileSize = 256;
interface Coords {
  z: number;
  x: number;
  y: number;
}

export interface TIFFImageryProviderOptions {
  terria: Terria;
  url: string | File | Blob;
  requestOptions?: {
    /** defaults to false */
    forceXHR?: boolean;
    headers?: Record<string, any>;
    credentials?: boolean;
    /** defaults to 0 */
    maxRanges?: number;
    /** defaults to false */
    allowFullFile?: boolean;
    [key: string]: any;
  };
  credit?: string;
  tileSize?: number;
  maximumLevel?: number;
  minimumLevel?: number;
  enablePickFeatures?: boolean;
  hasAlphaChannel?: boolean;
  cache?: number;
  /** geotiff resample method, defaults to nearest */
  resampleMethod?: "nearest" | "bilinear" | "linear";
}

let workerPool: Pool;
function getWorkerPool() {
  if (!workerPool) {
    workerPool = new Pool();
  }
  return workerPool;
}

export class TIFFImageryProvider
  implements ImageryProviderWithGridLayerSupport
{
  private readonly terria: Terria;

  // Imagery provider properties
  readonly tilingScheme: WebMercatorTilingScheme;
  readonly tileWidth: number;
  readonly tileHeight: number;
  readonly minimumLevel: number;
  readonly maximumLevel: number;
  readonly rectangle: Rectangle;
  readonly errorEvent = new CesiumEvent();
  readonly ready = true;
  readonly credit: Credit;

  readonly url?: string;

  // Set values to please poor cesium types
  readonly defaultNightAlpha = undefined;
  readonly defaultDayAlpha = undefined;
  readonly hasAlphaChannel: boolean;
  readonly defaultAlpha = <any>undefined;
  readonly defaultBrightness = <any>undefined;
  readonly defaultContrast = <any>undefined;
  readonly defaultGamma = <any>undefined;
  readonly defaultHue = <any>undefined;
  readonly defaultSaturation = <any>undefined;
  readonly defaultMagnificationFilter = undefined as any;
  readonly defaultMinificationFilter = undefined as any;
  readonly proxy = <any>undefined;
  readonly readyPromise = Promise.resolve(true);
  readonly tileDiscardPolicy = <any>undefined;

  private _destroyed = false;
  private _source: GeoTIFF | undefined;
  private _geoRasterLayer: GeorasterTerriaLayer | undefined;

  constructor(private readonly options: TIFFImageryProviderOptions) {
    makeObservable(this);
    this.terria = options.terria;
    this.tilingScheme = new WebMercatorTilingScheme();
    this.rectangle = this.tilingScheme.rectangle;

    this.tileWidth = tileSize;
    this.tileHeight = tileSize;

    this.hasAlphaChannel = options.hasAlphaChannel ?? true;
    this.maximumLevel = options.maximumLevel ?? 18;
    this.minimumLevel = options.minimumLevel ?? 0;
    this.credit = new Credit(options.credit || "", false);
    this.errorEvent = new Event();

    // this._workerFarm = new WorkerFarm();
    // this._cacheTime = options.cache ?? 60 * 1000;

    // this.ready = false;
    if (defined(options.url)) {
      this.readyPromise = this._build(options).then(() => {
        return true;
      });
    }
  }

  get isDestroyed() {
    return this._destroyed;
  }

  getTileCredits(x: number, y: number, level: number): Credit[] {
    return [];
  }

  private async _build(options: TIFFImageryProviderOptions) {
    // Initialise the GeoRasterLayer and the GeoTIFF objects
    try {
      const georaster: GeoRaster = await parseGeoRaster(this.options.url);
      this._geoRasterLayer = new GeoRasterLayer({
        georaster: georaster,
        opacity: 1,
        resolution: 256
      });
    } catch (error) {
      console.log(`Error building Georaster: {error}`);
    }

    // const { tileSize, renderOptions, projFunc, requestOptions } = options;
    // this.readyPromise = Promise.resolve(true);
    // this.ready = true;
  }

  async requestImage(x: number, y: number, z: number) {
    const canvas = document.createElement("canvas");
    canvas.width = this.tileWidth;
    canvas.height = this.tileHeight;
    return await this.requestImageForCanvas(x, y, z, canvas);
  }

  async requestImageForCanvas(
    x: number,
    y: number,
    z: number,
    canvas: HTMLCanvasElement
  ) {
    try {
      console.log(`Calling drawTile: ${x}, ${y}, ${z}`);
      await this._geoRasterLayer?.createTile({ x, y, z }, () =>
        console.log("Done")
      );
    } catch (e) {
      console.log(e);
    }

    return canvas;
  }

  async pickFeatures(
    x: number,
    y: number,
    zoom: number,
    longitude: number,
    latitude: number
  ): Promise<ImageryLayerFeatureInfo[]> {
    return [];

    // ! TODO: Fill this in to use GRLFT get feature info methods.
  }

  destroy() {
    // this._images = undefined;
    // this._imagesCache = undefined;
    // this._workerFarm?.destory();
    // this.plot?.destroy();
    this._destroyed = true;
  }
}

export default TIFFImageryProvider;
