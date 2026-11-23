import i18next from "i18next";
import { computed, makeObservable } from "mobx";
import moment from "moment";
import proj4 from "proj4";
import URI from "urijs";
import createDiscreteTimesFromIsoSegments from "../../../Core/createDiscreteTimes";
import isDefined from "../../../Core/isDefined";
import loadJson from "../../../Core/loadJson";
import replaceUnderscores from "../../../Core/replaceUnderscores";
import Proj4Definitions from "../../../Map/Vector/Proj4Definitions";
import { hasUnsupportedStylesForProtomaps } from "../../../Map/Vector/Protomaps/tableStyleToProtomaps";
import { DiscreteTimeAsJS } from "../../../ModelMixins/DiscretelyTimeVaryingMixin";
import ArcGisFeatureServerCatalogItemTraits from "../../../Traits/TraitsClasses/ArcGisFeatureServerCatalogItemTraits";
import { InfoSectionTraits } from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import { RectangleTraits } from "../../../Traits/TraitsClasses/MappableTraits";
import TableColorStyleTraits, {
  EnumColorTraits
} from "../../../Traits/TraitsClasses/Table/ColorStyleTraits";
import TableColumnTraits from "../../../Traits/TraitsClasses/Table/ColumnTraits";
import TableOutlineStyleTraits, {
  BinOutlineSymbolTraits,
  EnumOutlineSymbolTraits
} from "../../../Traits/TraitsClasses/Table/OutlineStyleTraits";
import TablePointSizeStyleTraits from "../../../Traits/TraitsClasses/Table/PointSizeStyleTraits";
import TablePointStyleTraits, {
  BinPointSymbolTraits,
  EnumPointSymbolTraits
} from "../../../Traits/TraitsClasses/Table/PointStyleTraits";
import TableStyleTraits from "../../../Traits/TraitsClasses/Table/StyleTraits";
import TableTimeStyleTraits from "../../../Traits/TraitsClasses/Table/TimeStyleTraits";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import StratumOrder from "../../Definition/StratumOrder";
import getToken from "../../getToken";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import ArcGisFeatureServerCatalogItem from "./ArcGisFeatureServerCatalogItem";
import { esriStyleToTableStyle } from "./esriStyleToTableStyle";

type EsriStyleTypes =
  | "esriPMS" // simple picture style
  | "esriSMS" // simple marker style
  | "esriSLS" // simple line style
  | "esriSFS"; // simple fill style

/** as defined https://developers.arcgis.com/web-map-specification/objects/esriSFS_symbol/ */
export type SupportedFillStyle =
  | "esriSFSSolid" // fill line with color
  | "esriSFSNull"; // no fill

/** as defined https://developers.arcgis.com/web-map-specification/objects/esriSMS_symbol/ */
export type SupportedEsriSimpleMarkerStyle =
  | "esriSMSCircle"
  | "esriSMSCross"
  | "esriSMSDiamond"
  | "esriSMSSquare"
  | "esriSMSTriangle"
  | "esriSMSX";

/** as defined https://developers.arcgis.com/web-map-specification/objects/esriSLS_symbol/ */
export type SupportedLineStyle =
  | "esriSLSSolid" // solid line
  | "esriSLSDash" // dashes (-----)
  | "esriSLSDashDot" // line (-.-.-)
  | "esriSLSDashDotDot" // line (-..-..-)
  | "esriSLSDot" // dotted line (.....)
  | "esriSLSLongDash"
  | "esriSLSLongDashDot"
  | "esriSLSShortDash"
  | "esriSLSShortDashDot"
  | "esriSLSShortDashDotDot"
  | "esriSLSShortDot"
  | "esriSLSNull";

/** as defined https://developers.arcgis.com/web-map-specification/objects/symbol/ */
export interface EsriStyle {
  contentType: string;
  color?: number[];
  outline?: Outline;
  imageData?: any;
  xoffset?: number;
  yoffset?: number;
  width?: number;
  height?: number;
  angle?: number;
  size?: number;
  type: EsriStyleTypes;
  url?: string;
  style?:
    | SupportedEsriSimpleMarkerStyle
    | SupportedLineStyle
    | SupportedFillStyle;
}

interface Outline {
  type: EsriStyleTypes;
  color: number[];
  width: number;
  style?: SupportedLineStyle;
}

interface Renderer {
  type: "simple" | "uniqueValue" | "classBreaks";
}

interface ClassBreakInfo extends SimpleRenderer {
  classMaxValue: number;
  classMinValue?: number;
}

interface ClassBreaksRenderer extends Renderer {
  field: string;
  classBreakInfos: ClassBreakInfo[];
  defaultSymbol: EsriStyle | null;

  /** Note, value expressions are not supported */
  valueExpression?: string;
  valueExpressionTitle?: string;

  /** Note, visual variables are not supported. See https://developers.arcgis.com/web-map-specification/objects/visualVariable/ */
  visualVariables?: unknown[];
}

interface UniqueValueInfo extends SimpleRenderer {
  value: string;
}

/**
 * See https://developers.arcgis.com/web-map-specification/objects/uniqueValueRenderer/
 */
interface UniqueValueRenderer extends Renderer {
  /** Terria only supports `field1`, not multiple fields (`field2` or `field3`). */
  field1: string;
  field2?: string;
  field3?: string;
  fieldDelimiter?: string;
  uniqueValueInfos: UniqueValueInfo[];
  defaultSymbol: EsriStyle | null;

  /** Note, value expressions are not supported */
  valueExpression?: string;
  valueExpressionTitle?: string;

  /** Note, visual variables are not supported. See https://developers.arcgis.com/web-map-specification/objects/visualVariable/ */
  visualVariables?: unknown[];
}

// https://developers.arcgis.com/web-map-specification/objects/simpleRenderer/
interface SimpleRenderer extends Renderer {
  label?: string;
  symbol: EsriStyle | null;

  /** Note, visual variables are not supported. See https://developers.arcgis.com/web-map-specification/objects/visualVariable/ */
  visualVariables?: unknown[];
}

/** For JSON Schema for FeatureServer Layer response see https://developers.arcgis.com/rest/services-reference/enterprise/layer-feature-service/#json-response-syntax */
interface FeatureServer {
  documentInfo?: {
    Author?: string;
  };
  name?: string;
  description?: string;
  copyrightText?: string;
  drawingInfo?: {
    renderer: Renderer;
  };
  extent?: Extent;
  minScale?: number;
  maxScale?: number;
  advancedQueryCapabilities?: {
    supportsPagination: boolean;
    supportsDistinct?: boolean;
  };
  supportedQueryFormats?: string;
  maxRecordCount?: number;
  tileMaxRecordCount?: number;
  maxRecordCountFactor?: number;
  supportsCoordinatesQuantization?: boolean;
  supportsTilesAndBasicQueriesMode?: boolean;
  objectIdField?: string;
  fields?: Field[];
  timeInfo?: TimeInfo;
}

/** See https://developers.arcgis.com/rest/services-reference/enterprise/layer-feature-service/#timeinfo */
interface TimeInfo {
  startTimeField?: string | null;
  endTimeField?: string | null;
  trackIdField?: string | null;
  /** Start and end of the layer's data, in epoch milliseconds */
  timeExtent?: [number, number] | null;
  timeInterval?: number | null;
  timeIntervalUnits?: string | null;
}

/** Most time steps made from `timeInfo.timeExtent`, as for the other items' `maxRefreshIntervals` */
const MAX_TIME_STEPS = 10000;

/** `timeInfo.timeIntervalUnits` as `moment` units */
const esriTimeUnits: Record<string, [number, moment.unitOfTime.Base]> = {
  esriTimeUnitsMilliseconds: [1, "millisecond"],
  esriTimeUnitsSeconds: [1, "second"],
  esriTimeUnitsMinutes: [1, "minute"],
  esriTimeUnitsHours: [1, "hour"],
  esriTimeUnitsDays: [1, "day"],
  esriTimeUnitsWeeks: [1, "week"],
  esriTimeUnitsMonths: [1, "month"],
  esriTimeUnitsYears: [1, "year"],
  esriTimeUnitsDecades: [10, "year"],
  esriTimeUnitsCenturies: [100, "year"]
};

type FieldType =
  | "esriFieldTypeSmallInteger"
  | "esriFieldTypeInteger"
  | "esriFieldTypeSingle"
  | "esriFieldTypeDouble"
  | "esriFieldTypeString"
  | "esriFieldTypeDate"
  | "esriFieldTypeOID"
  | "esriFieldTypeGeometry"
  | "esriFieldTypeBlob"
  | "esriFieldTypeRaster"
  | "esriFieldTypeGUID"
  | "esriFieldTypeGlobalID"
  | "esriFieldTypeXML"
  | "esriFieldTypeBigInteger";

const fieldTypeToTableColumn: Record<FieldType, string> = {
  esriFieldTypeSmallInteger: "scalar",
  esriFieldTypeInteger: "scalar",
  esriFieldTypeSingle: "scalar",
  esriFieldTypeDouble: "scalar",
  esriFieldTypeString: "text",
  esriFieldTypeDate: "time",
  esriFieldTypeOID: "scalar",
  esriFieldTypeGeometry: "hidden",
  esriFieldTypeBlob: "hidden",
  esriFieldTypeRaster: "hidden",
  esriFieldTypeGUID: "hidden",
  esriFieldTypeGlobalID: "hidden",
  esriFieldTypeXML: "hidden",
  esriFieldTypeBigInteger: "scalar"
};

interface Field {
  name: string;
  type: FieldType;
  alias?: string;
  domain?: unknown;
  editable?: boolean;
  nullable?: boolean;
  length?: number;
  defaultValue?: unknown;
  modelName?: string;
}

interface SpatialReference {
  wkid?: string;
  latestWkid?: string;
}

interface Extent {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  spatialReference?: SpatialReference;
}

export class ArcGisFeatureServerStratum extends LoadableStratum(
  ArcGisFeatureServerCatalogItemTraits
) {
  static stratumName = "featureServer";

  constructor(
    private readonly _item: ArcGisFeatureServerCatalogItem,
    private readonly _featureServer: FeatureServer | undefined,
    private readonly _token: string | undefined,
    /** Distinct start times (epoch milliseconds) of a time-enabled layer that supports tiles */
    private readonly _startTimes?: number[]
  ) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new ArcGisFeatureServerStratum(
      newModel as ArcGisFeatureServerCatalogItem,
      this._featureServer,
      this._token,
      this._startTimes
    ) as this;
  }

  static async load(
    item: ArcGisFeatureServerCatalogItem
  ): Promise<ArcGisFeatureServerStratum> {
    if (item.url === undefined) {
      return new ArcGisFeatureServerStratum(item, undefined, undefined);
    }

    let token: string | undefined;
    if (isDefined(item.tokenUrl) && isDefined(item.url)) {
      token = await getToken(item.terria, item.tokenUrl, item.url);
    } else if (isDefined(item.token)) {
      token = item.token;
    }

    const metaUrl = buildMetadataUrl(item, token);
    const featureServer: FeatureServer = await loadJson(metaUrl);

    // Tiles only hold the features in view, so get the time steps from the server
    const startTimeField = featureServer.timeInfo?.startTimeField;
    const startTimes =
      startTimeField && supportsPbfTiles(featureServer)
        ? await loadDistinctValues(item, featureServer, token, startTimeField)
        : undefined;

    return new ArcGisFeatureServerStratum(
      item,
      featureServer,
      token,
      startTimes
    );
  }

  get token() {
    return this._token;
  }

  @computed
  get shortReport(): string | undefined {
    // Show notice if reached
    if (
      this._item.readyData?.features !== undefined &&
      this._item.readyData!.features.length >= this._item.maxFeatures
    ) {
      return i18next.t(
        ($) => $.models.arcGisFeatureServerCatalogItem.reachedMaxFeatureLimit,
        {
          maxFeatures: this._item.maxFeatures
        }
      );
    }
    return undefined;
  }

  @computed get maxScaleDenominator(): number | undefined {
    return this._featureServer?.minScale;
  }

  @computed get minScaleDenominator(): number | undefined {
    return this._featureServer?.maxScale;
  }

  @computed get name(): string | undefined {
    if (
      this._featureServer?.name !== undefined &&
      this._featureServer.name.length > 0
    ) {
      return replaceUnderscores(this._featureServer.name);
    }
  }

  @computed get dataCustodian(): string | undefined {
    if (
      this._featureServer?.documentInfo &&
      this._featureServer?.documentInfo.Author &&
      this._featureServer?.documentInfo.Author.length > 0
    ) {
      return this._featureServer.documentInfo.Author;
    }
  }

  @computed get rectangle(): StratumFromTraits<RectangleTraits> | undefined {
    const extent = this._featureServer?.extent;
    const wkidCode =
      extent?.spatialReference?.latestWkid ?? extent?.spatialReference?.wkid;

    if (isDefined(extent) && isDefined(wkidCode)) {
      const wkid = "EPSG:" + wkidCode;
      if (!isDefined(Proj4Definitions[wkid])) {
        return undefined;
      }

      const source = Proj4Definitions[wkid];
      const dest = "EPSG:4326";

      // Web Mercator x beyond the edge of the world would wrap round, eg an extent
      // ending just past 180° would end at -179.99°
      const clampX = isWebMercator(source)
        ? (x: number) =>
            Math.max(-WEB_MERCATOR_MAX_X, Math.min(WEB_MERCATOR_MAX_X, x))
        : (x: number) => x;

      let p = proj4(source, dest, [clampX(extent.xmin), extent.ymin]);

      const west = p[0];
      const south = p[1];

      p = proj4(source, dest, [clampX(extent.xmax), extent.ymax]);

      const east = p[0];
      const north = p[1];

      const rectangle = { west: west, south: south, east: east, north: north };
      return createStratumInstance(RectangleTraits, rectangle);
    }

    return undefined;
  }

  @computed get info() {
    return [
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t(
          ($) => $.models.arcGisMapServerCatalogItem.dataDescription
        ),
        content: this._featureServer?.description
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t(
          ($) => $.models.arcGisMapServerCatalogItem.copyrightText
        ),
        content: this._featureServer?.copyrightText
      })
    ];
  }

  @computed get supportsPagination(): boolean {
    if (
      this._featureServer === undefined ||
      this._featureServer.advancedQueryCapabilities === undefined
    ) {
      return false;
    }

    return !!this._featureServer.advancedQueryCapabilities.supportsPagination;
  }

  @computed get activeStyle() {
    return "ESRI";
  }

  /** Whether the layer is time-enabled, ie its `timeInfo` has a start or end time field */
  @computed get hasTimeInfo() {
    const timeInfo = this._featureServer?.timeInfo;
    return !!(timeInfo?.startTimeField || timeInfo?.endTimeField);
  }

  /**
   * Time steps for tiled requests, which don't load the table that the timeline otherwise
   * uses: the layer's distinct start times, or else steps of `timeInfo.timeInterval` over
   * `timeInfo.timeExtent`
   */
  @computed get tiledDiscreteTimes(): DiscreteTimeAsJS[] | undefined {
    if (!this.hasTimeInfo) return undefined;

    if (this._startTimes && this._startTimes.length > 0) {
      return this._startTimes.map((time) => ({
        time: new Date(time).toISOString(),
        tag: undefined
      }));
    }

    const timeInfo = this._featureServer?.timeInfo;
    const timeExtent = timeInfo?.timeExtent;
    if (!timeExtent) return undefined;

    const units = timeInfo.timeIntervalUnits
      ? esriTimeUnits[timeInfo.timeIntervalUnits]
      : undefined;
    const interval =
      timeInfo.timeInterval && units
        ? moment.duration(timeInfo.timeInterval * units[0], units[1])
        : undefined;

    const result: DiscreteTimeAsJS[] = [];
    createDiscreteTimesFromIsoSegments(
      result,
      new Date(timeExtent[0]).toISOString(),
      new Date(timeExtent[1]).toISOString(),
      interval?.toISOString(),
      MAX_TIME_STEPS
    );
    return result;
  }

  /** Tiled requests don't load the table, which would otherwise turn off the date picker */
  @computed get disableDateTimeSelector() {
    if (this._item.tileRequests && (this.tiledDiscreteTimes?.length ?? 0) > 1)
      return false;
    return undefined;
  }

  /** Time settings from the layer's `timeInfo`, if it is time-enabled */
  @computed get defaultStyle() {
    if (!this.hasTimeInfo) return undefined;
    const timeInfo = this._featureServer?.timeInfo;
    const timeColumn = timeInfo?.startTimeField || timeInfo?.endTimeField;

    // Rows need an ID to be grouped, otherwise TableStyle drops them from the
    // timeline. Use the track ID if there is one, else every feature is its
    // own row group.
    const idColumn = timeInfo?.trackIdField || this.objectIdField;

    return createStratumInstance(TableStyleTraits, {
      time: createStratumInstance(TableTimeStyleTraits, {
        timeColumn,
        endTimeColumn: timeInfo?.startTimeField
          ? timeInfo.endTimeField || undefined
          : undefined,
        idColumns: idColumn ? [idColumn] : undefined
      })
    });
  }

  @computed get styles() {
    const renderer = this._featureServer?.drawingInfo?.renderer;

    if (!renderer) return [];

    const rendererType = renderer.type;

    if (rendererType === "simple") {
      const simpleRenderer = renderer as SimpleRenderer;
      const symbol = simpleRenderer.symbol;

      if (simpleRenderer.visualVariables?.length) {
        console.warn(
          `WARNING: Terria does not support visual variables in ArcGisFeatureService SimpleRenderers`
        );
      }

      if (!symbol) return [];

      const symbolStyle = esriStyleToTableStyle(symbol, simpleRenderer.label);
      return [
        createStratumInstance(TableStyleTraits, {
          id: "ESRI",
          hidden: false,
          color: createStratumInstance(TableColorStyleTraits, {
            nullColor: symbolStyle.color ?? "#ffffff"
          }),
          pointSize: symbolStyle.pointSize,
          point: createStratumInstance(TablePointStyleTraits, {
            null: symbolStyle.point
          }),
          outline: createStratumInstance(TableOutlineStyleTraits, {
            null: symbolStyle.outline
          })
        })
      ];
    } else if (rendererType === "uniqueValue") {
      const uniqueValueRenderer = renderer as UniqueValueRenderer;

      const symbolStyles = uniqueValueRenderer.uniqueValueInfos.map((v) => {
        return esriStyleToTableStyle(v.symbol, v.label);
      });

      const defaultSymbolStyle = esriStyleToTableStyle(
        uniqueValueRenderer.defaultSymbol,
        undefined
      );

      // Only include color if there are any styles which aren't esriPMS
      const includeColor = !!uniqueValueRenderer.uniqueValueInfos.find(
        (u) => u.symbol?.type !== "esriPMS"
      );

      if (uniqueValueRenderer.field2 || uniqueValueRenderer.field3) {
        console.warn(
          `WARNING: Terria only supports ArcGisFeatureService UniqueValueRenderers with a single field (\`field1\`), not multiple fields (\`field2\` or \`field3\`)`
        );
      }

      if (uniqueValueRenderer.visualVariables?.length) {
        console.warn(
          `WARNING: Terria does not support visual variables in ArcGisFeatureService UniqueValueRenderers`
        );
      }

      if (uniqueValueRenderer.valueExpression) {
        console.warn(
          `WARNING: Terria does not support value expressions in ArcGisFeatureService UniqueValueRenderers`
        );
      }

      if (!uniqueValueRenderer.field1) {
        console.warn(
          `WARNING: Terria does not support empty field1 in UniqueValueRenderers, using default style`
        );
        return [];
      }

      return [
        createStratumInstance(TableStyleTraits, {
          id: "ESRI",
          hidden: false,
          color: includeColor
            ? createStratumInstance(TableColorStyleTraits, {
                colorColumn: uniqueValueRenderer.field1,
                mapType: "enum",
                enumColors: uniqueValueRenderer.uniqueValueInfos.map((v, i) =>
                  createStratumInstance(EnumColorTraits, {
                    value: v.value,
                    color: symbolStyles[i].color ?? "#ffffff"
                  })
                ),
                nullColor: defaultSymbolStyle.color
              })
            : createStratumInstance(TableColorStyleTraits, {
                nullColor: "#FFFFFF"
              }),
          pointSize: createStratumInstance(TablePointSizeStyleTraits, {}),
          point: createStratumInstance(TablePointStyleTraits, {
            mapType: "enum",
            column: uniqueValueRenderer.field1,
            enum: uniqueValueRenderer.uniqueValueInfos.map((v, i) =>
              createStratumInstance(EnumPointSymbolTraits, {
                value: v.value,
                ...symbolStyles[i].point
              })
            ),
            null: defaultSymbolStyle.point
          }),
          outline: createStratumInstance(TableOutlineStyleTraits, {
            mapType: "enum",
            column: uniqueValueRenderer.field1,
            enum: uniqueValueRenderer.uniqueValueInfos.map((v, i) =>
              createStratumInstance(EnumOutlineSymbolTraits, {
                value: v.value,
                ...symbolStyles[i].outline
              })
            ),

            null: defaultSymbolStyle.outline
          })
        })
      ];
    } else if (rendererType === "classBreaks") {
      const classBreaksRenderer = renderer as ClassBreaksRenderer;

      if (classBreaksRenderer.visualVariables?.length) {
        console.warn(
          `WARNING: Terria does not support visual variables in ArcGisFeatureService ClassBreakRenderers`
        );
      }

      if (classBreaksRenderer.valueExpression) {
        console.warn(
          `WARNING: Terria does not support value expressions in ArcGisFeatureService ClassBreakRenderers`
        );
      }

      const symbolStyles = classBreaksRenderer.classBreakInfos.map((c) =>
        esriStyleToTableStyle(c.symbol, c.label)
      );

      const defaultSymbolStyle = esriStyleToTableStyle(
        classBreaksRenderer.defaultSymbol,
        undefined
      );

      // Only include color if there are any styles which aren't esriPMS
      const includeColor = !!classBreaksRenderer.classBreakInfos.find(
        (u) => u.symbol?.type !== "esriPMS"
      );

      return [
        createStratumInstance(TableStyleTraits, {
          id: "ESRI",
          hidden: false,
          color: includeColor
            ? createStratumInstance(TableColorStyleTraits, {
                mapType: "bin",
                colorColumn: classBreaksRenderer.field,
                binColors: symbolStyles.map((s) => s.color ?? ""),
                binMaximums: classBreaksRenderer.classBreakInfos.map(
                  (c) => c.classMaxValue
                ),
                nullColor: defaultSymbolStyle.color
              })
            : createStratumInstance(TableColorStyleTraits, {
                nullColor: "#FFFFFF"
              }),
          pointSize: createStratumInstance(TablePointSizeStyleTraits, {}),
          point: createStratumInstance(TablePointStyleTraits, {
            mapType: "bin",
            column: classBreaksRenderer.field,
            bin: classBreaksRenderer.classBreakInfos.map((c, i) =>
              createStratumInstance(BinPointSymbolTraits, {
                maxValue: c.classMaxValue,
                ...symbolStyles[i].point
              })
            ),
            null: defaultSymbolStyle.point
          }),
          outline: createStratumInstance(TableOutlineStyleTraits, {
            mapType: "bin",
            column: classBreaksRenderer.field,
            bin: classBreaksRenderer.classBreakInfos.map((c, i) =>
              createStratumInstance(BinOutlineSymbolTraits, {
                maxValue: c.classMaxValue,
                ...symbolStyles[i].outline
              })
            ),
            null: defaultSymbolStyle.outline
          })
        })
      ];
    } else {
      console.warn(
        `WARNING: Terria does not support ArcGisFeatureService renderers of type ${rendererType}`
      );
    }
  }

  // Map ESRI fields to Terria columns. This just sets the name, title and type of the column
  @computed get columns() {
    return (
      this._featureServer?.fields
        ?.filter((field) => {
          if (!fieldTypeToTableColumn[field.type]) {
            console.warn(
              `WARNING: Terria does not support ESRI field type ${field.type}`
            );
            return false;
          }
          return true;
        })
        .map((field) =>
          createStratumInstance(TableColumnTraits, {
            name: field.name,
            title: field.alias,
            type: fieldTypeToTableColumn[field.type]?.toString()
          })
        ) ?? []
    );
  }

  get featuresPerRequest() {
    return this._featureServer?.maxRecordCount;
  }

  get featuresPerTileRequest() {
    return this._featureServer?.tileMaxRecordCount;
  }

  get maxRecordCountFactor() {
    return this._featureServer?.maxRecordCountFactor;
  }

  get supportsQuantization() {
    return !!this._featureServer?.supportsCoordinatesQuantization;
  }

  /** Enable tileRequests by default if supported and no unsupported point/label styles are used */
  @computed get tileRequests() {
    if (this._item.forceCesiumPrimitives) return false;

    if (this._featureServer && supportsPbfTiles(this._featureServer)) {
      return !hasUnsupportedStylesForProtomaps(this._item);
    }

    // Without tiles that can be requested by time, the timeline needs every feature loaded
    if (this.hasTimeInfo) return false;

    return undefined;
  }

  /** MapServer layers don't have `objectIdField`, so fall back to the OID field */
  get objectIdField() {
    return (
      this._featureServer?.objectIdField ??
      this._featureServer?.fields?.find(
        (field) => field.type === "esriFieldTypeOID"
      )?.name
    );
  }

  // Add properties/columns to outFields if they are needed for styling. Otherwise, these properties won't be in tile features
  @computed get outFields() {
    return Array.from(
      new Set([
        this._item.objectIdField,
        this._item.activeTableStyle.tableColorMap.colorTraits.colorColumn,
        this._item.activeTableStyle.outlineStyleMap.traits?.column,
        this._item.activeTableStyle.pointStyleMap.traits?.column
      ])
    ).filter((t): t is string => !!t);
  }
}

function buildMetadataUrl(
  catalogItem: ArcGisFeatureServerCatalogItem,
  token: string | undefined
) {
  const url = new URI(catalogItem.url).addQuery("f", "json");
  if (token) {
    url.addQuery("token", token);
  }
  return proxyCatalogItemUrl(catalogItem, url.toString());
}

/** Web Mercator x at ±180° */
const WEB_MERCATOR_MAX_X = 20037508.342789244;

/** Whether a `Proj4Definitions` value is Web Mercator (wkid 3857, and 102100 which maps to it) */
function isWebMercator(proj4Definition: string) {
  return proj4Definition === "EPSG:3857" || proj4Definition === "EPSG:900913";
}

function supportsPbfTiles(featureServer: FeatureServer) {
  return (
    !!featureServer.supportsTilesAndBasicQueriesMode &&
    typeof featureServer.supportedQueryFormats === "string" &&
    featureServer.supportedQueryFormats.toLowerCase().includes("pbf")
  );
}

/**
 * Sorted distinct values of a date field, in epoch milliseconds. Undefined if the layer
 * can't return distinct values, or there are more than one response can hold.
 */
async function loadDistinctValues(
  catalogItem: ArcGisFeatureServerCatalogItem,
  featureServer: FeatureServer,
  token: string | undefined,
  field: string
): Promise<number[] | undefined> {
  if (!featureServer.advancedQueryCapabilities?.supportsDistinct) return;

  // `layerDef` is the older equivalent of `where` - see `buildEsriJsonUrl`
  const where =
    catalogItem.where === "1=1" ? catalogItem.layerDef : catalogItem.where;
  const url = new URI(catalogItem.url).segment("query").addQuery({
    f: "json",
    where,
    outFields: field,
    returnDistinctValues: true,
    returnGeometry: false,
    orderByFields: field
  });
  if (token) url.addQuery("token", token);

  try {
    const json = await loadJson(
      proxyCatalogItemUrl(catalogItem, url.toString())
    );
    if (json?.error || json?.exceededTransferLimit) return;
    return (json?.features ?? [])
      .map((feature: any) => feature.attributes?.[field])
      .filter((value: unknown): value is number => typeof value === "number");
  } catch {
    return;
  }
}

StratumOrder.addLoadStratum(ArcGisFeatureServerStratum.stratumName);
