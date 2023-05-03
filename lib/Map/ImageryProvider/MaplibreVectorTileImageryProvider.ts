import Point from "@mapbox/point-geometry";
import bbox from "@turf/bbox";
import booleanIntersects from "@turf/boolean-intersects";
import circle from "@turf/circle";
import { Feature } from "@turf/helpers";
import i18next from "i18next";
import { cloneDeep } from "lodash-es";
import { action, observable, runInAction } from "mobx";

// what do we keep from this?
import {
  Bbox,
  Feature as ProtomapsFeature,
  GeomType,
  Labelers,
  LabelRule,
  LineSymbolizer,
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

import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Credit from "terriajs-cesium/Source/Core/Credit";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import filterOutUndefined from "../../Core/filterOutUndefined";
import isDefined from "../../Core/isDefined";
import TerriaError from "../../Core/TerriaError";
import { default as TerriaFeature } from "../../Models/Feature/Feature";
import Terria from "../../Models/Terria";
import { ImageryProviderWithGridLayerSupport } from "../Leaflet/ImageryProviderLeafletGridLayer";
import ProtomapsImageryProvider from "./ProtomapsImageryProvider";

interface Coords {
  z: number;
  x: number;
  y: number;
}

//its a URL
export type MaplibreData = string;

interface Options {
  terria: Terria;
  tileWidth?: number;
  tileHeight?: number;

  data: MaplibreData;
  minimumZoom?: number;
  maximumZoom?: number;
  maximumNativeZoom?: number;
  rectangle?: Rectangle;
  credit?: Credit | string;
  // need gemoetry and labelling rules
  paintRules: PaintRule[];
  labelRules: LabelRule[];
  /** The name of the property that is a unique ID for features */
  idProperty?: string;
}

type Source = ZxySource;
const LAYER_NAME_PROP = "__LAYERNAME";

export default class MaplibreVectorTileImageryProvider
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

  // Set values to please poor cesium types
  readonly defaultNightAlpha = undefined;
  readonly defaultDayAlpha = undefined;
  readonly hasAlphaChannel = true;
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

  // Maplibre properties
  /** Data object from constructor options (this is transformed into `source`) */
  private readonly data: MaplibreData;
  readonly maximumNativeZoom: number;
  private readonly labelers: Labelers;
  private readonly view!: View;
  readonly idProperty: string;

  readonly source: string;

  // Maplibre style properties need to be sourced from the style object
  readonly paintRules: PaintRule[] = [];
  readonly labelRules!: LabelRule[];

  constructor(options: Options) {
    this.data = options.data;
    this.terria = options.terria;
    this.tilingScheme = new WebMercatorTilingScheme();

    this.tileWidth = options.tileWidth || 512;
    this.tileHeight = options.tileWidth || 512;

    this.minimumLevel = defaultValue(options.minimumZoom, 0);
    this.maximumLevel = defaultValue(options.maximumZoom, 24);
    this.maximumNativeZoom = defaultValue(
      options.maximumNativeZoom,
      this.maximumLevel
    );

    this.rectangle = isDefined(options.rectangle)
      ? Rectangle.intersection(
          options.rectangle,
          this.tilingScheme.rectangle
        ) || this.tilingScheme.rectangle
      : this.tilingScheme.rectangle;

    // Check the number of tiles at the minimum level.  If it's more than four,
    // throw an exception, because starting at the higher minimum
    // level will cause too many tiles to be downloaded and rendered.
    const swTile = this.tilingScheme.positionToTileXY(
      Rectangle.southwest(this.rectangle),
      this.minimumLevel
    );
    const neTile = this.tilingScheme.positionToTileXY(
      Rectangle.northeast(this.rectangle),
      this.minimumLevel
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

    this.errorEvent = new CesiumEvent();

    this.ready = true;

    this.credit =
      typeof options.credit == "string"
        ? new Credit(options.credit)
        : (options.credit as Credit);

    // Protomaps
    // this.paintRules = options.paintRules;
    // this.labelRules = options.labelRules;
    this.idProperty = options.idProperty ?? "FID";

    this.source = this.data;

    const labelersCanvasContext = document
      .createElement("canvas")
      .getContext("2d");

    if (!labelersCanvasContext)
      throw TerriaError.from("Failed to create labelersCanvasContext");

    this.labelers = new Labelers(
      labelersCanvasContext,
      this.labelRules,
      16,
      () => undefined
    );
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
    let tile: PreparedTile | undefined = undefined;

    tile = await this.view.getDisplayTile(coords);

    if (!tile) return;

    const tileMap = new Map<string, PreparedTile[]>().set("", [tile]);

    this.labelers.add(coords.z, tileMap);

    let labelData = this.labelers.getIndex(tile.z);

    const bbox = {
      minX: 256 * coords.x,
      minY: 256 * coords.y,
      maxX: 256 * (coords.x + 1),
      maxY: 256 * (coords.y + 1)
    };
    const origin = new Point(256 * coords.x, 256 * coords.y);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(this.tileWidth / 256, 0, 0, this.tileHeight / 256, 0, 0);
    ctx.clearRect(0, 0, 256, 256);

    // need to implement the painter function for Maplibre

    if (labelData)
      painter(
        ctx,
        coords.z,
        tileMap,
        labelData,
        this.paintRules,
        bbox,
        origin,
        false,
        ""
      );
  }

  async pickFeatures(
    x: number,
    y: number,
    level: number,
    longitude: number,
    latitude: number
  ): Promise<ImageryLayerFeatureInfo[]> {
    // If view is set - this means we are using actual vector tiles (that is not GeoJson object)
    // So we use this.view.queryFeatures
    if (this.view) {
      // Get list of vector tile layers which are rendered
      const renderedLayers = [...this.paintRules, ...this.labelRules].map(
        (r) => r.dataLayer
      );

      return filterOutUndefined(
        this.view
          .queryFeatures(
            CesiumMath.toDegrees(longitude),
            CesiumMath.toDegrees(latitude),
            level
          )
          .map((f) => {
            // Only create FeatureInfo for visible features with properties
            if (
              !f.feature.props ||
              f.feature.props === {} ||
              !renderedLayers.includes(f.layerName)
            )
              return;

            const featureInfo = new ImageryLayerFeatureInfo();

            // Add Layer name property
            // featureInfo.properties = Object.assign(
            //   { [LAYER_NAME_PROP]: f.layerName },
            //   f.feature.props ?? {}
            // );
            featureInfo.position = new Cartographic(longitude, latitude);

            featureInfo.configureDescriptionFromProperties(f.feature.props);
            featureInfo.configureNameFromProperties(f.feature.props);

            return featureInfo;
          })
      );
      // No view is set and we have geoJSON object
      // So we pick features manually
    }
    return [];
  }

  private clone(options?: Partial<Options>) {
    let data = options?.data;

    // To clone data/source, we want to minimize any unnecessary processing
    if (!data) {
      // These can be passed straight in without processing
      if (typeof this.data === "string") {
        data = this.data;
        // We can't just clone ZxySource objects, so just pass in URL
      }
    }

    if (!data) return;

    return new ProtomapsImageryProvider({
      terria: options?.terria ?? this.terria,
      data,
      minimumZoom: options?.minimumZoom ?? this.minimumLevel,
      maximumZoom: options?.maximumZoom ?? this.maximumLevel,
      maximumNativeZoom: options?.maximumNativeZoom ?? this.maximumNativeZoom,
      rectangle: options?.rectangle ?? this.rectangle,
      credit: options?.credit ?? this.credit,
      paintRules: options?.paintRules ?? this.paintRules,
      labelRules: options?.labelRules ?? this.labelRules
    });
  }

  /** Clones ImageryProvider, and sets paintRules to highlight picked features */
  @action
  createHighlightImageryProvider(
    feature: TerriaFeature
  ): ProtomapsImageryProvider | undefined {
    // Depending on this.source, feature IDs might be FID (for actual vector tile sources) or they will use GEOJSON_FEATURE_ID_PROP
    let featureProp: string | undefined;
    // Similarly, feature layer name will be LAYER_NAME_PROP for mvt, whereas GeoJSON features will use the constant GEOJSON_SOURCE_LAYER_NAME
    let layerName: string | undefined;

    featureProp = this.idProperty;
    layerName = feature.properties?.[LAYER_NAME_PROP]?.getValue();

    const featureId = feature.properties?.[featureProp]?.getValue();

    if (isDefined(featureId) && isDefined(layerName)) {
      return this.clone({
        labelRules: [],
        paintRules: [
          {
            dataLayer: layerName,
            symbolizer: new LineSymbolizer({
              color: this.terria.baseMapContrastColor,
              width: 4
            }),
            minzoom: 0,
            maxzoom: Infinity,
            filter: (zoom, feature) =>
              feature.props?.[featureProp!] === featureId
          }
        ]
      });
    }
    return;
  }
}
