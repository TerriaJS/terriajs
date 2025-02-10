import Point from "@mapbox/point-geometry";
import bbox from "@turf/bbox";
import booleanIntersects from "@turf/boolean-intersects";
import circle from "@turf/circle";
import { Feature } from "@turf/helpers";
import i18next from "i18next";
import { cloneDeep, isEmpty } from "lodash-es";
import { action, makeObservable } from "mobx";
import {
  LabelRule,
  Labelers,
  LineSymbolizer,
  PaintRule,
  PmtilesSource,
  PreparedTile,
  TileCache,
  View,
  ZxySource,
  paint
} from "protomaps-leaflet";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Credit from "terriajs-cesium/Source/Core/Credit";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import TerriaError from "../../Core/TerriaError";
import isDefined from "../../Core/isDefined";
import {
  FeatureCollectionWithCrs,
  FEATURE_ID_PROP as GEOJSON_FEATURE_ID_PROP
} from "../../ModelMixins/GeojsonMixin";
import { default as TerriaFeature } from "../../Models/Feature/Feature";
import Terria from "../../Models/Terria";
import { ImageryProviderWithGridLayerSupport } from "../Leaflet/ImageryProviderLeafletGridLayer";
import {
  GEOJSON_SOURCE_LAYER_NAME,
  ProtomapsGeojsonSource
} from "../Vector/ProtomapsGeojsonSource";

export const LAYER_NAME_PROP = "__LAYERNAME";

interface Coords {
  z: number;
  x: number;
  y: number;
}

/** Data object can be:
 * - URL of geojson, pmtiles or pbf template (eg `something.com/{z}/{x}/{y}.pbf`)
 * - GeoJsonObject object
 * -Source object (PmtilesSource | ZxySource | ProtomapsGeojsonSource)
 */
export type ProtomapsData = string | FeatureCollectionWithCrs | Source;

interface Options {
  terria: Terria;

  /** This must be defined to support pickedFeatures in share links */
  id?: string;
  data: ProtomapsData;
  minimumZoom?: number;
  maximumZoom?: number;
  maximumNativeZoom?: number;
  rectangle?: Rectangle;
  credit?: Credit | string;
  paintRules: PaintRule[];
  labelRules: LabelRule[];

  /** The name of the property that is a unique ID for features */
  idProperty?: string;

  processPickedFeatures?: (
    features: ImageryLayerFeatureInfo[]
  ) => Promise<ImageryLayerFeatureInfo[]>;
}

type Source = PmtilesSource | ZxySource | ProtomapsGeojsonSource;

/** Tile size in pixels (for canvas and geojson-vt) */
export const PROTOMAPS_DEFAULT_TILE_SIZE = 256;

/** Buffer (in pixels) used when rendering (and generating - through geojson-vt) vector tiles */
export const PROTOMAPS_TILE_BUFFER = 64;

export default class ProtomapsImageryProvider
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
  /** This is only used for Terria feature picking - as we track ImageryProvider feature picking by url (See PickedFeatures/Cesium._attachProviderCoordHooks). This URL is never called.
   * This is set using the `id` property in the constructor options
   */
  readonly url?: string;

  // Set values to please poor cesium types
  readonly defaultNightAlpha = undefined;
  readonly defaultDayAlpha = undefined;
  readonly hasAlphaChannel = true;
  readonly defaultAlpha = undefined as any;
  readonly defaultBrightness = undefined as any;
  readonly defaultContrast = undefined as any;
  readonly defaultGamma = undefined as any;
  readonly defaultHue = undefined as any;
  readonly defaultSaturation = undefined as any;
  readonly defaultMagnificationFilter = undefined as any;
  readonly defaultMinificationFilter = undefined as any;
  readonly proxy = undefined as any;
  readonly readyPromise = Promise.resolve(true);
  readonly tileDiscardPolicy = undefined as any;

  // Protomaps properties
  /** Data object from constructor options (this is transformed into `source`) */
  private readonly data: ProtomapsData;
  private readonly labelers: Labelers;
  private readonly view: View | undefined;
  private readonly processPickedFeatures?: (
    features: ImageryLayerFeatureInfo[]
  ) => Promise<ImageryLayerFeatureInfo[]>;

  readonly maximumNativeZoom: number;
  readonly idProperty: string;
  readonly source: Source;
  readonly paintRules: PaintRule[];
  readonly labelRules: LabelRule[];

  constructor(options: Options) {
    makeObservable(this);
    this.data = options.data;
    this.terria = options.terria;
    this.tilingScheme = new WebMercatorTilingScheme();

    this.tileWidth = PROTOMAPS_DEFAULT_TILE_SIZE;
    this.tileHeight = PROTOMAPS_DEFAULT_TILE_SIZE;

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
    this.url = options.id;

    this.ready = true;

    this.credit =
      typeof options.credit === "string"
        ? new Credit(options.credit)
        : (options.credit as Credit);

    // Protomaps
    this.paintRules = options.paintRules;
    this.labelRules = options.labelRules;
    this.idProperty = options.idProperty ?? "FID";

    // Generate protomaps source based on this.data
    // - URL of pmtiles, geojson or pbf files
    if (typeof this.data === "string") {
      if (this.data.endsWith(".pmtiles")) {
        this.source = new PmtilesSource(this.data, false);
        const cache = new TileCache(this.source, 1024);
        this.view = new View(cache, this.maximumNativeZoom, 2);
      } else if (
        this.data.endsWith(".json") ||
        this.data.endsWith(".geojson")
      ) {
        this.source = new ProtomapsGeojsonSource(this.data);
      } else {
        this.source = new ZxySource(this.data, false);
        const cache = new TileCache(this.source, 1024);
        this.view = new View(cache, this.maximumNativeZoom, 2);
      }
    }
    // Source object
    else if (
      this.data instanceof ProtomapsGeojsonSource ||
      this.data instanceof PmtilesSource ||
      this.data instanceof ZxySource
    ) {
      this.source = this.data;
    }
    // - GeoJsonObject object
    else {
      this.source = new ProtomapsGeojsonSource(this.data);
    }

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

    this.processPickedFeatures = options.processPickedFeatures;
  }

  getTileCredits(_x: number, _y: number, _level: number): Credit[] {
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

    // Get PreparedTile from source or view
    // Here we need a little bit of extra logic for the ProtomapsGeojsonSource
    if (this.source instanceof ProtomapsGeojsonSource) {
      const data = await this.source.get(coords, this.tileHeight);

      tile = {
        data: data,
        z: coords.z,
        dataTile: coords,
        scale: 1,
        origin: new Point(coords.x * 256, coords.y * 256),
        dim: this.tileWidth
      };
    } else if (this.view) {
      tile = await this.view.getDisplayTile(coords);
    }

    if (!tile) return;

    const tileMap = new Map<string, PreparedTile[]>().set("", [tile]);

    this.labelers.add(coords.z, tileMap);

    const labelData = this.labelers.getIndex(tile.z);

    const bbox = {
      minX: 256 * coords.x - PROTOMAPS_TILE_BUFFER,
      minY: 256 * coords.y - PROTOMAPS_TILE_BUFFER,
      maxX: 256 * (coords.x + 1) + PROTOMAPS_TILE_BUFFER,
      maxY: 256 * (coords.y + 1) + PROTOMAPS_TILE_BUFFER
    };
    const origin = new Point(256 * coords.x, 256 * coords.y);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(this.tileWidth / 256, 0, 0, this.tileHeight / 256, 0, 0);
    ctx.clearRect(0, 0, 256, 256);

    if (labelData)
      paint(
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
    const featureInfos: ImageryLayerFeatureInfo[] = [];
    // If view is set - this means we are using actual vector tiles (that is not GeoJson object)
    // So we use this.view.queryFeatures
    if (this.view) {
      try {
        // Make sure tile is loaded, this will use cache if tile is already loaded
        await this.view.getDisplayTile({ x, y, z: level });
      } catch (e) {
        TerriaError.from(e, "Error while picking features").log();
        return [];
      }

      // Get list of vector tile layers which are rendered
      const renderedLayers = [...this.paintRules, ...this.labelRules].map(
        (r) => r.dataLayer
      );

      this.view
        .queryFeatures(
          CesiumMath.toDegrees(longitude),
          CesiumMath.toDegrees(latitude),
          level,
          1
        )
        .forEach((f) => {
          // Only create FeatureInfo for visible features with properties
          if (
            !f.feature.props ||
            isEmpty(f.feature.props) ||
            !renderedLayers.includes(f.layerName)
          )
            return;

          const featureInfo = new ImageryLayerFeatureInfo();

          // Add Layer name property
          featureInfo.properties = Object.assign(
            { [LAYER_NAME_PROP]: f.layerName },
            f.feature.props ?? {}
          );
          featureInfo.position = new Cartographic(longitude, latitude);

          featureInfo.configureDescriptionFromProperties(f.feature.props);
          featureInfo.configureNameFromProperties(f.feature.props);

          featureInfos.push(featureInfo);
        });

      // No view is set and we have geoJSON object
      // So we pick features manually
    } else if (
      this.source instanceof ProtomapsGeojsonSource &&
      this.source.geojsonObject
    ) {
      // Get rough meters per pixel (at equator) for given zoom level
      const zoomMeters = 156543 / Math.pow(2, level);
      // Create circle with 10 pixel radius to pick features
      const buffer = circle(
        [CesiumMath.toDegrees(longitude), CesiumMath.toDegrees(latitude)],
        10 * zoomMeters,
        {
          steps: 10,
          units: "meters"
        }
      );

      // Create wrappedBuffer with only positive coordinates - this is needed for features which overlap antemeridian
      const wrappedBuffer = cloneDeep(buffer);
      wrappedBuffer.geometry.coordinates.forEach((ring) =>
        ring.forEach((point) => {
          point[0] = point[0] < 0 ? point[0] + 360 : point[0];
        })
      );

      const bufferBbox = bbox(buffer);

      // Get array of all features
      const geojsonFeatures: Feature[] = this.source.geojsonObject.features;

      const pickedFeatures: Feature[] = [];

      for (let index = 0; index < geojsonFeatures.length; index++) {
        const feature = geojsonFeatures[index];
        if (!feature.bbox) {
          feature.bbox = bbox(feature);
        }

        // Filter by bounding box and then intersection with buffer (to minimize calls to booleanIntersects)
        if (
          Math.max(
            feature.bbox[0],
            // Wrap buffer bbox if necessary
            feature.bbox[0] > 180 ? bufferBbox[0] + 360 : bufferBbox[0]
          ) <=
            Math.min(
              feature.bbox[2],
              // Wrap buffer bbox if necessary
              feature.bbox[2] > 180 ? bufferBbox[2] + 360 : bufferBbox[2]
            ) &&
          Math.max(feature.bbox[1], bufferBbox[1]) <=
            Math.min(feature.bbox[3], bufferBbox[3])
        ) {
          // If we have longitudes greater than 180 - used wrappedBuffer
          if (feature.bbox[0] > 180 || feature.bbox[2] > 180) {
            if (booleanIntersects(feature, wrappedBuffer))
              pickedFeatures.push(feature);
          } else if (booleanIntersects(feature, buffer))
            pickedFeatures.push(feature);
        }
      }

      // Convert pickedFeatures to ImageryLayerFeatureInfos
      pickedFeatures.forEach((f) => {
        const featureInfo = new ImageryLayerFeatureInfo();

        featureInfo.data = f;
        featureInfo.properties = f.properties;

        if (
          f.geometry.type === "Point" &&
          typeof f.geometry.coordinates[0] === "number" &&
          typeof f.geometry.coordinates[1] === "number"
        ) {
          featureInfo.position = Cartographic.fromDegrees(
            f.geometry.coordinates[0],
            f.geometry.coordinates[1]
          );
        }

        featureInfo.configureDescriptionFromProperties(f.properties);
        featureInfo.configureNameFromProperties(f.properties);

        featureInfos.push(featureInfo);
      });
    }

    if (this.processPickedFeatures) {
      return await this.processPickedFeatures(featureInfos);
    }

    return featureInfos;
  }

  private clone(options?: Partial<Options>) {
    let data = options?.data;

    // To clone data/source, we want to minimize any unnecessary processing
    if (!data) {
      // These can be passed straight in without processing
      if (typeof this.data === "string" || this.data instanceof PmtilesSource) {
        data = this.data;
        // We can't just clone ZxySource objects, so just pass in URL
      } else if (this.data instanceof ZxySource) {
        data = this.data.url;
        // If ProtomapsGeojsonSource was passed into data, create new one and copy over tileIndex
      } else if (this.data instanceof ProtomapsGeojsonSource) {
        if (this.data.geojsonObject) {
          data = new ProtomapsGeojsonSource(this.data.geojsonObject);
          // Copy over tileIndex so it doesn't have to be re-processed
          data.tileIndex = this.data.tileIndex;
        }
        // If GeoJson FeatureCollection was passed into data (this.data), and the source is ProtomapsGeojsonSource
        // create a ProtomapsGeojsonSource with the GeoJson and copy over tileIndex
      } else if (this.source instanceof ProtomapsGeojsonSource) {
        data = new ProtomapsGeojsonSource(this.data);
        // Copy over tileIndex so it doesn't have to be re-processed
        data.tileIndex = this.source.tileIndex;
      }
    }

    if (!data) return;

    return new ProtomapsImageryProvider({
      terria: options?.terria ?? this.terria,
      id: options?.id ?? this.url,
      data,
      minimumZoom: options?.minimumZoom ?? this.minimumLevel,
      maximumZoom: options?.maximumZoom ?? this.maximumLevel,
      maximumNativeZoom: options?.maximumNativeZoom ?? this.maximumNativeZoom,
      rectangle: options?.rectangle ?? this.rectangle,
      credit: options?.credit ?? this.credit,
      paintRules: options?.paintRules ?? this.paintRules,
      labelRules: options?.labelRules ?? this.labelRules,
      processPickedFeatures:
        options?.processPickedFeatures ?? this.processPickedFeatures
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

    if (this.source instanceof ProtomapsGeojsonSource) {
      featureProp = GEOJSON_FEATURE_ID_PROP;
      layerName = GEOJSON_SOURCE_LAYER_NAME;
    } else {
      featureProp = this.idProperty;
      layerName = feature.properties?.[LAYER_NAME_PROP]?.getValue();
    }

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
            filter: (_zoom, feature) =>
              feature.props?.[featureProp!] === featureId
          }
        ]
      });
    }
    return;
  }
}
