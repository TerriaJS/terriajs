import { Geometry, GeometryCollection, Properties } from "@turf/helpers";
import i18next from "i18next";
import { computed, runInAction } from "mobx";
import Color from "terriajs-cesium/Source/Core/Color";
import URI from "urijs";
import isDefined from "../../../Core/isDefined";
import loadJson from "../../../Core/loadJson";
import replaceUnderscores from "../../../Core/replaceUnderscores";
import { networkRequestError } from "../../../Core/TerriaError";
import featureDataToGeoJson from "../../../Map/PickedFeatures/featureDataToGeoJson";
import proj4definitions from "../../../Map/Vector/Proj4Definitions";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import GeoJsonMixin, {
  FeatureCollectionWithCrs
} from "../../../ModelMixins/GeojsonMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import ArcGisFeatureServerCatalogItemTraits from "../../../Traits/TraitsClasses/ArcGisFeatureServerCatalogItemTraits";
import { InfoSectionTraits } from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import { RectangleTraits } from "../../../Traits/TraitsClasses/MappableTraits";
import TableColorStyleTraits, {
  EnumColorTraits
} from "../../../Traits/TraitsClasses/Table/ColorStyleTraits";
import TableOutlineStyleTraits, {
  BinOutlineSymbolTraits,
  EnumOutlineSymbolTraits,
  OutlineSymbolTraits
} from "../../../Traits/TraitsClasses/Table/OutlineStyleTraits";
import TablePointSizeStyleTraits from "../../../Traits/TraitsClasses/Table/PointSizeStyleTraits";
import TablePointStyleTraits, {
  BinPointSymbolTraits,
  EnumPointSymbolTraits,
  PointSymbolTraits
} from "../../../Traits/TraitsClasses/Table/PointStyleTraits";
import TableStyleTraits from "../../../Traits/TraitsClasses/Table/StyleTraits";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import StratumOrder from "../../Definition/StratumOrder";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

const proj4 = require("proj4").default;

interface DocumentInfo {
  Author?: string;
}

type EsriStyleTypes =
  | "esriPMS" // simple picture style
  | "esriSMS" // simple marker style
  | "esriSLS" // simple line style
  | "esriSFS"; // simple fill style

//as defined https://developers.arcgis.com/web-map-specification/objects/esriSLS_symbol/

type SupportedFillStyle =
  | "esriSFSSolid" // fill line with color
  | "esriSFSNull"; // no fill

// as defined https://developers.arcgis.com/web-map-specification/objects/esriSMS_symbol/
type SupportedSimpleMarkerStyle =
  | "esriSMSCircle"
  | "esriSMSCross"
  | "esriSMSDiamond"
  | "esriSMSSquare"
  | "esriSMSTriangle"
  | "esriSMSX";

/** Terria only supports solid lines at the moment*/
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

// See actual Symbol at https://developers.arcgis.com/web-map-specification/objects/symbol/
interface Symbol {
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
  style?: SupportedSimpleMarkerStyle | SupportedLineStyle | SupportedFillStyle;
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
  defaultSymbol: Symbol | null;
}

interface UniqueValueInfo extends SimpleRenderer {
  value: string;
}

/** Terria only supports `field1`, not multiple fields (`field2` or `field3`).
 * See https://developers.arcgis.com/web-map-specification/objects/uniqueValueRenderer/
 */
interface UniqueValueRenderer extends Renderer {
  field1: string;
  field2?: string;
  field3?: string;
  fieldDelimiter?: string;
  uniqueValueInfos: UniqueValueInfo[];
  defaultSymbol: Symbol | null;
}

interface SimpleRenderer extends Renderer {
  label?: string;
  symbol: Symbol | null;
}

interface DrawingInfo {
  renderer: Renderer;
}

interface FeatureServer {
  documentInfo?: DocumentInfo;
  name?: string;
  description?: string;
  copyrightText?: string;
  drawingInfo?: DrawingInfo;
  extent?: Extent;
  maxScale?: number;
  advancedQueryCapabilities?: {
    supportsPagination: boolean;
  };
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

class FeatureServerStratum extends LoadableStratum(
  ArcGisFeatureServerCatalogItemTraits
) {
  static stratumName = "featureServer";

  constructor(
    private readonly _item: ArcGisFeatureServerCatalogItem,
    private readonly _featureServer?: FeatureServer,
    private _esriJson?: any
  ) {
    super();
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new FeatureServerStratum(
      newModel as ArcGisFeatureServerCatalogItem,
      this._esriJson
    ) as this;
  }

  @computed
  get featureServerData(): FeatureServer | undefined {
    return this._featureServer;
  }

  static async load(
    item: ArcGisFeatureServerCatalogItem
  ): Promise<FeatureServerStratum> {
    if (item.url === undefined) {
      new FeatureServerStratum(item, undefined, undefined);
    }
    const metaUrl = buildMetadataUrl(item);
    const featureServer = await loadJson(metaUrl);

    const stratum = new FeatureServerStratum(item, featureServer, undefined);

    return stratum;
  }

  @computed
  get shortReport(): string | undefined {
    // Show notice if reached
    if (
      this._item.readyData?.features !== undefined &&
      this._item.readyData!.features.length >= this._item.maxFeatures
    ) {
      return i18next.t(
        "models.arcGisFeatureServerCatalogItem.reachedMaxFeatureLimit",
        this._item
      );
    }
    return undefined;
  }

  @computed get maximumScale(): number | undefined {
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
      if (!isDefined((proj4definitions as any)[wkid])) {
        return undefined;
      }

      const source = new proj4.Proj((proj4definitions as any)[wkid]);
      const dest = new proj4.Proj("EPSG:4326");

      let p = proj4(source, dest, [extent.xmin, extent.ymin]);

      const west = p[0];
      const south = p[1];

      p = proj4(source, dest, [extent.xmax, extent.ymax]);

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
        name: i18next.t("models.arcGisMapServerCatalogItem.dataDescription"),
        content: this._featureServer?.description
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.arcGisMapServerCatalogItem.copyrightText"),
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

  @computed get styles() {
    const renderer = this._featureServer?.drawingInfo?.renderer;

    if (!renderer) return [];

    const rendererType = renderer.type;

    if (rendererType === "simple") {
      const simpleRenderer = <SimpleRenderer>renderer;
      const symbol = simpleRenderer.symbol;

      if (!symbol) return [];

      const symbolStyle = esriSymbolToTableStyle(symbol, simpleRenderer.label);
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
      const uniqueValueRenderer = <UniqueValueRenderer>renderer;

      const symbolStyles = uniqueValueRenderer.uniqueValueInfos.map((v) => {
        return esriSymbolToTableStyle(v.symbol, v.label);
      });

      const defaultSymbolStyle = esriSymbolToTableStyle(
        uniqueValueRenderer.defaultSymbol
      );

      // Only include color if there are any styles which aren't esriPMS
      const includeColor = !!uniqueValueRenderer.uniqueValueInfos.find(
        (u) => u.symbol?.type !== "esriPMS"
      );

      if (uniqueValueRenderer.field2 || uniqueValueRenderer.field3) {
        console.log(
          `WARNING: Terria only supports ArcGisFeatureService UniqueValueRenderers with a single field (\`field1\`), not multiple fields (\`field2\` or \`field3\`)`
        );
      }

      return [
        createStratumInstance(TableStyleTraits, {
          id: "ESRI",
          hidden: false,
          color: includeColor
            ? createStratumInstance(TableColorStyleTraits, {
                colorColumn: uniqueValueRenderer.field1,
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
    } else {
      const classBreaksRenderer = <ClassBreaksRenderer>renderer;

      const symbolStyles = classBreaksRenderer.classBreakInfos.map((c) =>
        esriSymbolToTableStyle(c.symbol, c.label)
      );

      const defaultSymbolStyle = esriSymbolToTableStyle(
        classBreaksRenderer.defaultSymbol
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
    }
  }
}

StratumOrder.addLoadStratum(FeatureServerStratum.stratumName);

export default class ArcGisFeatureServerCatalogItem extends GeoJsonMixin(
  UrlMixin(
    CatalogMemberMixin(CreateModel(ArcGisFeatureServerCatalogItemTraits))
  )
) {
  static readonly type = "esri-featureServer";

  get type(): string {
    return ArcGisFeatureServerCatalogItem.type;
  }

  get typeName(): string {
    return i18next.t("models.arcGisFeatureServerCatalogItem.name");
  }

  protected async forceLoadMetadata(): Promise<void> {
    if (this.strata.get(FeatureServerStratum.stratumName) === undefined) {
      const stratum = await FeatureServerStratum.load(this);
      runInAction(() => {
        this.strata.set(FeatureServerStratum.stratumName, stratum);
      });
    }
  }

  protected async forceLoadGeojsonData(): Promise<
    FeatureCollectionWithCrs<Geometry | GeometryCollection, Properties>
  > {
    const getEsriLayerJson = async (resultOffset?: number) =>
      await loadJson(this.buildEsriJsonUrl(resultOffset));

    if (!this.supportsPagination) {
      // Make a single request without pagination
      return (
        featureDataToGeoJson(await getEsriLayerJson()) ?? {
          type: "FeatureCollection",
          features: []
        }
      );
    }

    // Esri Feature Servers have a maximum limit to how many features they'll return at once, so for a service with many
    // features, we have to make multiple requests. We can't figure out how many features we need to request ahead of
    // time (there's an API for it but it times out for services with thousands of features), so we just keep trying
    // until we run out of features or hit the limit
    const featuresPerRequest = this.featuresPerRequest;
    const maxFeatures = this.maxFeatures;
    let combinedEsriLayerJson = await getEsriLayerJson(0);

    const mapObjectIds = (features: any) =>
      features.map(
        (feature: any) =>
          feature.attributes.OBJECTID ?? feature.attributes.objectid
      );
    const seenIDs: Set<string> = new Set(
      mapObjectIds(combinedEsriLayerJson.features)
    );

    let currentOffset = 0;
    let exceededTransferLimit = combinedEsriLayerJson.exceededTransferLimit;
    while (
      combinedEsriLayerJson.features.length <= maxFeatures &&
      exceededTransferLimit === true
    ) {
      currentOffset += featuresPerRequest;
      const newEsriLayerJson = await getEsriLayerJson(currentOffset);
      if (
        newEsriLayerJson.features === undefined ||
        newEsriLayerJson.features.length === 0
      ) {
        break;
      }

      const newIds: string[] = mapObjectIds(newEsriLayerJson.features);

      if (newIds.every((id: string) => seenIDs.has(id))) {
        // We're getting data that we've received already, assume have everything we need and stop fetching
        break;
      }

      newIds.forEach((id) => seenIDs.add(id));
      combinedEsriLayerJson.features = combinedEsriLayerJson.features.concat(
        newEsriLayerJson.features
      );
      exceededTransferLimit = newEsriLayerJson.exceededTransferLimit;
    }

    return (
      featureDataToGeoJson(combinedEsriLayerJson) ?? {
        type: "FeatureCollection",
        features: []
      }
    );
  }

  @computed get featureServerData(): FeatureServer | undefined {
    const stratum = <FeatureServerStratum>(
      this.strata.get(FeatureServerStratum.stratumName)
    );
    return isDefined(stratum) ? stratum.featureServerData : undefined;
  }

  /**
   * Constructs the url for a request to a feature server
   * @param resultOffset Allows for pagination of results.
   *  See https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-layer-.htm
   */
  buildEsriJsonUrl(resultOffset?: number) {
    const url = cleanUrl(this.url || "0d");
    const urlComponents = splitLayerIdFromPath(url);
    const layerId = urlComponents.layerId;

    if (!isDefined(layerId)) {
      throw networkRequestError({
        title: i18next.t(
          "models.arcGisFeatureServerCatalogItem.invalidServiceTitle"
        ),
        message: i18next.t(
          "models.arcGisFeatureServerCatalogItem.invalidServiceMessage"
        )
      });
    }

    // We used to make a call to a different ArcGIS API endpoint
    // (https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-.htm) which took a
    // `layerdef` parameter, which is more or less equivalent to `where`. To avoid breaking old catalog items, we need
    // to use `layerDef` if `where` hasn't been set
    const where = this.where === "1=1" ? this.layerDef : this.where;

    const uri = new URI(url)
      .segment("query")
      .addQuery("f", "json")
      .addQuery("where", where)
      .addQuery("outFields", "*")
      .addQuery("outSR", "4326");

    if (resultOffset !== undefined) {
      // Pagination specific parameters
      uri
        .addQuery("resultRecordCount", this.featuresPerRequest)
        .addQuery("resultOffset", resultOffset);
    }

    return proxyCatalogItemUrl(this, uri.toString());
  }
}

export function convertEsriColorToCesiumColor(
  esriColor?: null | number[] | undefined
): Color | undefined {
  if (!esriColor) return;
  return Color.fromBytes(
    esriColor[0],
    esriColor[1],
    esriColor[2],
    esriColor[3]
  );
}

// ESRI uses points for styling while cesium uses pixels
export function convertEsriPointSizeToPixels(pointSize?: number) {
  if (!isDefined(pointSize)) return undefined;
  // 1 px = 0.75 point
  // 1 point = 4/3 point
  return (pointSize * 4) / 3;
}

function buildMetadataUrl(catalogItem: ArcGisFeatureServerCatalogItem) {
  return proxyCatalogItemUrl(
    catalogItem,
    new URI(catalogItem.url).addQuery("f", "json").toString()
  );
}

function splitLayerIdFromPath(url: string) {
  const regex = /^(.*FeatureServer)\/(\d+)/;
  const matches = url.match(regex);
  if (isDefined(matches) && matches !== null && matches.length > 2) {
    return {
      layerId: matches[2],
      urlWithoutLayerId: matches[1]
    };
  }
  return {
    urlWithoutLayerId: url
  };
}

function cleanUrl(url: string): string {
  // Strip off the search portion of the URL
  const uri = new URI(url);
  uri.search("");
  return uri.toString();
}

function esriSymbolToTableStyle(
  symbol?: Symbol | null,
  label?: string | undefined
) {
  if (!symbol) return {};
  return {
    // For esriPMS - just use white color
    // This is so marker icons aren't colored by default
    color:
      symbol.type === "esriPMS"
        ? "#FFFFFF"
        : convertEsriColorToCesiumColor(symbol.color)?.toCssColorString(),
    pointSize: createStratumInstance(TablePointSizeStyleTraits, {}),
    point: createStratumInstance(PointSymbolTraits, {
      marker:
        symbol.type === "esriPMS"
          ? `data:${symbol.contentType};base64,${symbol.imageData}`
          : convertEsriMarkerToMaki(symbol.style),
      // symbol.size is used by "esriSMS"
      // height and width is used by "esriPMS"
      height:
        convertEsriPointSizeToPixels(symbol.size) ??
        convertEsriPointSizeToPixels(symbol.height),
      width:
        convertEsriPointSizeToPixels(symbol.size) ??
        convertEsriPointSizeToPixels(symbol.width),
      rotation: symbol.angle,
      pixelOffset: [symbol.xoffset ?? 0, symbol.yoffset ?? 0],
      legendTitle: label || undefined
    }),
    outline:
      symbol.outline?.style !== "esriSLSNull"
        ? createStratumInstance(OutlineSymbolTraits, {
            color: convertEsriColorToCesiumColor(
              symbol.outline?.color
            )?.toCssColorString(),
            // Use width if Line style
            width:
              symbol.type === "esriSLS"
                ? convertEsriPointSizeToPixels(symbol.width)
                : convertEsriPointSizeToPixels(symbol.outline?.width),
            legendTitle: label || undefined
          })
        : undefined
  };
}

function convertEsriMarkerToMaki(
  esri: SupportedSimpleMarkerStyle | string | undefined
): string {
  switch (esri) {
    case "esriSMSCross":
      return "hospital";
    case "esriSMSDiamond":
      return "diamond";
    case "esriSMSSquare":
      return "square";
    case "esriSMSTriangle":
      return "triangle";
    case "esriSMSX":
      return "cross";
    case "esriSMSCircle":
    default:
      return "point";
  }
}
