// @ts-nocheck

/** This file has been taken from https://github.com/hongfaqiu/TIFFImageryProvider and modified by the Terria team.
 * We diverge from that repo as of commit d7cc3cbd889cf78ed544e2e8df11667861497d59
 */

import Event from "terriajs-cesium/Source/Core/Event";
import GeographicTilingScheme from "terriajs-cesium/Source/Core/GeographicTilingScheme";
import Credit from "terriajs-cesium/Source/Core/Credit";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import { default as CMath } from "terriajs-cesium/Source/Core/Math";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import { Pool, fromUrl as tiffFromUrl, GeoTIFFImage } from "geotiff";

import { addColorScale, plot } from "./plotty";
import WorkerFarm from "./worker-farm";
import { getMinMax, generateColorScale, findAndSortBandNumbers } from "./utils";
import { ColorScaleNames, TypedArray } from "./plotty/typing";

export interface SingleBandRenderOptions {
  /** band index start from 1, defaults to 1 */
  band?: number;

  /**
   * The color scale image to use.
   */
  colorScaleImage?: HTMLCanvasElement | HTMLImageElement;

  /**
   * The name of a named color scale to use.
   */
  colorScale?: ColorScaleNames;

  /** custom interpolate colors, [stopValue(0 -1), color] or [color], if the latter, means equal distribution
   * @example
   * [[0, 'red'], [0.6, 'green'], [1, 'blue']]
   */
  colors?: [number, string][] | string[];

  /** defaults to continuous*/
  type?: "continuous" | "discrete";

  /**
   * The value domain to scale the color.
   */
  domain?: [number, number];

  /**
   * Range of values that will be rendered, values outside of the range will be transparent.
   */
  displayRange?: [number, number];

  /**
   * Set if displayRange should be used.
   */
  applyDisplayRange?: boolean;

  /**
   * Whether or not values below the domain shall be clamped.
   */
  clampLow?: boolean;

  /**
   * Whether or not values above the domain shall be clamped (if not defined defaults to clampLow value).
   */
  clampHigh?: boolean;

  /**
   * Sets a mathematical expression to be evaluated on the plot. Expression can contain mathematical operations with integer/float values, band identifiers or GLSL supported functions with a single parameter.
   * Supported mathematical operations are: add '+', subtract '-', multiply '*', divide '/', power '**', unary plus '+a', unary minus '-a'.
   * Useful GLSL functions are for example: radians, degrees, sin, asin, cos, acos, tan, atan, log2, log, sqrt, exp2, exp, abs, sign, floor, ceil, fract.
   * Don't forget to set the domain parameter!
   * @example
   * '-2 * sin(3.1415 - b1) ** 2'
   * '(b1 - b2) / (b1 + b2)'
   */
  expression?: string;
}

export interface MultiBandRenderOptions {
  /** Band value starts from 1*/
  r?: {
    band: number;
    min?: number;
    max?: number;
  };
  g?: {
    band: number;
    min?: number;
    max?: number;
  };
  b?: {
    band: number;
    min?: number;
    max?: number;
  };
}

export type TIFFImageryProviderRenderOptions = {
  /** nodata value, default read from tiff meta*/
  nodata?: number;
  /** try to render multi band cog to RGB, priority 1*/
  convertToRGB?: boolean;
  /** priority 2*/
  multi?: MultiBandRenderOptions;
  /** priority 3*/
  single?: SingleBandRenderOptions;
};

export interface TIFFImageryProviderOptions {
  url: string;
  credit?: string;
  tileSize?: number;
  maximumLevel?: number;
  minimumLevel?: number;
  enablePickFeatures?: boolean;
  hasAlphaChannel?: boolean;
  renderOptions?: TIFFImageryProviderRenderOptions;
  /** projection function, convert [lon, lat] position to EPSG:4326*/
  // MODIFIED FROM SOURCE by Terria - We want to accept a Promise for the projFunc
  projFunc?: (
    code: number
  ) =>
    | ((pos: number[]) => number[])
    | Promise<(pos: number[]) => number[]>
    | void;
  /** cache survival time, defaults to 60 *1000 ms*/
  cache?: number;
  /** geotiff resample method, defaults to nearest*/
  resampleMethod?: "nearest" | "bilinear" | "linear";
}
const canvas = document.createElement("canvas");

let workerPool: Pool | undefined;
function getWorkerPool() {
  if (!workerPool) {
    workerPool = new Pool();
    if (!workerPool.workers) {
      workerPool = undefined;
    }
  }
  return workerPool;
}

export class TIFFImageryProvider {
  ready: boolean;
  tilingScheme: GeographicTilingScheme;
  rectangle: Rectangle;
  tileSize: number;
  tileWidth: number;
  tileHeight: number;
  maximumLevel: number;
  minimumLevel: number;
  credit: Credit;
  private _error: Event;
  readyPromise: Promise<boolean>;
  private _destroyed = false;
  _source!: GeoTIFF;
  private _imageCount!: number;
  _images: (GeoTIFFImage | null)[] = [];
  _imagesCache: Record<
    string,
    {
      time: number;
      data: HTMLCanvasElement | HTMLImageElement;
      // MODIFIED FROM SOURCE by Terria: data: ImageData | HTMLCanvasElement | HTMLImageElement;
    }
  > = {};
  bands: Record<
    number,
    {
      min: number;
      max: number;
    }
  >;
  noData: number;
  hasAlphaChannel: boolean;
  private _pool: Pool;
  private _workerFarm: WorkerFarm | null;
  private _cacheTime: number;
  plot: plot;
  renderOptions: TIFFImageryProviderRenderOptions;
  readSamples: number[];
  cogLevels: number[];
  constructor(private readonly options: TIFFImageryProviderOptions) {
    this.ready = false;
    this.hasAlphaChannel = options.hasAlphaChannel ?? true;
    this.maximumLevel = options.maximumLevel ?? 18;
    this.minimumLevel = options.minimumLevel ?? 0;
    this.credit = new Credit(options.credit || "", false);
    this._error = new Event();

    this._workerFarm = new WorkerFarm();
    this._cacheTime = options.cache ?? 60 * 1000;

    this.readyPromise = tiffFromUrl(options.url, {
      allowFullFile: true
    }).then(async (res) => {
      this._pool = getWorkerPool();
      this._source = res;
      const image = await res.getImage();

      this._imageCount = await res.getImageCount();
      this.tileSize = this.tileWidth =
        options.tileSize || image.getTileWidth() || 512;
      this.tileHeight = options.tileSize || image.getTileHeight() || 512;
      // Get the appropriate cog level
      this.cogLevels = await this._getCogLevels();

      // Get the number of bands
      const samples = image.getSamplesPerPixel();
      this.renderOptions = options.renderOptions ?? {};
      // Get nodata value
      const noData = image.getGDALNoData();
      this.noData = this.renderOptions.nodata ?? noData;

      // assign initial value
      if (samples < 3 && this.renderOptions.convertToRGB) {
        const error = new DeveloperError(
          "Can not render the image as RGB, please check the convertToRGB parameter"
        );
        throw error;
      }
      if (
        !this.renderOptions.single &&
        !this.renderOptions.multi &&
        !this.renderOptions.convertToRGB
      ) {
        if (samples > 1) {
          this.renderOptions = {
            convertToRGB: true,
            ...this.renderOptions
          };
        } else {
          this.renderOptions = {
            single: {
              band: 1
            },
            ...this.renderOptions
          };
        }
      }
      if (this.renderOptions.single) {
        this.renderOptions.single.band = this.renderOptions.single.band ?? 1;
      }

      const { single, multi, convertToRGB } = this.renderOptions;
      this.readSamples = multi
        ? [multi.r.band - 1, multi.g.band - 1, multi.b.band - 1]
        : convertToRGB
        ? [0, 1, 2]
        : [0];
      if (single?.expression) {
        this.readSamples = findAndSortBandNumbers(single.expression);
      }

      // Get band maximum and minimum value information
      const bands: Record<
        number,
        {
          min: number;
          max: number;
        }
      > = {};
      await Promise.all(
        this.readSamples.map(async (i) => {
          const element = image.getGDALMetadata(i);
          const bandNum = i + 1;

          if (element?.STATISTICS_MINIMUM && element?.STATISTICS_MAXIMUM) {
            bands[bandNum] = {
              min: +element.STATISTICS_MINIMUM,
              max: +element.STATISTICS_MAXIMUM
            };
          } else {
            if (convertToRGB) {
              bands[bandNum] = {
                min: 0,
                max: 255
              };
            }

            if (multi) {
              const inputBand =
                multi[
                  Object.keys(multi).find((key) => multi[key]?.band === bandNum)
                ];
              if (
                inputBand?.min !== undefined &&
                inputBand?.max !== undefined
              ) {
                const { min, max } = inputBand;
                bands[bandNum] = {
                  min,
                  max
                };
              }
            }

            if (
              single &&
              !single.expression &&
              single.band === bandNum &&
              single.domain
            ) {
              bands[bandNum] = {
                min: single.domain[0],
                max: single.domain[1]
              };
            }

            if (!single?.expression && !bands[bandNum]) {
              // Try to get band max and min
              console.warn(
                `Can not get band${bandNum} min/max, try to calculate min/max values, or setting ${
                  single ? "domain" : "min / max"
                }`
              );

              const previewImage = await res.getImage(this.cogLevels[0]);
              const data = (
                (await previewImage.readRasters({
                  samples: [i],
                  pool: this._pool
                })) as unknown as number[][]
              )[0].filter((item: any) => !isNaN(item));
              bands[bandNum] = getMinMax(data, noData);
            }
          }
        })
      );
      this.bands = bands;

      // Get the spatial range
      const bbox = image.getBoundingBox();
      const [west, south, east, north] = bbox;

      const prjCode = +(
        image.geoKeys.ProjectedCSTypeGeoKey ??
        image.geoKeys.GeographicTypeGeoKey
      );
      const { projFunc } = options;
      const proj = await projFunc?.(prjCode); // MODIFIED FROM SOURCE by Terria: to accept projFunc as a Promise

      if (typeof proj === "function") {
        const leftBottom = proj([west, south]);
        const rightTop = proj([east, north]);
        this.rectangle = Rectangle.fromDegrees(
          leftBottom[0],
          leftBottom[1],
          rightTop[0],
          rightTop[1]
        );
      } else if (prjCode === 4326) {
        this.rectangle = Rectangle.fromDegrees(...bbox);
      } else {
        const error = new DeveloperError(
          `Unspported projection type: EPSG:${prjCode}, please add projFunc parameter to handle projection`
        );
        throw error;
      }

      // Handles cases across 180 degrees of longitude
      // https://github.com/CesiumGS/cesium/blob/da00d26473f663db180cacd8e662ca4309e09560/packages/engine/Source/Core/TileAvailability.js#L195
      if (this.rectangle.east < this.rectangle.west) {
        this.rectangle.east += CMath.TWO_PI;
      }
      this.tilingScheme = new GeographicTilingScheme({
        rectangle: this.rectangle,
        numberOfLevelZeroTilesX: 1,
        numberOfLevelZeroTilesY: 1
      });
      const maxCogLevel = this.cogLevels.length - 1;
      this.maximumLevel =
        this.maximumLevel > maxCogLevel ? maxCogLevel : this.maximumLevel;
      this._images = new Array(this._imageCount).fill(null);

      // If it is single-pass rendering, construct the plot object
      try {
        if (this.renderOptions.single) {
          const band = this.bands[single.band];
          if (!single.expression && !band) {
            throw new DeveloperError(`Invalid band${single.band}`);
          }
          this.plot = new plot({
            canvas,
            ...single,
            domain: single.domain ?? [band.min, band.max]
          });
          this.plot.setNoDataValue(this.noData);

          const { expression, colors } = single;
          this.plot.setExpression(expression);
          if (colors) {
            const colorScale = generateColorScale(colors);
            addColorScale("temp", colorScale.colors, colorScale.positions);
            this.plot.setColorScale("temp" as any);
          } else {
            this.plot.setColorScale(single?.colorScale ?? "blackwhite");
          }
        }
      } catch (e) {
        console.error(e);
        this._error.raiseEvent(e);
      }

      this.ready = true;
      // MODIFIED FROM SOURCE by Terria: we want to return a boolean to conform to our Interface.
      return this.ready;
    });
  }

  /**
   * Gets an event that will be raised if an error is encountered during processing.
   * @memberof GeoJsonDataSource.prototype
   * @type {Event}
   */
  get errorEvent() {
    return this._error;
  }

  get isDestroyed() {
    return this._destroyed;
  }

  /**
   * get suitable cog levels
   */
  private async _getCogLevels() {
    const levels: number[] = [];
    let maximumLevel: number = this._imageCount - 1;
    for (let i = this._imageCount - 1; i >= 0; i--) {
      const image = (this._images[i] = await this._source.getImage(i));
      const width = image.getWidth();
      const height = image.getHeight();
      const size = Math.max(width, height);

      // If the image tileSize of the first tile is greater than 512, it will be delayed sequentially to reduce the amount of requests
      if (i === this._imageCount - 1) {
        const firstImageLevel = Math.ceil(
          (size - this.tileSize) / this.tileSize
        );
        levels.push(...new Array(firstImageLevel).fill(i));
      }

      // add 50% tilewidth tolerance
      if (size > this.tileSize * 0.5) {
        maximumLevel = i;
        break;
      }
    }
    let nowCogLevel: number = maximumLevel;
    while (nowCogLevel >= 0) {
      levels.push(nowCogLevel--);
    }
    return levels;
  }

  /**
   * Get tile data
   * @param x
   * @param y
   * @param z
   */
  private async _loadTile(x: number, y: number, z: number) {
    const index = this.cogLevels[z];
    let image = this._images[index];
    if (!image) {
      image = this._images[index] = await this._source.getImage(index);
    }
    const width = image.getWidth();
    const height = image.getHeight();

    const tileXNum = this.tilingScheme.getNumberOfXTilesAtLevel(z);
    const tileYNum = this.tilingScheme.getNumberOfYTilesAtLevel(z);
    const tilePixel = {
      xWidth: width / tileXNum,
      yWidth: height / tileYNum
    };
    const pixelBounds = [
      Math.round(x * tilePixel.xWidth),
      Math.round(y * tilePixel.yWidth),
      Math.round((x + 1) * tilePixel.xWidth),
      Math.round((y + 1) * tilePixel.yWidth)
    ];

    const options = {
      window: pixelBounds,
      width: this.tileWidth,
      height: this.tileHeight,
      pool: this._pool,
      samples: this.readSamples,
      resampleMethod: this.options.resampleMethod,
      interleave: false
    };
    let res: TypedArray[];
    try {
      if (this.renderOptions.convertToRGB) {
        res = (await image.readRGB(options)) as TypedArray[];
      } else {
        res = (await image.readRasters(options)) as TypedArray[];
      }
      return {
        data: res,
        width: this.tileWidth,
        height: this.tileHeight
      };
    } catch (error) {
      this._error.raiseEvent(error);
      throw error;
    }
  }

  // /** We need both a `requestImage` method and a `requestImageForCanvas` method.
  //  * Refactor so that `requestImage` calls `requestImageforCanvas` and passes the created canvas.
  //  * In `requestImageForCanvas` we use the canvas provided by leaflet.
  //  * TODO: `requestImageForCanvas` could be moved outside to the COGImageryProbvider class,
  //  * but is difficult because it needs access to private properties **/

  // async requestImage(x: number, y: number, level: number) {
  //   const canvas = document.createElement("canvas");
  //   canvas.width = this.tileWidth;
  //   canvas.height = this.tileHeight;
  //   return await this.requestImageForCanvas(x, y, level, canvas);
  // }

  // MODIFIED FROM SOURCE by Terria: Accept a provided canvas instead of that created in constructor.
  async requestImage(
    x: number,
    y: number,
    z: number
  ): Promise<HTMLCanvasElement> {
    if (!this.ready) {
      throw new DeveloperError(
        "requestImage must not be called before the imagery provider is ready."
      );
    }

    // MODIFIED FROM SOURCE by Terria:
    // TODO: Is it OK to remove this? It messes with the type of ImageryProvider and should be handled alsewhere.
    // if (z < this.minimumLevel || z > this.maximumLevel) return undefined;
    if (this._cacheTime && this._imagesCache[`${x}_${y}_${z}`])
      return this._imagesCache[`${x}_${y}_${z}`].data;

    const { single, multi, convertToRGB } = this.renderOptions;

    try {
      const { width, height, data } = await this._loadTile(x, y, z);
      if (this._destroyed) {
        return undefined;
      }

      // MODIFIED FROM SOURCE by Terria: No longer accept 'ImageData' for result type here
      let result: HTMLImageElement;
      x;
      if (multi || convertToRGB) {
        const opts = {
          width,
          height,
          renderOptions:
            multi ??
            ["r", "g", "b"].reduce(
              (pre, val, index) => ({
                ...pre,
                [val]: {
                  band: index + 1,
                  min: 0,
                  max: 255
                }
              }),
              {}
            ),
          bands: this.bands,
          noData: this.noData,
          resampleMethod: this.options.resampleMethod
        };
        if (!this._workerFarm?.worker) {
          throw new DeveloperError("web workers bootstrap error");
        }

        result = await this._workerFarm.scheduleTask(data, opts);
      } else if (single && this.plot) {
        const { band = 1 } = single;
        this.plot.removeAllDataset();
        this.readSamples.forEach((sample, index) => {
          this.plot.addDataset(`b${sample + 1}`, data[index], width, height);
        });

        if (single.expression) {
          this.plot.render();
        } else {
          this.plot.renderDataset(`b${band}`);
        }

        const image = new Image();
        if (this.plot.canvas instanceof HTMLCanvasElement) {
          image.src = this.plot.canvas.toDataURL();
        } else {
          const imgBitmap = this.plot.canvas.transferToImageBitmap();
          canvas.width = imgBitmap.width;
          canvas.height = imgBitmap.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(imgBitmap, 0, 0);
          image.src = canvas.toDataURL();
        }
        result = image;
      }

      if (result && this._cacheTime) {
        const now = new Date().getTime();
        this._imagesCache[`${x}_${y}_${z}`] = {
          time: now,
          data: result
        };
        for (let key in this._imagesCache) {
          if (now - this._imagesCache[key].time > this._cacheTime) {
            delete this._imagesCache[key];
          }
        }
      }
      return result;
    } catch (e) {
      console.error(e);
      this._error.raiseEvent(e);
      throw e;
    }
  }

  async pickFeatures(
    x: number,
    y: number,
    zoom: number,
    longitude: number,
    latitude: number
  ) {
    // MODIFIED FROM SOURCE by Terria, return empty array instead of undefined
    if (!this.options.enablePickFeatures) return [];
    const z = zoom > this.maximumLevel ? this.maximumLevel : zoom;
    const index = this.cogLevels[z];
    let image = this._images[index];
    if (!image) {
      image = this._images[index] = await this._source.getImage(index);
    }
    const { west, south, north, width: lonWidth } = this.rectangle;
    const width = image.getWidth();
    const height = image.getHeight();
    let lonGap = longitude - west;
    // Handles cases across 180° meridians
    if (longitude < west) {
      lonGap += CMath.TWO_PI;
    }

    const posX = ~~(Math.abs(lonGap / lonWidth) * width);
    const posY = ~~(Math.abs((north - latitude) / (north - south)) * height);

    const options = {
      window: [posX, posY, posX + 1, posY + 1],
      height: 1,
      width: 1,
      pool: this._pool,
      interleave: false
    };
    let res: TypedArray[];
    if (this.renderOptions.convertToRGB) {
      res = (await image.readRGB(options)) as TypedArray[];
    } else {
      res = (await image.readRasters(options)) as TypedArray[];
    }

    const featureInfo = new ImageryLayerFeatureInfo();
    featureInfo.name = `lon:${((longitude / Math.PI) * 180).toFixed(6)}, lat:${(
      (latitude / Math.PI) *
      180
    ).toFixed(6)}`;
    const data = {};
    res?.forEach((item: any, index: number) => {
      data[index] = item?.[0];
    });
    featureInfo.data = data;
    if (res) {
      featureInfo.configureDescriptionFromProperties(data);
    }
    return [featureInfo];
  }

  destroy() {
    this._images = undefined;
    this._imagesCache = undefined;
    this._workerFarm?.destory();
    this._pool?.destroy();
    this.plot?.destroy();
    this._destroyed = true;
  }
}

export default TIFFImageryProvider;
