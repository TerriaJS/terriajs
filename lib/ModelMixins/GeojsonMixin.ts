import bbox from "@turf/bbox";
import {
  Feature,
  feature,
  FeatureCollection,
  featureCollection,
  Geometries,
  Geometry,
  GeometryCollection,
  Point,
  Properties
} from "@turf/helpers";
import i18next from "i18next";
import {
  action,
  computed,
  IReactionDisposer,
  observable,
  onBecomeObserved,
  onBecomeUnobserved,
  reaction,
  runInAction,
  toJS
} from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import clone from "terriajs-cesium/Source/Core/clone";
import Color from "terriajs-cesium/Source/Core/Color";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import Iso8601 from "terriajs-cesium/Source/Core/Iso8601";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import PolygonHierarchy from "terriajs-cesium/Source/Core/PolygonHierarchy";
import TimeInterval from "terriajs-cesium/Source/Core/TimeInterval";
import TimeIntervalCollection from "terriajs-cesium/Source/Core/TimeIntervalCollection";
import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import ColorMaterialProperty from "terriajs-cesium/Source/DataSources/ColorMaterialProperty";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import CzmlDataSource from "terriajs-cesium/Source/DataSources/CzmlDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import EntityCollection from "terriajs-cesium/Source/DataSources/EntityCollection";
import GeoJsonDataSource from "terriajs-cesium/Source/DataSources/GeoJsonDataSource";
import PointGraphics from "terriajs-cesium/Source/DataSources/PointGraphics";
import PolygonGraphics from "terriajs-cesium/Source/DataSources/PolygonGraphics";
import PolylineGraphics from "terriajs-cesium/Source/DataSources/PolylineGraphics";
import Property from "terriajs-cesium/Source/DataSources/Property";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import {
  CircleSymbolizer,
  Feature as ProtomapsFeature,
  GeomType,
  LineSymbolizer,
  PolygonSymbolizer
} from "terriajs-protomaps";
import Constructor from "../Core/Constructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import formatPropertyValue from "../Core/formatPropertyValue";
import hashFromString from "../Core/hashFromString";
import isDefined from "../Core/isDefined";
import { isJsonObject } from "../Core/Json";
import { isJson } from "../Core/loadBlob";
import makeRealPromise from "../Core/makeRealPromise";
import StandardCssColors from "../Core/StandardCssColors";
import TerriaError, {
  networkRequestError,
  TerriaErrorSeverity
} from "../Core/TerriaError";
import ProtomapsImageryProvider, {
  GeojsonSource,
  GEOJSON_SOURCE_LAYER_NAME,
  ProtomapsData
} from "../Map/ProtomapsImageryProvider";
import Reproject from "../Map/Reproject";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import proxyCatalogItemUrl from "../Models/Catalog/proxyCatalogItemUrl";
import CommonStrata from "../Models/Definition/CommonStrata";
import createStratumInstance from "../Models/Definition/createStratumInstance";
import LoadableStratum from "../Models/Definition/LoadableStratum";
import Model, { BaseModel } from "../Models/Definition/Model";
import StratumOrder from "../Models/Definition/StratumOrder";
import TableAutomaticStylesStratum from "../Table/TableAutomaticStylesStratum";
import { GeoJsonTraits } from "../Traits/TraitsClasses/GeoJsonTraits";
import LegendTraits from "../Traits/TraitsClasses/LegendTraits";
import { RectangleTraits } from "../Traits/TraitsClasses/MappableTraits";
import { DiscreteTimeAsJS } from "./DiscretelyTimeVaryingMixin";
import { ExportData } from "./ExportableMixin";
import TableMixin from "./TableMixin";
import FeatureInfoMixin from "./FeatureInfoMixin";
import { Cartesian2 } from "terriajs-cesium";
import TerriaFeature from "./../Models/Feature";

export const FEATURE_ID_PROP = "_id_";

const SIMPLE_STYLE_KEYS = [
  "marker-size",
  "marker-color",
  "marker-symbol",
  "marker-opacity",
  "marker-url",
  "stroke",
  "stroke-opacity",
  "stroke-width",
  "marker-stroke-width",
  "polyline-stroke-width",
  "polygon-stroke-width",
  "fill",
  "fill-opacity"
];

export type GeoJsonCrs =
  | {
      type: "name";
      properties: {
        name: string;
      };
    }
  | {
      type: "EPSG";
      properties: {
        code: string;
      };
    };

export type FeatureCollectionWithCrs<
  G = Geometry | GeometryCollection,
  P = Properties
> = FeatureCollection<G, P> & {
  crs?: GeoJsonCrs;
};

class GeoJsonStratum extends LoadableStratum(GeoJsonTraits) {
  static stratumName = "geojson";
  constructor(private readonly _item: GeoJsonMixin.Instance) {
    super();
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new GeoJsonStratum(newModel as GeoJsonMixin.Instance) as this;
  }

  static load(item: GeoJsonMixin.Instance) {
    return new GeoJsonStratum(item);
  }

  @computed
  get rectangle() {
    if (this._item._readyData) {
      try {
        const geojsonBbox = bbox(this._item._readyData);
        return createStratumInstance(RectangleTraits, {
          west: geojsonBbox[0],
          south: geojsonBbox[1],
          east: geojsonBbox[2],
          north: geojsonBbox[3]
        });
      } catch (e) {
        TerriaError.from(e, "Failed to create `rectangle` for GeoJSON").log();
      }
    }
  }

  get opacity() {
    return 1;
  }

  @computed
  get disableOpacityControl() {
    return !this._item._imageryProvider;
  }

  get showDisableStyleOption() {
    return true;
  }
}

StratumOrder.addLoadStratum(GeoJsonStratum.stratumName);

function GeoJsonMixin<T extends Constructor<Model<GeoJsonTraits>>>(Base: T) {
  abstract class GeoJsonMixin extends TableMixin(
    FeatureInfoMixin(UrlMixin(CatalogMemberMixin(Base)))
  ) {
    @observable
    private _dataSource: CzmlDataSource | GeoJsonDataSource | undefined;

    /** This is only public so that it can be accessed in GeoJsonStratum, treat it as private */
    @observable
    _imageryProvider: ProtomapsImageryProvider | undefined;

    private tableStyleReactionDisposer: IReactionDisposer | undefined;

    /** Geojson FeatureCollection in WGS84 */
    @observable.ref _readyData?: FeatureCollectionWithCrs;

    constructor(...args: any[]) {
      super(...args);
      // Add GeoJsonStratum
      if (this.strata.get(GeoJsonStratum.stratumName) === undefined) {
        runInAction(() => {
          this.strata.set(
            GeoJsonStratum.stratumName,
            GeoJsonStratum.load(this)
          );
        });
      }

      // Add TableAutomaticStylesStratum
      if (
        this.strata.get(TableAutomaticStylesStratum.stratumName) === undefined
      ) {
        this.strata.set(
          TableAutomaticStylesStratum.stratumName,
          new TableAutomaticStylesStratum(this)
        );
      }

      // Setup table style reactions
      // We should only update geojson table styling when our map items have consumers
      onBecomeObserved(
        this,
        "mapItems",
        this.startTableStyleReaction.bind(this)
      );
      onBecomeUnobserved(
        this,
        "mapItems",
        this.stopTableStyleReaction.bind(this)
      );
    }

    private startTableStyleReaction() {
      if (!this.tableStyleReactionDisposer) {
        // Update protomaps imagery provider if activeTableStyle changes
        this.tableStyleReactionDisposer = reaction(
          () => [
            this.useMvt,
            this.readyData,
            this.currentTimeAsJulianDate,
            this.activeTableStyle.timeIntervals,
            this.activeTableStyle,
            this.activeTableStyle.colorMap,
            this.stylesWithDefaults
          ],
          () => {
            if (this._imageryProvider && this.readyData && this.useMvt) {
              runInAction(() => {
                this._imageryProvider = this.createProtomapsImageryProvider(
                  this.readyData!
                );
              });
            }
          },
          // Fire immediately, just in case reactions change while not observing mapItems
          { fireImmediately: true }
        );
      }
    }

    private stopTableStyleReaction() {
      if (this.tableStyleReactionDisposer) {
        this.tableStyleReactionDisposer();
        this.tableStyleReactionDisposer = undefined;
      }
    }

    get isGeoJson() {
      return true;
    }

    @computed get name() {
      if (CatalogMemberMixin.isMixedInto(this.sourceReference)) {
        return super.name || this.sourceReference.name;
      }
      return super.name;
    }

    @computed get cacheDuration(): string {
      if (isDefined(super.cacheDuration)) {
        return super.cacheDuration;
      }
      return "1d";
    }

    /**
     * Returns the final raw data after all transformations are applied.
     * (Geojson FeatureCollection in WGS84)
     */
    @computed get readyData() {
      return this._readyData;
    }

    @computed
    get _canExportData() {
      return isDefined(this.readyData);
    }

    protected async _exportData(): Promise<ExportData | undefined> {
      if (isDefined(this.readyData)) {
        let name = this.name || this.uniqueId || "data.geojson";
        if (!isJson(name)) {
          name = `${name}.geojson`;
        }
        return {
          name,
          file: new Blob([JSON.stringify(this.readyData)])
        };
      }

      throw new TerriaError({
        sender: this,
        message: "No data available to download."
      });
    }

    @computed
    get disableSplitter() {
      return !this._imageryProvider;
    }

    /** Special case for legends.
     * Because TableMixin does not have LegendTraits, but GeoJsonMixin does, we need to check to see if traits have been defined.
     * If so, they will override TableMixin legends
     */
    @computed
    get legends(): Model<LegendTraits>[] {
      const legendTraits = this.traits.legends.getValue(this) as
        | Model<LegendTraits>
        | undefined;
      if (Array.isArray(legendTraits) && legendTraits.length > 0) {
        return legendTraits;
      }

      return super.legends;
    }

    @computed get mapItems() {
      if (
        this.isLoadingMapItems ||
        (!isDefined(this._dataSource) && !isDefined(this._imageryProvider))
      ) {
        return [];
      }
      this._dataSource ? (this._dataSource.show = this.show) : null;
      return filterOutUndefined([
        this._dataSource,
        this._imageryProvider
          ? {
              imageryProvider: this._imageryProvider,
              show: this.show,
              alpha: this.opacity,
              clippingRectangle: undefined
            }
          : undefined
      ]);
    }

    /**
     * {@link FeatureInfoMixin.buildFeatureFromPickResult}
     */
    buildFeatureFromPickResult(
      _screenPosition: Cartesian2 | undefined,
      pickResult: any
    ): TerriaFeature | undefined {
      if (pickResult instanceof Entity) {
        return TerriaFeature.fromEntityCollectionOrEntity(pickResult);
      } else if (isDefined(pickResult?.id)) {
        return TerriaFeature.fromEntityCollectionOrEntity(pickResult.id);
      }
    }

    /** Only use MapboxVectorTiles (through geojson-vt and protomaps.js) if enabled and not using unsupported traits
     * For more info see GeoJsonMixin.forceLoadMapItems
     */
    @computed
    get useMvt() {
      return (
        !this.forceCesiumPrimitives &&
        !isDefined(this.czmlTemplate) &&
        !isDefined(this.stylesWithDefaults.markerSymbol) &&
        !isDefined(this.stylesWithDefaults.markerUrl) &&
        !isDefined(this.timeProperty) &&
        !isDefined(this.heightProperty) &&
        (!isDefined(this.perPropertyStyles) ||
          this.perPropertyStyles.length === 0)
      );
    }

    /** Remove chart items from TableMixin.chartItems */
    @computed get chartItems() {
      return [];
    }

    /**
     * Forces load of the geojson data. This method does _not_ need to consider
     * whether the geojson is already loaded.
     *
     * It is guaranteed that `loadMetadata` has finished before this is called.
     *
     * You **can not** make changes to observables until **after** an asynchronous call {@see AsyncLoader}.
     *
     * Errors can be thrown here.
     */
    protected abstract forceLoadGeojsonData(): Promise<
      FeatureCollectionWithCrs | undefined
    >;

    /** GeojsonMixin has 3 rendering modes:
     * - CZML:
     *    - if `czmlTemplate` is defined (see `GeoJsonTraits.czmlTemplate`)
     * - Mapbox vector tiles (through geojson-vt and protomaps.js)
     *    - Will be used by default, if not using unsupported traits (see below)
     * - Cesium primitives if:
     *    - `GeoJsonTraits.forceCesiumPrimitives = true`
     *    - Using `timeProperty` or `heightProperty` or `perPropertyStyles` or simple-style `marker-symbol`
     *    - More than 50% of GeoJSON features have simply-style properties
     */
    protected async forceLoadMapItems(): Promise<void> {
      let useMvt = this.useMvt;
      const czmlTemplate = this.czmlTemplate;

      let geoJson: FeatureCollectionWithCrs | undefined;

      try {
        geoJson = await this.forceLoadGeojsonData();
        if (geoJson === undefined) {
          return;
        }

        const geoJsonWgs84 = await reprojectToGeographic(
          geoJson,
          this.terria.configParameters.proj4ServiceBaseUrl
        );

        // Add feature index to FEATURE_ID_PROP ("_id_") feature property
        // This is used to refer to each feature in TableMixin (as row ID)

        // Also check for how many features have simply-style properties
        let numFeaturesWithSimpleStyle = 0;

        for (let i = 0; i < geoJsonWgs84.features.length; i++) {
          if (!geoJsonWgs84.features[i].properties) {
            geoJsonWgs84.features[i].properties = {};
          }
          const properties = geoJsonWgs84.features[i].properties!;
          properties[FEATURE_ID_PROP] = i;

          if (useMvt && SIMPLE_STYLE_KEYS.find(key => properties[key])) {
            numFeaturesWithSimpleStyle++;
          }
        }

        // If more than 50% of features have simple style properties - disable table styling
        if (numFeaturesWithSimpleStyle / geoJsonWgs84.features.length >= 0.5) {
          runInAction(() => {
            this.setTrait(
              CommonStrata.underride,
              "forceCesiumPrimitives",
              true
            );
            useMvt = this.useMvt;
          });
        }
        runInAction(() => {
          this._readyData = geoJsonWgs84;
        });

        if (isDefined(czmlTemplate)) {
          const dataSource = await this.loadCzmlDataSource(geoJsonWgs84);
          runInAction(() => {
            this._dataSource = dataSource;
            this._imageryProvider = undefined;
          });
        } else if (useMvt) {
          runInAction(() => {
            this._imageryProvider = this.createProtomapsImageryProvider(
              geoJsonWgs84
            );
            this._dataSource = undefined;
          });
        } else {
          const dataSource = await this.loadGeoJsonDataSource(geoJsonWgs84);
          runInAction(() => {
            this._dataSource = dataSource;
            this._imageryProvider = undefined;
          });
        }
      } catch (e) {
        throw networkRequestError(
          TerriaError.from(e, {
            title: i18next.t("models.geoJson.errorLoadingTitle"),
            message: i18next.t("models.geoJson.errorParsingMessage")
          })
        );
      }
    }

    @action
    private addPerPropertyStyleToGeoJson(fc: FeatureCollectionWithCrs) {
      for (let i = 0; i < fc.features.length; i++) {
        const featureProperties = fc.features[i].properties;
        if (featureProperties === null) {
          return;
        }
        const featurePropertiesEntires = Object.entries(featureProperties);

        const matchedStyles = this.perPropertyStyles.filter(style => {
          const stylePropertiesEntries = Object.entries(style.properties ?? {});

          // For every key-value pair in the style, is there an identical one in the feature's properties?
          return stylePropertiesEntries.every(
            ([styleKey, styleValue]) =>
              featurePropertiesEntires.find(([featKey, featValue]) => {
                if (typeof styleValue === "string" && !style.caseSensitive) {
                  featKey === styleKey &&
                    (typeof featValue === "string"
                      ? featValue
                      : featValue.toString()
                    ).toLowerCase() === styleValue.toLowerCase();
                }
                return featKey === styleKey && featValue === styleValue;
              }) !== undefined
          );
        });

        if (matchedStyles !== undefined) {
          for (let matched of matchedStyles) {
            for (let trait of Object.keys(matched.style.traits)) {
              featureProperties[trait] =
                // @ts-ignore - TS can't tell that `trait` is of the correct index type for style
                matched.style[trait] ?? featureProperties[trait];
            }
          }
        }
      }
    }

    @action
    private createProtomapsImageryProvider(geoJson: FeatureCollectionWithCrs) {
      let currentTimeRows: number[] | undefined;

      // If time varying, get row indices which match
      // This is used to filter feature[FEATURE_ID_PROP]
      if (
        this.currentTimeAsJulianDate &&
        this.activeTableStyle.timeIntervals &&
        this.activeTableStyle.moreThanOneTimeInterval
      ) {
        currentTimeRows = this.activeTableStyle.timeIntervals.reduce<number[]>(
          (rows, timeInterval, index) => {
            if (
              timeInterval &&
              TimeInterval.contains(timeInterval, this.currentTimeAsJulianDate!)
            ) {
              rows.push(index);
            }
            return rows;
          },
          []
        );
      }

      const nullColor = this.activeTableStyle.tableColorMap.nullColor.toCssColorString();
      const rows = this.activeTableStyle.colorColumn?.valuesForType;
      const colorMap = this.activeTableStyle.colorMap;

      // Style function
      // If disableTableStyle is true - we just return defaultColor
      // Otherwise, use activeTableStyle colorMap.mapValueToColor
      let getValue = (defaultColor?: string) =>
        this.disableTableStyle
          ? defaultColor
          : (z: number, f?: ProtomapsFeature) => {
              const rowId = f?.props[FEATURE_ID_PROP];
              if (typeof rowId === "number") {
                const col = colorMap
                  .mapValueToColor(rows?.[rowId])
                  ?.toCssColorString();

                if (col) return col;
              }

              // If no color found, use defaultColor or nullColor
              return defaultColor ?? nullColor;
            };

      let protomapsData: ProtomapsData = geoJson;

      // Are we creating a protomaps imagery provider with the same geojson data (readyData)?
      // If so we can copy GeojsonSource over to save running geojson-vt again
      if (
        this._imageryProvider instanceof ProtomapsImageryProvider &&
        this._imageryProvider.source instanceof GeojsonSource &&
        this._imageryProvider.source.geojsonObject === this.readyData
      ) {
        protomapsData = this._imageryProvider.source;
      }

      return new ProtomapsImageryProvider({
        terria: this.terria,
        data: protomapsData,
        // Create paintRules from `stylesWithDefaults` (which applies defaults ontop of StyleTraits)
        paintRules: filterOutUndefined([
          // Polygon fill
          {
            dataLayer: GEOJSON_SOURCE_LAYER_NAME,
            symbolizer: new PolygonSymbolizer({
              fill: getValue(this.stylesWithDefaults.fill.toCssColorString())
            }),
            minzoom: 0,
            maxzoom: Infinity,
            filter: (zoom, feature) => {
              return (
                feature?.geomType === GeomType.Polygon &&
                (!currentTimeRows ||
                  currentTimeRows.includes(feature?.props[FEATURE_ID_PROP]))
              );
            }
          },
          // Polygon stroke (hide if 0)
          this.stylesWithDefaults.polygonStrokeWidth !== 0
            ? {
                dataLayer: GEOJSON_SOURCE_LAYER_NAME,
                symbolizer: new LineSymbolizer({
                  color: this.stylesWithDefaults.polygonStroke.toCssColorString(),
                  width: this.stylesWithDefaults.polygonStrokeWidth
                }),
                minzoom: 0,
                maxzoom: Infinity,
                filter: (zoom, feature) => {
                  return (
                    feature?.geomType === GeomType.Polygon &&
                    (!currentTimeRows ||
                      currentTimeRows.includes(feature?.props[FEATURE_ID_PROP]))
                  );
                }
              }
            : undefined,
          // Line stroke (hide if 0)
          this.stylesWithDefaults.polylineStrokeWidth !== 0
            ? {
                dataLayer: GEOJSON_SOURCE_LAYER_NAME,
                symbolizer: new LineSymbolizer({
                  color: getValue(
                    this.stylesWithDefaults.polylineStroke.toCssColorString()
                  ),
                  width: this.stylesWithDefaults.polylineStrokeWidth
                }),
                minzoom: 0,
                maxzoom: Infinity,
                filter: (zoom, feature) => {
                  return (
                    feature?.geomType === GeomType.Line &&
                    (!currentTimeRows ||
                      currentTimeRows.includes(feature?.props[FEATURE_ID_PROP]))
                  );
                }
              }
            : undefined,
          // Point circle
          {
            dataLayer: GEOJSON_SOURCE_LAYER_NAME,
            symbolizer: new CircleSymbolizer({
              radius: Math.round(this.stylesWithDefaults.markerSize / 5),
              fill: getValue(
                this.stylesWithDefaults.markerColor.toCssColorString()
              ),
              width: this.stylesWithDefaults.markerStrokeWidth,
              stroke: this.stylesWithDefaults.stroke.toCssColorString(),
              opacity: this.stylesWithDefaults.markerOpacity
            }),
            minzoom: 0,
            maxzoom: Infinity,
            filter: (zoom, feature) => {
              return (
                feature?.geomType === GeomType.Point &&
                (!currentTimeRows ||
                  currentTimeRows.includes(feature?.props[FEATURE_ID_PROP]))
              );
            }
          }
        ]),
        labelRules: []
      });
    }

    private async loadCzmlDataSource(
      geoJson: FeatureCollectionWithCrs
    ): Promise<CzmlDataSource> {
      const czmlTemplate = runInAction(() => toJS(this.czmlTemplate));

      const rootCzml = [
        {
          id: "document",
          name: "CZML",
          version: "1.0"
        }
      ];

      // Create a czml packet for each geoJson Point feature
      // Set czml position (cartographicDegrees) to point coordinates
      // Set czml properties to feature properties
      for (let i = 0; i < geoJson.features.length; i++) {
        const feature = geoJson.features[i];
        if (feature !== null && feature.geometry?.type === "Point") {
          const point = feature.geometry as Point;
          const czml = clone(czmlTemplate ?? {}, true);
          const coords = point.coordinates;
          if (coords.length === 2) {
            coords[2] = 0;
          }
          czml.position = {
            cartographicDegrees: point.coordinates
          };

          // _catalogItem property is needed for some feature picking functions (eg FeatureInfoMixin)
          (feature as any)._catalogItem = this;

          if (feature.properties !== null) {
            czml.properties = Object.assign(
              czml.properties ?? {},
              feature.properties
            );
          }

          rootCzml.push(czml);
        }
      }

      return CzmlDataSource.load(rootCzml);
    }

    @computed
    get stylesWithDefaults() {
      const defaults = {
        markerSize: 20,
        markerColor: getRandomCssColor(this.name ?? ""),
        stroke: getColor(this.terria.baseMapContrastColor),
        polygonStroke: getColor(this.terria.baseMapContrastColor),
        polylineStroke: getRandomCssColor(this.name ?? ""),
        markerStrokeWidth: 1,
        polylineStrokeWidth: 2,
        polygonStrokeWidth: 1,
        fill: getRandomCssColor((this.name ?? "") + " fill"),
        fillAlpha: 0.75
      };

      const defaultColor = (
        colString: string | undefined,
        defaultColor: Color
      ) => (colString ? getColor(colString) : defaultColor);

      const options = {
        describe: describeWithoutUnderscores,
        markerSize:
          parseMarkerSize(this.style["marker-size"]) ?? defaults.markerSize,
        markerSymbol: this.style["marker-symbol"], // and undefined if none
        markerColor: defaultColor(
          this.style["marker-color"],
          defaults.markerColor
        ),
        stroke: defaultColor(this.style.stroke, defaults.stroke),
        polygonStroke: defaultColor(this.style.stroke, defaults.polygonStroke),
        polylineStroke: defaultColor(
          this.style.stroke,
          defaults.polylineStroke
        ),
        // Note these specific stroke widths are only used for geojson-vt
        markerStrokeWidth:
          this.style["marker-stroke-width"] ??
          this.style["stroke-width"] ??
          defaults.markerStrokeWidth,
        polylineStrokeWidth:
          this.style["polyline-stroke-width"] ??
          this.style["stroke-width"] ??
          defaults.polylineStrokeWidth,
        polygonStrokeWidth:
          this.style["polygon-stroke-width"] ??
          this.style["stroke-width"] ??
          defaults.polygonStrokeWidth,
        markerOpacity: this.style["marker-opacity"], // not in SimpleStyle spec or supported by Cesium but see below
        fill: defaultColor(this.style.fill, defaults.fill),
        clampToGround: this.clampToGround,
        markerUrl: this.style["marker-url"] // not in SimpleStyle spec but gives an alternate to maki marker symbols
          ? proxyCatalogItemUrl(this, this.style["marker-url"])
          : undefined,
        credit: this.attribution
      };

      if (isDefined(this.style["stroke-opacity"])) {
        options.stroke.alpha = this.style["stroke-opacity"];
        options.polygonStroke.alpha = this.style["stroke-opacity"];
        options.polylineStroke.alpha = this.style["stroke-opacity"];
      }

      if (isDefined(this.style["fill-opacity"])) {
        options.fill.alpha = this.style["fill-opacity"];
      } else {
        options.fill.alpha = defaults.fillAlpha;
      }

      return toJS(options);
    }

    protected async loadGeoJsonDataSource(
      geoJson: FeatureCollectionWithCrs
    ): Promise<GeoJsonDataSource> {
      /* Style information is applied as follows, in decreasing priority:
            - simple-style properties set directly on individual features in the GeoJSON file
            - simple-style properties set as the 'Style' property on the catalog item
            - our 'this.styles' set below (and point styling applied after Cesium loads the GeoJSON)
            - if anything is underspecified there, then Cesium's defaults come in.
            See https://github.com/mapbox/simplestyle-spec/tree/master/1.1.0
      */

      this.addPerPropertyStyleToGeoJson(geoJson);

      const now = JulianDate.now();

      const styles = runInAction(() => this.stylesWithDefaults);

      const dataSource = await makeRealPromise<GeoJsonDataSource>(
        GeoJsonDataSource.load(geoJson, styles)
      );
      const entities = dataSource.entities;
      for (let i = 0; i < entities.values.length; ++i) {
        const entity = entities.values[i];

        const properties = entity.properties;

        // _catalogItem property is needed for some feature picking functions (eg FeatureInfoMixin)
        (entity as any)._catalogItem = this;

        // Time
        if (
          isDefined(properties) &&
          isDefined(this.timeProperty) &&
          isDefined(this.discreteTimesAsSortedJulianDates)
        ) {
          const startTimeDiscreteTime = properties[this.timeProperty];
          const startTimeIdx = this.discreteTimesAsSortedJulianDates?.findIndex(
            t => t.tag === startTimeDiscreteTime.getValue()
          );
          const startTime = this.discreteTimesAsSortedJulianDates[startTimeIdx];

          if (isDefined(startTime)) {
            const endTimeIdx = startTimeIdx + 1;
            const endTime = this.discreteTimesAsSortedJulianDates[endTimeIdx];

            entity.availability = new TimeIntervalCollection([
              new TimeInterval({
                start: startTime.time,
                stop: endTime?.time ?? Iso8601.MAXIMUM_VALUE,
                isStopIncluded: false
              })
            ]);
          }
        }

        // Billboard
        if (isDefined(entity.billboard) && isDefined(styles.markerUrl)) {
          entity.billboard = new BillboardGraphics({
            image: new ConstantProperty(styles.markerUrl),
            width:
              properties && properties["marker-width"]
                ? new ConstantProperty(properties["marker-width"])
                : undefined,
            height:
              properties && properties["marker-height"]
                ? new ConstantProperty(properties["marker-height"])
                : undefined,
            rotation:
              properties && properties["marker-angle"]
                ? new ConstantProperty(properties["marker-angle"])
                : undefined,
            heightReference: styles.clampToGround
              ? new ConstantProperty(HeightReference.RELATIVE_TO_GROUND)
              : undefined
          });

          /* If no marker symbol was provided but Cesium has generated one for a point, then turn it into
               a filled circle instead of the default marker. */
        } else if (
          isDefined(entity.billboard) &&
          (!properties || !isDefined(properties["marker-symbol"])) &&
          !isDefined(styles.markerSymbol)
        ) {
          entity.point = new PointGraphics({
            color: new ConstantProperty(
              getColor(
                properties?.["marker-color"]?.getValue() ?? styles.markerColor
              )
            ),
            pixelSize: new ConstantProperty(
              parseMarkerSize(
                properties && properties["marker-size"]?.getValue()
              ) ?? styles.markerSize / 2
            ),
            outlineWidth: new ConstantProperty(
              properties?.["stroke-width"]?.getValue() ??
                styles.markerStrokeWidth
            ),
            outlineColor: new ConstantProperty(
              getColor(properties?.stroke?.getValue() ?? styles.polygonStroke)
            ),
            heightReference: new ConstantProperty(
              styles.clampToGround
                ? HeightReference.RELATIVE_TO_GROUND
                : undefined
            )
          });
          if (
            properties &&
            isDefined(properties["marker-opacity"]) &&
            entity.point.color
          ) {
            // not part of SimpleStyle spec, but why not?
            const color: Color = entity.point.color.getValue(now);
            color.alpha = parseFloat(properties["marker-opacity"]?.getValue());
          }

          entity.billboard = undefined;
        }
        if (
          isDefined(entity.billboard) &&
          properties &&
          isDefined(properties["marker-opacity"]?.getValue())
        ) {
          entity.billboard.color = new ConstantProperty(
            new Color(
              1,
              1,
              1,
              parseFloat(properties["marker-opacity"]?.getValue())
            )
          );
        }

        if (isDefined(entity.polygon)) {
          // Extrude polygons if heightProperty is set
          if (
            this.heightProperty &&
            properties &&
            isDefined(properties[this.heightProperty])
          ) {
            entity.polygon.closeTop = new ConstantProperty(true);
            entity.polygon.extrudedHeight = properties[this.heightProperty];

            entity.polygon.heightReference = new ConstantProperty(
              HeightReference.CLAMP_TO_GROUND
            );
            entity.polygon.extrudedHeightReference = new ConstantProperty(
              HeightReference.RELATIVE_TO_GROUND
            );
          }
          // Cesium on Windows can't render polygons with a stroke-width > 1.0.  And even on other platforms it
          // looks bad because WebGL doesn't mitre the lines together nicely.
          // As a workaround for the special case where the polygon is unfilled anyway, change it to a polyline.
          else if (
            polygonHasWideOutline(entity.polygon, now) &&
            !polygonIsFilled(entity.polygon)
          ) {
            createPolylineFromPolygon(entities, entity, now);
            entity.polygon = undefined;
          } else if (
            polygonHasOutline(entity.polygon, now) &&
            isPolygonOnTerrain(entity.polygon, now)
          ) {
            // Polygons don't directly support outlines when they're on terrain.
            // So create a manual outline.
            createPolylineFromPolygon(entities, entity, now);
          }
        }
      }
      return dataSource;
    }

    @computed
    get discreteTimes(): DiscreteTimeAsJS[] | undefined {
      if (this.readyData === undefined) {
        return undefined;
      }

      // If we are using mvt (mapbox vector tiles / protomaps imagery provider) return TableMixin.discreteTimes
      if (this.useMvt && !this.disableTableStyle) return super.discreteTimes;

      // If using timeProperty - get discrete times from that
      if (this.timeProperty) {
        const discreteTimesMap: Map<string, DiscreteTimeAsJS> = new Map();

        for (let i = 0; i < this.readyData.features.length; i++) {
          const feature = this.readyData.features[i];
          if (
            feature.properties !== null &&
            feature.properties !== undefined &&
            feature.properties[this.timeProperty!] !== undefined
          ) {
            const dt = {
              time: new Date(
                `${feature.properties[this.timeProperty!]}`
              ).toISOString(),
              tag: feature.properties[this.timeProperty!]
            };
            discreteTimesMap.set(dt.tag, dt);
          }
        }

        return Array.from(discreteTimesMap.values());
      }
    }

    /**
     * Transform feature properties into column-major format.
     * This enables all TableMixin functionality - which is used for styling vector tiles.
     * If this returns an empty array, TableMixin will effectively be disabled
     */
    @computed
    get dataColumnMajor() {
      if (!this.readyData || !this.useMvt || this.disableTableStyle) return [];

      // Map from property name (column name) to column index
      const colMap = new Map<string, number>();

      const dataColumnMajor: string[][] = [];

      dataColumnMajor[0] = new Array(this.readyData.features.length + 1).fill(
        ""
      );

      for (let i = 0; i < this.readyData.features.length; i++) {
        const feature = this.readyData.features[i];

        // Loop through feature properties
        if (feature.properties) {
          for (let j = 0; j < Object.keys(feature.properties).length; j++) {
            const prop = Object.keys(feature.properties)[j];
            const value = feature.properties[prop];
            let colIndex = colMap.get(prop);

            // If column isn't in colMap - we need to create it
            if (!isDefined(colIndex)) {
              colIndex = colMap.size;
              colMap.set(prop, colIndex);
              dataColumnMajor[colIndex] = new Array(
                this.readyData.features.length + 1
              ).fill("");
            }
            if (typeof value === "string") {
              dataColumnMajor[colIndex][i + 1] = value;
            } else if (typeof value === "number") {
              dataColumnMajor[colIndex][i + 1] = value.toString();
            }
          }
        }
      }

      // Set column titles
      colMap.forEach((index, prop) => {
        dataColumnMajor[index][0] = prop;
      });

      return dataColumnMajor;
    }

    /** We don't need to use TableMixin forceLoadTableData
     * We implement `get dataColumnMajor()` instead
     */
    async forceLoadTableData() {
      return undefined;
    }
  }
  return GeoJsonMixin;
}

namespace GeoJsonMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof GeoJsonMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return model && model.isGeoJson;
  }
}

export default GeoJsonMixin;

// Note: these type checks are not that rigorous, we are assuming we are getting valid GeoJson objects
export function isFeatureCollection(
  json: any
): json is FeatureCollectionWithCrs {
  return json.type === "FeatureCollection" && Array.isArray(json.features);
}

export function isFeature(json: any): json is Feature {
  return json.type === "Feature" && json.geometry;
}

export function isGeometries(json: any): json is Geometries {
  return (
    [
      "Point",
      "MultiPoint",
      "LineString",
      "MultiLineString",
      "Polygon",
      "MultiPolygon"
    ].includes(json.type) && Array.isArray(json.coordinates)
  );
}

export function toFeatureCollection(
  json: any
): FeatureCollectionWithCrs | undefined {
  if (isFeatureCollection(json)) return json; // It's already a feature collection, do nothing

  if (isFeature(json)) {
    // Move CRS data from Feature to FeatureCollection
    if ("crs" in json && isJsonObject((json as any).crs)) {
      const crs = (json as any).crs;
      delete (json as any).crs;

      const fc = featureCollection([json]) as FeatureCollectionWithCrs;
      fc.crs = crs;
      return fc;
    }

    return featureCollection([json]) as FeatureCollectionWithCrs;
  }

  if (isGeometries(json))
    return featureCollection([feature(json)]) as FeatureCollectionWithCrs;
  if (Array.isArray(json) && json.every(item => isFeature(item))) {
    return featureCollection(json) as FeatureCollectionWithCrs;
  }
  if (Array.isArray(json) && json.every(item => isGeometries(item))) {
    return featureCollection(
      json.map(item => feature(item, item.properties))
    ) as FeatureCollectionWithCrs;
  }
}

function createPolylineFromPolygon(
  entities: EntityCollection,
  entity: Entity,
  now: JulianDate
) {
  const polygon = entity.polygon!;

  entity.polyline = new PolylineGraphics();
  entity.polyline.show = polygon.show;

  if (isPolygonOnTerrain(polygon, now)) {
    entity.polyline.clampToGround = new ConstantProperty(true);
  }

  if (isDefined(polygon.outlineColor)) {
    entity.polyline.material = new ColorMaterialProperty(polygon.outlineColor);
  }

  const hierarchy: PolygonHierarchy | undefined = getPropertyValue(
    polygon.hierarchy
  );

  if (!hierarchy) {
    return;
  }

  const positions = closePolyline(hierarchy.positions);

  entity.polyline.positions = new ConstantProperty(positions);
  entity.polyline.width =
    polygon.outlineWidth && polygon.outlineWidth.getValue(now);

  createEntitiesFromHoles(entities, hierarchy.holes, entity);
}

async function reprojectToGeographic(
  geoJson: FeatureCollectionWithCrs,
  proj4ServiceBaseUrl?: string
): Promise<FeatureCollectionWithCrs> {
  let code: string | undefined;

  if (!isJsonObject(geoJson.crs)) {
    code = undefined;
  } else if (
    geoJson.crs.type === "EPSG" &&
    isJsonObject(geoJson.crs.properties) &&
    typeof geoJson.crs.properties.code === "string"
  ) {
    code = "EPSG:" + geoJson.crs.properties.code;
  } else if (
    isJsonObject(geoJson.crs.properties) &&
    geoJson.crs.type === "name" &&
    typeof geoJson.crs.properties.name === "string"
  ) {
    code = Reproject.crsStringToCode(geoJson.crs.properties.name);
  }

  geoJson.crs = {
    type: "EPSG",
    properties: {
      code: "4326"
    }
  };

  if (!code || !Reproject.willNeedReprojecting(code)) {
    return Promise.resolve(geoJson);
  }

  const needsReprojection = proj4ServiceBaseUrl
    ? await makeRealPromise<boolean>(
        Reproject.checkProjection(proj4ServiceBaseUrl, code)
      )
    : false;

  if (needsReprojection) {
    try {
      filterValue(geoJson, "coordinates", function(obj, prop) {
        obj[prop] = filterArray(obj[prop], function(pts) {
          if (pts.length === 0) return [];

          return reprojectPointList(pts, code);
        });
      });
      return geoJson;
    } catch (e) {
      throw TerriaError.from(e, "Failed to reproject geoJSON");
    }
  } else {
    throw new DeveloperError(
      "The crs code for this datasource is unsupported."
    );
  }
}

type Coordinates = number[];

// Reproject a point list based on the supplied crs code.
function reprojectPointList(
  pts: Coordinates | Coordinates[],
  code?: string
): Coordinates | Coordinates[] {
  if (!code) return [];
  if (!Array.isArray(pts[0])) {
    return Reproject.reprojectPoint(pts, code, "EPSG:4326");
  }
  const pts_out = [];
  for (let i = 0; i < pts.length; i++) {
    const pt = pts[i];
    if (Array.isArray(pt))
      pts_out.push(Reproject.reprojectPoint(pt, code, "EPSG:4326"));
  }
  return pts_out;
}

// Find a member by name in the gml.
function filterValue(
  obj: any,
  prop: string,
  func: (obj: any, prop: string) => void
) {
  for (let p in obj) {
    if (obj.hasOwnProperty(p) === false) {
      continue;
    } else if (p === prop) {
      if (func && typeof func === "function") {
        func(obj, prop);
      }
    } else if (typeof obj[p] === "object") {
      filterValue(obj[p], prop, func);
    }
  }
}

// Filter a geojson coordinates array structure.
function filterArray(
  pts: any[],
  func: (pts: Coordinates | Coordinates[]) => any
) {
  if (!(pts[0] instanceof Array) || !(pts[0][0] instanceof Array)) {
    pts = func(pts);
    return pts;
  }

  const result = new Array(pts.length);
  for (let i = 0; i < pts.length; i++) {
    result[i] = filterArray(pts[i], func); // at array of arrays of points
  }
  return result;
}

/**
 * Get a random color for the data based on the passed string (usually dataset name).
 */
function getRandomCssColor(
  name: string,
  cssColors: string[] = StandardCssColors.highContrast
) {
  const index = hashFromString(name) % cssColors.length;
  const color = Color.fromCssColorString(cssColors[index]);
  color.alpha = 1;
  return color;
}

const simpleStyleIdentifiers = [
  "title",
  "description",
  "marker-size",
  "marker-symbol",
  "marker-color",
  "stroke",
  "stroke-opacity",
  "stroke-width",
  "fill",
  "fill-opacity"
];

// This next function modelled on Cesium.geoJsonDataSource's defaultDescribe.
function describeWithoutUnderscores(
  properties: any,
  nameProperty?: string
): string {
  let html = "";
  for (let key in properties) {
    if (properties.hasOwnProperty(key)) {
      if (key === nameProperty || simpleStyleIdentifiers.indexOf(key) !== -1) {
        continue;
      }
      let value = properties[key];
      if (typeof value === "object") {
        value = describeWithoutUnderscores(value);
      } else {
        value = formatPropertyValue(value);
      }
      key = key.replace(/_/g, " ");
      if (isDefined(value)) {
        html += "<tr><th>" + key + "</th><td>" + value + "</td></tr>";
      }
    }
  }
  if (html.length > 0) {
    html =
      '<table class="cesium-infoBox-defaultTable"><tbody>' +
      html +
      "</tbody></table>";
  }
  return html;
}

function polygonHasOutline(polygon: PolygonGraphics, now: JulianDate) {
  return (
    isDefined(polygon.outlineWidth) && polygon.outlineWidth.getValue(now) > 0
  );
}

function polygonHasWideOutline(polygon: PolygonGraphics, now: JulianDate) {
  return (
    isDefined(polygon.outlineWidth) && polygon.outlineWidth.getValue(now) > 1
  );
}

function polygonIsFilled(polygon: PolygonGraphics) {
  let fill = true;
  if (isDefined(polygon.fill)) {
    fill = polygon.fill.getValue(new JulianDate());
  }

  if (!fill) {
    return false;
  }

  if (!isDefined(polygon.material)) {
    // The default is solid white.
    return true;
  }

  let color: Color | undefined;
  if (polygon.material instanceof Color) {
    color = polygon.material.getValue(new JulianDate());
  } else {
    color = (polygon.material as ColorMaterialProperty).color?.getValue(
      new JulianDate()
    );
  }

  if (color && color.alpha === 0.0) {
    return false;
  }

  return true;
}

function closePolyline(positions: Cartesian3[]) {
  // If the first and last positions are more than a meter apart, duplicate the first position so the polyline is closed.
  if (
    positions.length >= 2 &&
    !Cartesian3.equalsEpsilon(
      positions[0],
      positions[positions.length - 1],
      0.0,
      1.0
    )
  ) {
    const copy = positions.slice();
    copy.push(positions[0]);
    return copy;
  }
  return positions;
}

function createEntitiesFromHoles(
  entityCollection: EntityCollection,
  holes: PolygonHierarchy[],
  mainEntity: Entity
) {
  if (!isDefined(holes)) {
    return;
  }

  for (let i = 0; i < holes.length; ++i) {
    createEntityFromHole(entityCollection, holes[i], mainEntity);
  }
}

function createEntityFromHole(
  entityCollection: EntityCollection,
  hole: PolygonHierarchy,
  mainEntity: Entity
) {
  if (
    !isDefined(hole) ||
    !isDefined(hole.positions) ||
    hole.positions.length === 0
  ) {
    return;
  }

  const entity = new Entity();

  entity.name = mainEntity.name;
  entity.availability = mainEntity.availability;
  entity.description = mainEntity.description;
  entity.properties = mainEntity.properties;

  entity.polyline = new PolylineGraphics();
  entity.polyline.show = mainEntity.polyline!.show;
  entity.polyline.material = mainEntity.polyline!.material;
  entity.polyline.width = mainEntity.polyline!.width;
  entity.polyline.clampToGround = mainEntity.polyline!.clampToGround;

  closePolyline(hole.positions);
  entity.polyline.positions = new ConstantProperty(hole.positions);

  entityCollection.add(entity);

  createEntitiesFromHoles(entityCollection, hole.holes, mainEntity);
}

function getPropertyValue<T>(property: Property | undefined): T | undefined {
  if (property === undefined) {
    return undefined;
  }
  return property.getValue(JulianDate.now());
}

function isPolygonOnTerrain(polygon: PolygonGraphics, now: JulianDate) {
  const polygonAny: any = polygon;
  const isClamped =
    polygonAny.heightReference &&
    polygonAny.heightReference.getValue(now) ===
      HeightReference.CLAMP_TO_GROUND;
  const hasPerPositionHeight =
    polygon.perPositionHeight && polygon.perPositionHeight.getValue(now);
  const hasPolygonHeight =
    polygon.height && polygon.height.getValue(now) !== undefined;

  return isClamped || (!hasPerPositionHeight && !hasPolygonHeight);
}

export function getColor(color: String | string | Color): Color {
  if (typeof color === "string" || color instanceof String) {
    return Color.fromCssColorString(color.toString()) ?? Color.GRAY;
  } else {
    return color;
  }
}

function parseMarkerSize(sizeString?: string): number | undefined {
  const sizes: { [name: string]: number } = {
    small: 24,
    medium: 48,
    large: 64
  };

  if (sizeString === undefined) {
    return undefined;
  }

  if (sizes[sizeString] !== undefined) {
    return sizes[sizeString];
  }
  return parseInt(sizeString, 10); // SimpleStyle doesn't allow 'marker-size: 20', but people will do it.
}
