//// @ts-nocheck

import Event from "terriajs-cesium/Source/Core/Event";
import GeographicTilingScheme from "terriajs-cesium/Source/Core/GeographicTilingScheme";
import Credit from "terriajs-cesium/Source/Core/Credit";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import GeoTIFF, { Pool } from "geotiff";

import defined from "terriajs-cesium/Source/Core/defined";
const parseGeoRaster = require("georaster");
// import GeoRasterLayer, { GeoRaster } from "georaster-layer-for-leaflet";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import { ImageryProviderWithGridLayerSupport } from "../../Map/Leaflet/ImageryProviderLeafletGridLayer";
import Terria from "../../Models/Terria";
import { makeObservable } from "mobx";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import GeorasterTerriaLayer from "../../Map/Leaflet/GeorasterTerriaLayer";

// Georaster Layer for Leaflet Imports
/* global proj4 */
import "regenerator-runtime/runtime.js";
import * as L from "leaflet";
import chroma from "chroma-js";
import geocanvas from "geocanvas";
import { rawToRgb } from "pixel-utils";
import isUTM from "utm-utils/src/isUTM.js";
import getProjString from "utm-utils/src/getProjString.js";
import {
  Coords,
  DoneCallback,
  LatLngBounds,
  LatLngTuple,
  Point
} from "leaflet";
import proj4FullyLoaded from "proj4-fully-loaded";
import { GeoExtent } from "geo-extent";
import snap from "snap-bbox";
const proj4 = require("proj4").default;

import type {
  CustomCRS,
  CustomCSSStyleDeclaration,
  GeoRasterLayerOptions,
  GeoRaster,
  GeoRasterKeys,
  GetRasterOptions,
  DrawTileOptions,
  Mask,
  MaskStrategy,
  PixelValuesToColorFn,
  Tile
} from "./types";

const tileSize = 256;
// interface Coords {
//   z: number;
//   x: number;
//   y: number;
// }

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
  projFunc?: (code: number) =>
    | {
        /** projection function, convert [lon, lat] position to EPSG:4326 */
        project: Promise<(pos: number[]) => number[]>;
        /** unprojection function */
        unproject: Promise<(pos: number[]) => number[]>;
      }
    | undefined;
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
  private _georaster: GeoRaster | undefined;
  private _geoRasterLayer: GeorasterTerriaLayer | undefined;
  private _proj?: {
    /** projection function, convert [lon, lat] position to EPSG:4326 */
    project: (pos: number[]) => number[];
    /** unprojection function */
    unproject: (pos: number[]) => number[];
  };

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
        resolution: 256,
        debugLevel: 5
      });
    } catch (error) {
      console.log(`Error building Georaster: {error}`);
    }
    // Return if this._geoRasterLayer is not successfully assigned
    if (!this._geoRasterLayer) {
      return;
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
    console.log(`Calling requestImageForCanvas with x: ${x}, y: ${y}, z: ${z}`);
    const coords = new Point(x, y) as Coords;
    coords.z = z;

    await this._geoRasterLayer?.createTile(coords, canvas, () =>
      console.log(`tile is done`)
    );

    // this.displayCanvasInNewTab(canvas);
    return canvas;
  }

  // For debugging only
  displayCanvasInNewTab(canvas: HTMLCanvasElement): void {
    // Convert the canvas content to a Blob
    canvas.toBlob((blob) => {
      if (blob) {
        // Create an object URL for the Blob
        const url = URL.createObjectURL(blob);

        // Open the object URL in a new tab
        window.open(url, "_blank");

        // Optionally, release the object URL after opening
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    });
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

///////////////////////
// ! GRLFT Source code

const EPSG4326 = 4326;
const PROJ4_SUPPORTED_PROJECTIONS = new Set([
  3785, 3857, 4269, 4326, 900913, 102113
]);
const MAX_NORTHING = 1000;
const MAX_EASTING = 1000;
const ORIGIN: LatLngTuple = [0, 0];

const log = (obj: any) => console.log("[georaster-layer-for-leaflet] ", obj);

// figure out if simple CRS
// even if not created with same instance of LeafletJS
const isSimpleCRS = (crs: CustomCRS) =>
  crs === L.CRS.Simple ||
  (!crs.code &&
    crs.infinite &&
    crs?.transformation?._a === 1 &&
    crs?.transformation?._b === 0 &&
    crs?.transformation?._c === -1 &&
    crs?.transformation?._d === 0);

if (!L)
  console.warn(
    "[georaster-layer-for-leaflet] can't find Leaflet.  If you are loading via <script>, please add the GeoRasterLayer script after the LeafletJS script."
  );

const zip = (a: any[], b: any[]) => a.map((it, i) => [it, b[i]]);

// ! SS: Modify this to take a Leaflet.Map aswell as options.
const GeoRasterLayer: (new (options: GeoRasterLayerOptions) => any) &
  typeof L.Class = L.GridLayer.extend({
  options: {
    updateWhenIdle: true,
    updateWhenZooming: false,
    keepBuffer: 25,
    resolution: 2 ** 5,
    debugLevel: 0,
    caching: true
  },

  cache: {},

  initialize: function (options: GeoRasterLayerOptions) {
    try {
      if (options.georasters) {
        this.georasters = options.georasters;
      } else if (options.georaster) {
        this.georasters = [options.georaster];
      } else {
        throw new Error(
          "You initialized a GeoRasterLayer without a georaster or georasters value."
        );
      }

      if (this.sourceType === "url") {
        options.updateWhenIdle = false;
        options.updateWhenZooming = true;
        options.keepBuffer = 16;
      }

      if (options.resampleMethod) {
        this.resampleMethod = options.resampleMethod;
      }

      /*
          Unpacking values for use later.
          We do this in order to increase speed.
      */
      const keys = [
        "height",
        "width",
        "noDataValue",
        "palette",
        "pixelHeight",
        "pixelWidth",
        "projection",
        "sourceType",
        "xmin",
        "xmax",
        "ymin",
        "ymax"
      ];
      if (this.georasters.length > 1) {
        keys.forEach((key) => {
          if (this.same(this.georasters, key)) {
            this[key] = this.georasters[0][key];
          } else {
            throw new Error("all GeoRasters must have the same " + key);
          }
        });
      } else if (this.georasters.length === 1) {
        keys.forEach((key) => {
          this[key] = this.georasters[0][key];
        });
      }

      this._cache = {
        innerTile: {},
        tile: {}
      };

      this.extent = new GeoExtent(
        [this.xmin, this.ymin, this.xmax, this.ymax],
        { srs: this.projection }
      );

      // used later if simple projection
      this.ratio = this.height / this.width;

      this.debugLevel = options.debugLevel;
      if (this.debugLevel >= 1) log({ options });

      if (
        this.georasters.every(
          (georaster: GeoRaster) => typeof georaster.values === "object"
        )
      ) {
        this.rasters = this.georasters.reduce(
          (result: number[][][], georaster: GeoRaster) => {
            // added double-check of values to make typescript linter and compiler happy
            if (georaster.values) {
              result = result.concat(georaster.values);
              return result;
            }
          },
          []
        );
        if (this.debugLevel > 1) console.log("this.rasters:", this.rasters);
      }

      if (options.mask) {
        if (typeof options.mask === "string") {
          this.mask = fetch(options.mask).then((r) =>
            r.json()
          ) as Promise<Mask>;
        } else if (typeof options.mask === "object") {
          this.mask = Promise.resolve(options.mask);
        }

        // default mask srs is the EPSG:4326 projection used by GeoJSON
        this.mask_srs = options.mask_srs || "EPSG:4326";
      }

      this.mask_strategy = (options.mask_strategy || "outside") as MaskStrategy;

      this.chroma = chroma;
      this.scale = chroma.scale();

      // could probably replace some day with a simple
      // (for let k in options) { this.options[k] = options[k]; }
      // but need to find a way around TypeScript any issues
      // ! Check if this is problematic with no Leaflet instance
      L.Util.setOptions(this, options);

      /*
          Caching the constant tile size, so we don't recalculate everytime we
          create a new tile
      */
      const tileSize = this.getTileSize();
      this.tileHeight = tileSize.y;
      this.tileWidth = tileSize.x;

      if (this.georasters.length >= 4 && !options.pixelValuesToColorFn) {
        throw "you must pass in a pixelValuesToColorFn if you are combining rasters";
      }

      // total number of bands across all georasters
      this.numBands = this.georasters.reduce(
        (total: number, g: GeoRaster) => total + g.numberOfRasters,
        0
      );
      if (this.debugLevel > 1) console.log("this.numBands:", this.numBands);

      // in-case we want to track dynamic/running stats of all pixels fetched
      this.currentStats = {
        mins: new Array(this.numBands),
        maxs: new Array(this.numBands),
        ranges: new Array(this.numBands)
      };

      // using single-band raster as grayscale
      // or mapping 2 or 3 rasters to rgb bands
      if (
        [1, 2, 3].includes(this.georasters.length) &&
        this.georasters.every((g: GeoRaster) => g.sourceType === "url") &&
        this.georasters.every((g: GeoRaster) => g.numberOfRasters === 1) &&
        !options.pixelValuesToColorFn
      ) {
        try {
          this.calcStats = true;
          this._dynamic = true;
          this.options.pixelValuesToColorFn = (values: number[]) => {
            const haveDataForAllBands = values.every(
              (value) => value !== undefined && value !== this.noDataValue
            );
            if (haveDataForAllBands) {
              return this.rawToRgb(values);
            }
          };
        } catch (error) {
          console.error("[georaster-layer-for-leaflet]", error);
        }
      }

      // if you haven't specified a pixelValuesToColorFn
      // and the image is YCbCr, add a function to convert YCbCr
      this.checkIfYCbCr = new Promise(async (resolve) => {
        if (this.options.pixelValuesToColorFn) return resolve(true);
        if (
          this.georasters.length === 1 &&
          this.georasters[0].numberOfRasters === 3
        ) {
          const image = await this.georasters[0]._geotiff?.getImage();
          if (image?.fileDirectory?.PhotometricInterpretation === 6) {
            this.options.pixelValuesToColorFn = (values: number[]) => {
              const r = Math.round(values[0] + 1.402 * (values[2] - 0x80));
              const g = Math.round(
                values[0] -
                  0.34414 * (values[1] - 0x80) -
                  0.71414 * (values[2] - 0x80)
              );
              const b = Math.round(values[0] + 1.772 * (values[1] - 0x80));
              return `rgb(${r},${g},${b})`;
            };
          }
        }
        return resolve(true);
      });
    } catch (error) {
      console.error("ERROR initializing GeoTIFFLayer", error);
    }
  },

  onAdd: function (map: any) {
    // if (!this.options.maxZoom) {
    //   // maxZoom is needed to display the tiles in the correct order over the zIndex between the zoom levels
    //   // https://github.com/Leaflet/Leaflet/blob/2592967aa6bd392db0db9e58dab840054e2aa291/src/layer/tile/GridLayer.js#L375C21-L375C21
    //   // ! map used here
    //   this.options.maxZoom = map.getMaxZoom();
    // }
    // L.GridLayer.prototype.onAdd.call(this, map);
  },

  getRasters: function (options: GetRasterOptions) {
    const {
      innerTileTopLeftPoint,
      heightOfSampleInScreenPixels,
      widthOfSampleInScreenPixels,
      zoom,
      numberOfSamplesAcross,
      numberOfSamplesDown,
      ymax,
      xmin
    } = options;
    if (this.debugLevel >= 1)
      console.log("starting getRasters with options:", options);

    // called if georaster was constructed from URL and we need to get
    // data separately for each tile
    // aka 'COG mode'

    /*
      This function takes in coordinates in the rendered image inner tile and
      returns the y and x values in the original raster
    */
    const rasterCoordsForTileCoords = (
      h: number,
      w: number
    ): { x: number; y: number } | null => {
      const xInMapPixels =
        innerTileTopLeftPoint.x + w * widthOfSampleInScreenPixels;
      ``;
      const yInMapPixels =
        innerTileTopLeftPoint.y + h * heightOfSampleInScreenPixels;

      const mapPoint = L.point(xInMapPixels, yInMapPixels);
      if (this.debugLevel >= 1) log({ mapPoint });

      // ! This not working, lat, lng returning null
      const { lat, lng } = this.unproject(mapPoint, zoom);
      // debugger;

      if (this.projection === EPSG4326) {
        return {
          y: Math.round((ymax - lat) / this.pixelHeight),
          x: Math.round((lng - xmin) / this.pixelWidth)
        };
      } else if (this.getProjector()) {
        /* source raster doesn't use latitude and longitude,
           so need to reproject point from lat/long to projection of raster
        */
        const [x, y] = this.getProjector().inverse([lng, lat]);
        if (x === Infinity || y === Infinity) {
          if (this.debugLevel >= 1)
            console.error("projector converted", [lng, lat], "to", [x, y]);
        }
        return {
          y: Math.round((ymax - y) / this.pixelHeight),
          x: Math.round((x - xmin) / this.pixelWidth)
        };
      } else {
        return null;
      }
    };

    // careful not to flip min_y/max_y here
    const topLeft = rasterCoordsForTileCoords(0, 0);
    const bottomRight = rasterCoordsForTileCoords(
      numberOfSamplesDown,
      numberOfSamplesAcross
    );

    const getValuesOptions = {
      bottom: bottomRight?.y,
      height: numberOfSamplesDown,
      left: topLeft?.x,
      right: bottomRight?.x,
      top: topLeft?.y,
      width: numberOfSamplesAcross
    };

    if (
      !Object.values(getValuesOptions).every(
        (it) => it !== undefined && isFinite(it)
      )
    ) {
      console.error(
        "getRasters failed because not all values are finite:",
        getValuesOptions
      );
    } else {
      // !note: The types need confirmation - SFR 2021-01-20
      return Promise.all(
        this.georasters.map((georaster: GeoRaster) =>
          georaster.getValues({
            ...getValuesOptions,
            resampleMethod: this.resampleMethod || "nearest"
          })
        )
      ).then((valuesByGeoRaster) =>
        valuesByGeoRaster.reduce((result: number[][][], values) => {
          result = result.concat(values as number[][]);
          return result;
        }, [])
      );
    }
  },

  // ! Define an unproject function to replace L.map.unproject, to be independent of Leaflet
  // This function should unproject from PIXEL COORDINATES to 4326 lat long.
  unproject: function (mapPoint: L.Point, zoom: number) {
    // Earth's radius in meters in the Web Mercator projection
    const R = 6378137;
    const pi = Math.PI;

    // Convert pixel coordinates to meters at the given zoom level
    const meters = mapPoint.multiplyBy(
      (256 * Math.pow(2, zoom)) / (2 * pi * R)
    );

    // Convert meters to LatLng
    const lat = ((2 * Math.atan(Math.exp(meters.y / R)) - pi / 2) * 180) / pi;
    const lng = ((meters.x / R) * 180) / pi;

    return new L.LatLng(lat, lng);
  },

  createTile: function (
    coords: Coords,
    tile: HTMLCanvasElement,
    done: DoneCallback
  ) {
    /* This tile is the square piece of the Leaflet map that we draw on */
    // ! Can we create our own canvas that has nothing to do with Leaflet instead? Probably dont need a classname. Just pass in the one that requestImage has access to
    // const tile = L.DomUtil.create(
    //   "canvas",
    //   "leaflet-tile"
    // ) as HTMLCanvasElement;

    // we do this because sometimes css normalizers will set * to box-sizing: border-box
    tile.style.boxSizing = "content-box";

    // start tile hidden
    tile.style.visibility = "hidden";

    const context = tile.getContext("2d");

    // note that we aren't setting the tile height or width here
    // drawTile dynamically sets the width and padding based on
    // how much the georaster takes up the tile area
    const coordsKey = this._tileCoordsToKey(coords);

    const resolution = this._getResolution(coords.z);
    const key = `${coordsKey}:${resolution}`;
    const doneCb = (error?: Error, tile?: HTMLElement): void => {
      done(error, tile);

      // caching the rendered tile, to skip the calculation for the next time
      if (!error && this.options.caching) {
        this.cache[key] = tile;
      }
    };

    if (this.options.caching && this.cache[key]) {
      done(undefined, this.cache[key]);
      return this.cache[key];
    } else {
      this.drawTile({ tile, coords, context, done: doneCb, resolution });
    }

    return tile;
  },

  drawTile: function ({
    tile,
    coords,
    context,
    done,
    resolution
  }: DrawTileOptions) {
    try {
      const { debugLevel = 0 } = this;

      if (debugLevel >= 2)
        console.log("starting drawTile with", { tile, coords, context, done });

      let error: Error;

      const { z: zoom } = coords;

      // stringified hash of tile coordinates for caching purposes
      const cacheKey = [coords.x, coords.y, coords.z].join(",");
      if (debugLevel >= 2) log({ cacheKey });

      const mapCRS = this.getMapCRS();
      if (debugLevel >= 2) log({ mapCRS });

      const inSimpleCRS = isSimpleCRS(mapCRS);
      if (debugLevel >= 2) log({ inSimpleCRS });

      // Unpacking values for increased speed
      const { rasters, xmin, xmax, ymin, ymax } = this;
      const rasterHeight = this.height;
      const rasterWidth = this.width;

      const extentOfLayer = new GeoExtent(this.getBounds(), {
        srs: inSimpleCRS ? "simple" : 4326
      });
      if (debugLevel >= 2) log({ extentOfLayer });

      const pixelHeight = inSimpleCRS
        ? extentOfLayer.height / rasterHeight
        : this.pixelHeight;
      const pixelWidth = inSimpleCRS
        ? extentOfLayer.width / rasterWidth
        : this.pixelWidth;
      if (debugLevel >= 2) log({ pixelHeight, pixelWidth });

      // these values are used, so we don't try to sample outside of the raster
      const { xMinOfLayer, xMaxOfLayer, yMinOfLayer, yMaxOfLayer } = this;
      const boundsOfTile = this._tileCoordsToBounds(coords);
      if (debugLevel >= 2) log({ boundsOfTile });

      const { code } = mapCRS;
      if (debugLevel >= 2) log({ code });
      const extentOfTile = new GeoExtent(boundsOfTile, {
        srs: inSimpleCRS ? "simple" : 4326
      });
      if (debugLevel >= 2) log({ extentOfTile });

      // // create blue outline around tiles
      // if (debugLevel >= 4) {
      //   if (!this._cache.tile[cacheKey]) {
      //     this._cache.tile[cacheKey] = L.rectangle(extentOfTile.leafletBounds, {
      //       fillOpacity: 0
      //     })
      //       .addTo(this.getMap())
      //       .bindTooltip(cacheKey, { direction: "center", permanent: true });
      //   }
      // }

      const extentOfTileInMapCRS = inSimpleCRS
        ? extentOfTile
        : extentOfTile.reproj(code);
      if (debugLevel >= 2) log({ extentOfTileInMapCRS });

      // ! This not working, null. Why? Probably NO OVERLAP. Can we export both as geojson to debug?
      // To stop this blocking development, chang to just the extent of the full tile...? Surely problematic
      let extentOfInnerTileInMapCRS = extentOfTileInMapCRS;
      // let extentOfInnerTileInMapCRS = extentOfTileInMapCRS.crop(
      //   inSimpleCRS ? extentOfLayer : this.extent
      // );
      // if (debugLevel >= 2)
      //   console.log(
      //     "[georaster-layer-for-leaflet] extentOfInnerTileInMapCRS",
      //     extentOfInnerTileInMapCRS.reproj(inSimpleCRS ? "simple" : 4326)
      //   );
      // if (debugLevel >= 2)
      //   log({ coords, extentOfInnerTileInMapCRS, extent: this.extent });

      // // create blue outline around tiles
      // if (debugLevel >= 4) {
      //   if (!this._cache.innerTile[cacheKey]) {
      //     const ext = inSimpleCRS
      //       ? extentOfInnerTileInMapCRS
      //       : extentOfInnerTileInMapCRS.reproj(4326);
      //     this._cache.innerTile[cacheKey] = L.rectangle(ext.leafletBounds, {
      //       color: "#F00",
      //       dashArray: "5, 10",
      //       fillOpacity: 0
      //     }).addTo(this.getMap());
      //   }
      // }

      const widthOfScreenPixelInMapCRS =
        extentOfTileInMapCRS.width / this.tileWidth;
      const heightOfScreenPixelInMapCRS =
        extentOfTileInMapCRS.height / this.tileHeight;
      if (debugLevel >= 3)
        log({ heightOfScreenPixelInMapCRS, widthOfScreenPixelInMapCRS });

      // ! TODO: Not working here, due to 'extentOfInnerTileInMapCRS' being null
      // expand tile sampling area to align with raster pixels
      const oldExtentOfInnerTileInRasterCRS = inSimpleCRS
        ? extentOfInnerTileInMapCRS
        : extentOfInnerTileInMapCRS.reproj(this.projection);
      const snapped = snap({
        bbox: oldExtentOfInnerTileInRasterCRS.bbox,
        // pad xmax and ymin of container to tolerate ceil() and floor() in snap()
        container: inSimpleCRS
          ? [
              extentOfLayer.xmin,
              extentOfLayer.ymin - 0.25 * pixelHeight,
              extentOfLayer.xmax + 0.25 * pixelWidth,
              extentOfLayer.ymax
            ]
          : [xmin, ymin - 0.25 * pixelHeight, xmax + 0.25 * pixelWidth, ymax],
        debug: debugLevel >= 2,
        origin: inSimpleCRS
          ? [extentOfLayer.xmin, extentOfLayer.ymax]
          : [xmin, ymax],
        scale: [pixelWidth, -pixelHeight] // negative because origin is at ymax
      });
      const extentOfInnerTileInRasterCRS = new GeoExtent(
        snapped.bbox_in_coordinate_system,
        {
          srs: inSimpleCRS ? "simple" : this.projection
        }
      );

      const gridbox = snapped.bbox_in_grid_cells;
      const snappedSamplesAcross = Math.abs(gridbox[2] - gridbox[0]);
      const snappedSamplesDown = Math.abs(gridbox[3] - gridbox[1]);
      const rasterPixelsAcross = Math.ceil(
        oldExtentOfInnerTileInRasterCRS.width / pixelWidth
      );
      const rasterPixelsDown = Math.ceil(
        oldExtentOfInnerTileInRasterCRS.height / pixelHeight
      );
      const layerCropExtent = inSimpleCRS ? extentOfLayer : this.extent;
      const recropTileOrig =
        oldExtentOfInnerTileInRasterCRS.crop(layerCropExtent); // may be null
      let maxSamplesAcross = 1;
      let maxSamplesDown = 1;
      if (recropTileOrig !== null) {
        const recropTileProj = inSimpleCRS
          ? recropTileOrig
          : recropTileOrig.reproj(code);
        const recropTile = recropTileProj.crop(extentOfTileInMapCRS);
        if (recropTile !== null) {
          maxSamplesAcross = Math.ceil(
            resolution * (recropTile.width / extentOfTileInMapCRS.width)
          );
          maxSamplesDown = Math.ceil(
            resolution * (recropTile.height / extentOfTileInMapCRS.height)
          );
        }
      }

      const overdrawTileAcross = rasterPixelsAcross < maxSamplesAcross;
      const overdrawTileDown = rasterPixelsDown < maxSamplesDown;
      const numberOfSamplesAcross = overdrawTileAcross
        ? snappedSamplesAcross
        : maxSamplesAcross;
      const numberOfSamplesDown = overdrawTileDown
        ? snappedSamplesDown
        : maxSamplesDown;

      // if (debugLevel >= 3)
      //   console.log(
      //     "[georaster-layer-for-leaflet] extent of inner tile before snapping " +
      //       extentOfInnerTileInMapCRS
      //         .reproj(inSimpleCRS ? "simple" : 4326)
      //         .bbox.toString()
      //   );

      // Reprojecting the bounding box back to the map CRS would expand it
      // (unless the projection is purely scaling and translation),
      // so instead just extend the old map bounding box proportionately.
      {
        const oldrb = new GeoExtent(oldExtentOfInnerTileInRasterCRS.bbox);
        const newrb = new GeoExtent(extentOfInnerTileInRasterCRS.bbox);
        const oldmb = new GeoExtent(extentOfInnerTileInMapCRS.bbox);
        if (oldrb.width !== 0 && oldrb.height !== 0) {
          let n0 = ((newrb.xmin - oldrb.xmin) / oldrb.width) * oldmb.width;
          let n1 = ((newrb.ymin - oldrb.ymin) / oldrb.height) * oldmb.height;
          let n2 = ((newrb.xmax - oldrb.xmax) / oldrb.width) * oldmb.width;
          let n3 = ((newrb.ymax - oldrb.ymax) / oldrb.height) * oldmb.height;
          if (!overdrawTileAcross) {
            n0 = Math.max(n0, 0);
            n2 = Math.min(n2, 0);
          }
          if (!overdrawTileDown) {
            n1 = Math.max(n1, 0);
            n3 = Math.min(n3, 0);
          }
          const newbox = [
            oldmb.xmin + n0,
            oldmb.ymin + n1,
            oldmb.xmax + n2,
            oldmb.ymax + n3
          ];
          extentOfInnerTileInMapCRS = new GeoExtent(newbox, {
            srs: extentOfInnerTileInMapCRS.srs
          });
        }
      }

      // // create outline around raster pixels
      // if (debugLevel >= 4) {
      //   if (!this._cache.innerTile[cacheKey]) {
      //     const ext = inSimpleCRS
      //       ? extentOfInnerTileInMapCRS
      //       : extentOfInnerTileInMapCRS.reproj(4326);
      //     this._cache.innerTile[cacheKey] = L.rectangle(ext.leafletBounds, {
      //       color: "#F00",
      //       dashArray: "5, 10",
      //       fillOpacity: 0
      //     }).addTo(this.getMap());
      //   }
      // }

      // if (debugLevel >= 3)
      //   console.log(
      //     "[georaster-layer-for-leaflet] extent of inner tile after snapping " +
      //       extentOfInnerTileInMapCRS
      //         .reproj(inSimpleCRS ? "simple" : 4326)
      //         .bbox.toString()
      //   );

      // Note that the snapped "inner" tile may extend beyond the original tile,
      // in which case the padding values will be negative.

      // we round here because sometimes there will be slight floating arithmetic issues
      // where the padding is like 0.00000000000001
      const padding = {
        left: Math.round(
          (extentOfInnerTileInMapCRS.xmin - extentOfTileInMapCRS.xmin) /
            widthOfScreenPixelInMapCRS
        ),
        right: Math.round(
          (extentOfTileInMapCRS.xmax - extentOfInnerTileInMapCRS.xmax) /
            widthOfScreenPixelInMapCRS
        ),
        top: Math.round(
          (extentOfTileInMapCRS.ymax - extentOfInnerTileInMapCRS.ymax) /
            heightOfScreenPixelInMapCRS
        ),
        bottom: Math.round(
          (extentOfInnerTileInMapCRS.ymin - extentOfTileInMapCRS.ymin) /
            heightOfScreenPixelInMapCRS
        )
      };
      if (debugLevel >= 3) log({ padding });

      const innerTileHeight = this.tileHeight - padding.top - padding.bottom;
      const innerTileWidth = this.tileWidth - padding.left - padding.right;
      if (debugLevel >= 3) log({ innerTileHeight, innerTileWidth });

      if (debugLevel >= 4) {
        const xMinOfInnerTileInMapCRS =
          extentOfTileInMapCRS.xmin + padding.left * widthOfScreenPixelInMapCRS;
        const yMinOfInnerTileInMapCRS =
          extentOfTileInMapCRS.ymin +
          padding.bottom * heightOfScreenPixelInMapCRS;
        const xMaxOfInnerTileInMapCRS =
          extentOfTileInMapCRS.xmax -
          padding.right * widthOfScreenPixelInMapCRS;
        const yMaxOfInnerTileInMapCRS =
          extentOfTileInMapCRS.ymax - padding.top * heightOfScreenPixelInMapCRS;
        log({
          xMinOfInnerTileInMapCRS,
          yMinOfInnerTileInMapCRS,
          xMaxOfInnerTileInMapCRS,
          yMaxOfInnerTileInMapCRS
        });
      }

      const canvasPadding = {
        left: Math.max(padding.left, 0),
        right: Math.max(padding.right, 0),
        top: Math.max(padding.top, 0),
        bottom: Math.max(padding.bottom, 0)
      };
      const canvasHeight =
        this.tileHeight - canvasPadding.top - canvasPadding.bottom;
      const canvasWidth =
        this.tileWidth - canvasPadding.left - canvasPadding.right;

      // set padding and size of canvas tile
      tile.style.paddingTop = canvasPadding.top + "px";
      tile.style.paddingRight = canvasPadding.right + "px";
      tile.style.paddingBottom = canvasPadding.bottom + "px";
      tile.style.paddingLeft = canvasPadding.left + "px";

      tile.height = canvasHeight;
      tile.style.height = canvasHeight + "px";

      tile.width = canvasWidth;
      tile.style.width = canvasWidth + "px";
      if (debugLevel >= 3)
        console.log("setting tile height to " + canvasHeight + "px");
      if (debugLevel >= 3)
        console.log("setting tile width to " + canvasWidth + "px");

      // set how large to display each sample in screen pixels
      const heightOfSampleInScreenPixels =
        innerTileHeight / numberOfSamplesDown;
      const heightOfSampleInScreenPixelsInt = Math.ceil(
        heightOfSampleInScreenPixels
      );
      const widthOfSampleInScreenPixels =
        innerTileWidth / numberOfSamplesAcross;
      const widthOfSampleInScreenPixelsInt = Math.ceil(
        widthOfSampleInScreenPixels
      );

      // const map = this.getMap();
      const tileSize = this.getTileSize();

      // this converts tile coordinates (how many tiles down and right)
      // to pixels from left and top of tile pane
      const tileNwPoint = coords.scaleBy(tileSize);
      if (debugLevel >= 4) log({ tileNwPoint });
      const xLeftOfInnerTile = tileNwPoint.x + padding.left;
      const yTopOfInnerTile = tileNwPoint.y + padding.top;
      const innerTileTopLeftPoint = { x: xLeftOfInnerTile, y: yTopOfInnerTile };
      if (debugLevel >= 4) log({ innerTileTopLeftPoint });

      // render asynchronously so tiles show up as they finish instead of all at once (which blocks the UI)
      setTimeout(async () => {
        try {
          let tileRasters: number[][][] | null = null;
          if (!rasters) {
            tileRasters = await this.getRasters({
              innerTileTopLeftPoint,
              heightOfSampleInScreenPixels,
              widthOfSampleInScreenPixels,
              zoom,
              pixelHeight,
              pixelWidth,
              numberOfSamplesAcross,
              numberOfSamplesDown,
              ymax,
              xmin
            });
            if (tileRasters && this.calcStats) {
              const { noDataValue } = this;
              for (
                let bandIndex = 0;
                bandIndex < tileRasters.length;
                bandIndex++
              ) {
                let min = this.currentStats.mins[bandIndex];
                let max = this.currentStats.maxs[bandIndex];
                const band = tileRasters[bandIndex];
                for (let rowIndex = 0; rowIndex < band.length; rowIndex++) {
                  const row = band[rowIndex];
                  for (
                    let columnIndex = 0;
                    columnIndex < row.length;
                    columnIndex++
                  ) {
                    const value = row[columnIndex];
                    if (value !== noDataValue) {
                      if (min === undefined || value < min) {
                        min = value;
                      }
                      if (max === undefined || value > max) {
                        max = value;
                      }
                    }
                  }
                }
                this.currentStats.mins[bandIndex] = min;
                this.currentStats.maxs[bandIndex] = max;
                this.currentStats.ranges[bandIndex] = max - min;
              }
            }
            if (this._dynamic) {
              try {
                const rawToRgbFn = (rawToRgb as any).default || rawToRgb;
                this.rawToRgb = rawToRgbFn({
                  format: "string",
                  flip: this.currentStats.mins.length === 1 ? true : false,
                  ranges: zip(this.currentStats.mins, this.currentStats.maxs),
                  round: true
                });
              } catch (error) {
                console.error(error);
              }
            }
          }

          await this.checkIfYCbCr;

          for (let h = 0; h < numberOfSamplesDown; h++) {
            const yCenterInMapPixels =
              yTopOfInnerTile + (h + 0.5) * heightOfSampleInScreenPixels;
            const latWestPoint = L.point(xLeftOfInnerTile, yCenterInMapPixels);
            // ! Using Leaflet map here, use proj or Cesium reprojection instead?
            const { lat } = this.unproject(latWestPoint, zoom);
            if (lat > yMinOfLayer && lat < yMaxOfLayer) {
              const yInTilePixels =
                Math.round(h * heightOfSampleInScreenPixels) +
                Math.min(padding.top, 0);

              let yInRasterPixels = 0;
              if (inSimpleCRS || this.projection === EPSG4326) {
                yInRasterPixels = Math.floor((yMaxOfLayer - lat) / pixelHeight);
              }

              for (let w = 0; w < numberOfSamplesAcross; w++) {
                const latLngPoint = L.point(
                  xLeftOfInnerTile + (w + 0.5) * widthOfSampleInScreenPixels,
                  yCenterInMapPixels
                );
                // ! Using Leaflet map here, use proj or Cesium reprojection instead?
                const { lng: xOfLayer } = this.unproject(latLngPoint, zoom);
                if (xOfLayer > xMinOfLayer && xOfLayer < xMaxOfLayer) {
                  let xInRasterPixels = 0;
                  if (inSimpleCRS || this.projection === EPSG4326) {
                    xInRasterPixels = Math.floor(
                      (xOfLayer - xMinOfLayer) / pixelWidth
                    );
                  } else if (this.getProjector()) {
                    const inverted = this.getProjector().inverse({
                      x: xOfLayer,
                      y: lat
                    });
                    const yInSrc = inverted.y;
                    yInRasterPixels = Math.floor((ymax - yInSrc) / pixelHeight);
                    if (yInRasterPixels < 0 || yInRasterPixels >= rasterHeight)
                      continue;

                    const xInSrc = inverted.x;
                    xInRasterPixels = Math.floor((xInSrc - xmin) / pixelWidth);
                    if (xInRasterPixels < 0 || xInRasterPixels >= rasterWidth)
                      continue;
                  }
                  let values = null;
                  if (tileRasters) {
                    // get value from array specific to this tile
                    values = tileRasters.map((band) => band[h][w]);
                  } else if (rasters) {
                    // get value from array with data for entire raster
                    values = rasters.map((band: number[][]) => {
                      return band[yInRasterPixels][xInRasterPixels];
                    });
                  } else {
                    done &&
                      done(
                        Error(
                          "no rasters are available for, so skipping value generation"
                        )
                      );
                    return;
                  }

                  // x-axis coordinate of the starting point of the rectangle representing the raster pixel
                  const x =
                    Math.round(w * widthOfSampleInScreenPixels) +
                    Math.min(padding.left, 0);

                  // y-axis coordinate of the starting point of the rectangle representing the raster pixel
                  const y = yInTilePixels;

                  // how many real screen pixels does a pixel of the sampled raster take up
                  const width = widthOfSampleInScreenPixelsInt;
                  const height = heightOfSampleInScreenPixelsInt;

                  if (this.options.customDrawFunction) {
                    this.options.customDrawFunction({
                      values,
                      context,
                      x,
                      y,
                      width,
                      height,
                      rasterX: xInRasterPixels,
                      rasterY: yInRasterPixels,
                      sampleX: w,
                      sampleY: h,
                      sampledRaster: tileRasters
                    });
                  } else {
                    const color = this.getColor(values);
                    if (color && context) {
                      context.fillStyle = color;
                      context.fillRect(x, y, width, height);
                    }
                  }
                }
              }
            }
          }

          if (this.mask) {
            if (inSimpleCRS) {
              console.warn(
                "[georaster-layer-for-leaflet] mask is not supported when using simple projection"
              );
            } else {
              this.mask.then((mask: Mask) => {
                geocanvas.maskCanvas({
                  canvas: tile,
                  // eslint-disable-next-line camelcase
                  canvas_bbox: extentOfInnerTileInMapCRS.bbox, // need to support simple projection too
                  // eslint-disable-next-line camelcase
                  canvas_srs: 3857, // default map crs, need to support simple
                  mask,
                  // eslint-disable-next-line camelcase
                  mask_srs: this.mask_srs,
                  strategy: this.mask_strategy // hide everything inside or outside the mask
                });
              });
            }
          }

          tile.style.visibility = "visible"; // set to default
        } catch (e: any) {
          console.error(e);
          error = e;
        }
        done && done(error, tile);
      }, 0);

      // return the tile so it can be rendered on screen
      return tile;
    } catch (error: any) {
      console.error(error);
      done && done(error, tile);
    }
  },

  // copied from Leaflet with slight modifications,
  // including removing the lines that set the tile size
  _initTile: function (tile: HTMLCanvasElement) {
    // ! Might not even be called. These are hacks that might need to be implemented in `ImageryProviderLeafletGridLayer`
    L.DomUtil.addClass(tile, "leaflet-tile");

    tile.onselectstart = L.Util.falseFn;
    tile.onmousemove = L.Util.falseFn;

    // update opacity on tiles in IE7-8 because of filter inheritance problems
    if (L.Browser.ielt9 && this.options.opacity < 1) {
      L.DomUtil.setOpacity(tile, this.options.opacity);
    }

    // without this hack, tiles disappear after zoom on Chrome for Android
    // https://github.com/Leaflet/Leaflet/issues/2078
    if (L.Browser.android && !L.Browser.android23) {
      (<CustomCSSStyleDeclaration>tile.style).WebkitBackfaceVisibility =
        "hidden";
    }
  },

  // method from https://github.com/Leaflet/Leaflet/blob/bb1d94ac7f2716852213dd11563d89855f8d6bb1/src/layer/ImageOverlay.js
  getBounds: function () {
    this.initBounds();
    return this._bounds;
  },

  // getMap: function () {
  //   return this._map || this._mapToAdd;
  // },

  // TODO: Need to find a way to check this for Cesium and Leaflet modes I think. We dont have access to getMap anymore.
  getMapCRS: function () {
    return L.CRS.EPSG3857;
    // return this.getMap()?.options.crs || L.CRS.EPSG3857;
  },

  // // add in to ensure backwards compatability with Leaflet 1.0.3
  // // ! Maybe can remove this
  // _tileCoordsToNwSe: function (coords: Coords) {
  //   const tileSize = this.getTileSize();
  //   const nwPoint = coords.scaleBy(tileSize);
  //   const sePoint = nwPoint.add(tileSize);

  //   // ! Using Leaflet map here, use proj or Cesium reprojection instead?
  //   const nw = this.unproject(nwPoint, coords.z);

  //   // ! Using Leaflet map here, use proj or Cesium reprojection instead?
  //   const se = this.unproject(sePoint, coords.z);
  //   return [nw, se];
  // },

  _tileCoordsToNwSe: function (coords: Coords) {
    // ! Added this myself, it seems to work better than above code.
    // TODO: Also see where map.unproject has been used elsewhere, it is probably giving wrong results as my unproject function is not quite right now

    const { x, y, z } = coords;
    const n = Math.pow(2, z) * tileSize;

    // NW corner calculations
    const nwLonDeg = (x / n) * 360.0 - 180.0;
    const nwLatRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
    const nwLatDeg = (nwLatRad * 180.0) / Math.PI;
    const nw = { lat: nwLatDeg, lng: nwLonDeg };

    // SE corner calculations (considering the next tile in both x and y directions)
    const seLonDeg = ((x + 1) / n) * 360.0 - 180.0;
    const seLatRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n)));
    const seLatDeg = (seLatRad * 180.0) / Math.PI;
    const se = { lat: seLatDeg, lng: seLonDeg };

    return [nw, se];
  },

  _tileCoordsToBounds: function (coords: Coords) {
    const [nw, se] = this._tileCoordsToNwSe(coords);

    let bounds: LatLngBounds = new L.LatLngBounds(nw, se);

    // TODO: May have broken this functionality, review
    // ! Changing this, no access to getMap()
    // if (!this.options.noWrap) {
    //   const { crs } = this.getMap().options;
    //   bounds = crs.wrapLatLngBounds(bounds);
    // }
    return bounds;
  },

  _isValidTile: function (coords: Coords) {
    const crs = this.getMapCRS();

    if (!crs.infinite) {
      // don't load tile if it's out of bounds and not wrapped
      const globalBounds = this._globalTileRange;
      if (
        (!crs.wrapLng &&
          (coords.x < globalBounds.min.x || coords.x > globalBounds.max.x)) ||
        (!crs.wrapLat &&
          (coords.y < globalBounds.min.y || coords.y > globalBounds.max.y))
      ) {
        return false;
      }
    }

    const bounds = this.getBounds();

    if (!bounds) {
      return true;
    }

    const { x, y, z } = coords;

    // not sure what srs should be here when simple crs
    const layerExtent = new GeoExtent(bounds, { srs: 4326 });

    const boundsOfTile = this._tileCoordsToBounds(coords);

    // check given tile coordinates
    if (layerExtent.overlaps(boundsOfTile)) return true;

    // if not within the original confines of the earth return false
    // we don't want wrapping if using Simple CRS
    if (isSimpleCRS(crs)) return false;

    // width of the globe in tiles at the given zoom level
    const width = Math.pow(2, z);

    // check one world to the left
    const leftCoords = L.point(x - width, y) as Coords;
    leftCoords.z = z;
    const leftBounds = this._tileCoordsToBounds(leftCoords);
    if (layerExtent.overlaps(leftBounds)) return true;

    // check one world to the right
    const rightCoords = L.point(x + width, y) as Coords;
    rightCoords.z = z;
    const rightBounds = this._tileCoordsToBounds(rightCoords);
    if (layerExtent.overlaps(rightBounds)) return true;

    return false;
  },

  getColor: function (values: number[]): string | undefined {
    if (this.options.pixelValuesToColorFn) {
      return this.options.pixelValuesToColorFn(values);
    } else {
      const numberOfValues = values.length;
      const haveDataForAllBands = values.every(
        (value) => value !== undefined && value !== this.noDataValue
      );
      if (haveDataForAllBands) {
        if (numberOfValues == 1) {
          const value = values[0];
          if (this.palette) {
            const [r, g, b, a] = this.palette[value];
            return `rgba(${r},${g},${b},${a / 255})`;
          } else if (this.georasters[0].mins) {
            const { mins, ranges } = this.georasters[0];
            return this.scale((values[0] - mins[0]) / ranges[0]).hex();
          } else if (this.currentStats.mins) {
            const min = this.currentStats.mins[0];
            const range = this.currentStats.ranges[0];
            return this.scale((values[0] - min) / range).hex();
          }
        } else if (numberOfValues === 2) {
          return `rgb(${values[0]},${values[1]},0)`;
        } else if (numberOfValues === 3) {
          return `rgb(${values[0]},${values[1]},${values[2]})`;
        } else if (numberOfValues === 4) {
          return `rgba(${values[0]},${values[1]},${values[2]},${
            values[3] / 255
          })`;
        }
      }
    }
  },

  /**
   * Redraws the active map tiles updating the pixel values using the supplie callback
   */
  updateColors(
    pixelValuesToColorFn: /**The callback used to determine the colour based on the values of each pixel */ PixelValuesToColorFn,
    { debugLevel = -1 } = { debugLevel: -1 }
  ) {
    if (!pixelValuesToColorFn) {
      throw new Error("Missing pixelValuesToColorFn function");
    }

    // if debugLevel is -1, set it to the default for the class
    if (debugLevel === -1) debugLevel = this.debugLevel;

    if (debugLevel >= 1) console.log("Start updating active tile pixel values");

    // update option to ensure correct colours at other zoom levels.
    this.options.pixelValuesToColorFn = pixelValuesToColorFn;

    const tiles = this.getActiveTiles();
    if (!tiles) {
      console.error("No active tiles available");
      return this;
    }

    if (debugLevel >= 1) console.log("Active tiles fetched", tiles);

    tiles.forEach((tile: Tile) => {
      const { coords, el } = tile;
      this.drawTile({ tile: el, coords, context: el.getContext("2d") });
    });
    if (debugLevel >= 1) console.log("Finished updating active tile colours");
    return this;
  },

  getTiles(): Tile[] {
    // transform _tiles object collection into an array
    return Object.values(this._tiles);
  },

  getActiveTiles(): Tile[] {
    const tiles: Tile[] = this.getTiles();
    // only return valid tiles
    return tiles.filter((tile) => this._isValidTile(tile.coords));
  },

  isSupportedProjection: function () {
    if (this._isSupportedProjection === undefined) {
      const projection = this.projection;
      if (isUTM(projection)) {
        this._isSupportedProjection = true;
      } else if (PROJ4_SUPPORTED_PROJECTIONS.has(projection)) {
        this._isSupportedProjection = true;
      } else if (
        typeof proj4FullyLoaded === "function" &&
        `EPSG:${projection}` in proj4FullyLoaded.defs
      ) {
        this._isSupportedProjection = true;
      } else if (
        typeof proj4 === "function" &&
        typeof proj4.defs !== "undefined" &&
        `EPSG:${projection}` in proj4.defs
      ) {
        this._isSupportedProjection = true;
      } else {
        this._isSupportedProjection = false;
      }
    }
    return this._isSupportedProjection;
  },

  getProjectionString: function (projection: number) {
    if (isUTM(projection)) {
      return getProjString(projection);
    }
    return `EPSG:${projection}`;
  },

  initBounds: function (options: GeoRasterLayerOptions) {
    if (!options) options = this.options;
    if (!this._bounds) {
      const { debugLevel, height, width, projection, xmin, xmax, ymin, ymax } =
        this;
      // check if map using Simple CRS
      if (isSimpleCRS(this.getMapCRS())) {
        if (height === width) {
          this._bounds = L.latLngBounds([ORIGIN, [MAX_NORTHING, MAX_EASTING]]);
        } else if (height > width) {
          this._bounds = L.latLngBounds([
            ORIGIN,
            [MAX_NORTHING, MAX_EASTING / this.ratio]
          ]);
        } else if (width > height) {
          this._bounds = L.latLngBounds([
            ORIGIN,
            [MAX_NORTHING * this.ratio, MAX_EASTING]
          ]);
        }
      } else if (projection === EPSG4326) {
        if (debugLevel >= 1)
          console.log(`georaster projection is in ${EPSG4326}`);
        const minLatWest = L.latLng(ymin, xmin);
        const maxLatEast = L.latLng(ymax, xmax);
        this._bounds = L.latLngBounds(minLatWest, maxLatEast);
      } else if (this.getProjector()) {
        if (debugLevel >= 1)
          console.log("projection is UTM or supported by proj4");
        const bottomLeft = this.getProjector().forward({ x: xmin, y: ymin });
        const minLatWest = L.latLng(bottomLeft.y, bottomLeft.x);
        const topRight = this.getProjector().forward({ x: xmax, y: ymax });
        const maxLatEast = L.latLng(topRight.y, topRight.x);
        this._bounds = L.latLngBounds(minLatWest, maxLatEast);
      } else {
        if (typeof proj4FullyLoaded !== "function") {
          throw `You are using the lite version of georaster-layer-for-leaflet, which does not support rasters with the projection ${projection}.  Please try using the default build or add the projection definition to your global proj4.`;
        } else {
          throw `GeoRasterLayer does not provide built-in support for rasters with the projection ${projection}.  Add the projection definition to your global proj4.`;
        }
      }

      // these values are used so we don't try to sample outside of the raster
      this.xMinOfLayer = this._bounds.getWest();
      this.xMaxOfLayer = this._bounds.getEast();
      this.yMaxOfLayer = this._bounds.getNorth();
      this.yMinOfLayer = this._bounds.getSouth();

      options.bounds = this._bounds;
    }
  },

  getProjector: function () {
    if (this.isSupportedProjection()) {
      if (!proj4FullyLoaded && !proj4) {
        throw "proj4 must be found in the global scope in order to load a raster that uses this projection";
      }
      if (!this._projector) {
        const projString = this.getProjectionString(this.projection);
        if (this.debugLevel >= 1) log({ projString });
        let proj4Lib;
        if (projString.startsWith("EPSG")) {
          if (
            typeof proj4 === "function" &&
            typeof proj4.defs === "function" &&
            projString in proj4.defs
          ) {
            proj4Lib = proj4;
          } else if (
            typeof proj4FullyLoaded === "function" &&
            typeof proj4FullyLoaded.defs === "function" &&
            projString in proj4FullyLoaded.defs
          ) {
            proj4Lib = proj4FullyLoaded;
          } else {
            throw "[georaster-layer-for-leaflet] projection not found in proj4 instance";
          }
        } else {
          if (typeof proj4 === "function") {
            proj4Lib = proj4;
          } else if (typeof proj4FullyLoaded === "function") {
            proj4Lib = proj4FullyLoaded;
          } else {
            throw "[georaster-layer-for-leaflet] projection not found in proj4 instance";
          }
        }
        this._projector = proj4Lib(projString, `EPSG:${EPSG4326}`);

        if (this.debugLevel >= 1) console.log("projector set");
      }
      return this._projector;
    }
  },

  same(array: GeoRaster[], key: GeoRasterKeys) {
    return new Set(array.map((item) => item[key])).size === 1;
  },

  clearCache() {
    this.cache = {};
  },

  _getResolution(zoom: number) {
    const { resolution } = this.options;

    let resolutionValue;
    if (typeof resolution === "object") {
      const zoomLevels = Object.keys(resolution);

      for (const key in zoomLevels) {
        if (Object.prototype.hasOwnProperty.call(zoomLevels, key)) {
          const zoomLvl = parseInt(zoomLevels[key]);
          if (zoomLvl <= zoom) {
            resolutionValue = resolution[zoomLvl];
          } else {
            break;
          }
        }
      }
    } else {
      resolutionValue = resolution;
    }

    return resolutionValue;
  }
});

/* eslint-disable @typescript-eslint/no-explicit-any */
if (typeof window === "object") {
  (window as any)["GeoRasterLayer"] = GeoRasterLayer;
}
if (typeof self !== "undefined") {
  (self as any)["GeoRasterLayer"] = GeoRasterLayer;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// Explicitly exports public types
export type {
  GeoRaster,
  GeoRasterLayerOptions,
  PixelValuesToColorFn
} from "./types";
