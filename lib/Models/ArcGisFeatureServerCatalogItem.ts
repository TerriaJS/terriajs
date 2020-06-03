import i18next from "i18next";
import ArcGisFeatureServerCatalogItemTraits from "../Traits/ArcGisFeatureServerCatalogItemTraits";
import LoadableStratum from "./LoadableStratum";
import { BaseModel } from "./Model";
import StratumOrder from "./StratumOrder";
import UrlMixin from "../ModelMixins/UrlMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import CreateModel from "./CreateModel";
import Mappable from "./Mappable";
import { runInAction, computed } from "mobx";
import URI from "urijs";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import loadJson from "../Core/loadJson";
import featureDataToGeoJson from "../Map/featureDataToGeoJson";
import GeoJsonCatalogItem from "./GeoJsonCatalogItem";
import isDefined from "../Core/isDefined";
import CommonStrata from "./CommonStrata";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import Color from "terriajs-cesium/Source/Core/Color";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import createStratumInstance from "./createStratumInstance";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import StratumFromTraits from "./StratumFromTraits";
import LegendTraits, { LegendItemTraits } from "../Traits/LegendTraits";
import proj4definitions from "../Map/Proj4Definitions";
import { RectangleTraits } from "../Traits/MappableTraits";
import TerriaError from "../Core/TerriaError";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import ColorMaterialProperty from "terriajs-cesium/Source/DataSources/ColorMaterialProperty";
import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import replaceUnderscores from "../Core/replaceUnderscores";
import PolylineDashMaterialProperty from "terriajs-cesium/Source/DataSources/PolylineDashMaterialProperty";
import createInfoSection from "./createInfoSection";

const proj4 = require("proj4").default;

interface DocumentInfo {
  Author?: string;
}

type esriStyleTypes =
  | "esriPMS" // simple picture style
  | "esriSMS" // simple marker style
  | "esriSLS" // simple line style
  | "esriSFS"; // simple fill style

//as defined https://developers.arcgis.com/web-map-specification/objects/esriSLS_symbol/
type supportedLineStyle =
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
  | "esriSLSNull"; // line is not visible

type supportedFillStyle =
  | "esriSFSSolid" // fill line with color
  | "esriSFSNull"; // no fill

// as defined https://developers.arcgis.com/web-map-specification/objects/esriSMS_symbol/
type supportedSimpleMarkerStyle =
  | "esriSMSCircle"
  | "esriSMSCross"
  | "esriSMSDiamond"
  | "esriSMSSquare"
  | "esriSMSTriangle"
  | "esriSMSX";

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
  type: esriStyleTypes;
  style?: supportedSimpleMarkerStyle | supportedLineStyle | supportedFillStyle;
}

interface Outline {
  type: esriStyleTypes;
  color: number[];
  width: number;
  style?: supportedLineStyle;
}

interface Renderer {
  type: string;
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
}

interface SpatialReference {
  wkid?: string;
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
    private readonly _geoJsonItem: GeoJsonCatalogItem,
    private readonly _featureServer: FeatureServer
  ) {
    super();
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new FeatureServerStratum(
      newModel as ArcGisFeatureServerCatalogItem,
      this._geoJsonItem,
      this._featureServer
    ) as this;
  }

  get featureServerData(): FeatureServer {
    return this._featureServer;
  }

  get geoJsonItem(): GeoJsonCatalogItem {
    return this._geoJsonItem;
  }

  static async load(item: ArcGisFeatureServerCatalogItem) {
    if (!isDefined(item.url) || !isDefined(item.uri)) {
      return Promise.reject(
        new TerriaError({
          title: i18next.t(
            "models.arcGisFeatureServerCatalogItem.missingUrlTitle"
          ),
          message: i18next.t(
            "models.arcGisFeatureServerCatalogItem.missingUrlMessage"
          )
        })
      );
    }

    const geoJsonItem = new GeoJsonCatalogItem(createGuid(), item.terria);
    geoJsonItem.setTrait(
      CommonStrata.definition,
      "clampToGround",
      item.clampToGround
    );

    return Promise.resolve()
      .then(() => loadGeoJson(item))
      .then(geoJsonData => {
        geoJsonItem.setTrait(
          CommonStrata.definition,
          "geoJsonData",
          geoJsonData
        );
        return geoJsonItem.loadMetadata();
      })
      .then(() => {
        return loadMetadata(item);
      })
      .then(featureServer => {
        const stratum = new FeatureServerStratum(
          item,
          geoJsonItem,
          featureServer
        );
        return stratum;
      });
  }

  @computed get maximumScale(): number | undefined {
    return this._featureServer.maxScale;
  }

  @computed get name(): string | undefined {
    if (this._featureServer.name && this._featureServer.name.length > 0) {
      return replaceUnderscores(this._featureServer.name);
    }
  }

  @computed get dataCustodian(): string | undefined {
    if (
      this._featureServer.documentInfo &&
      this._featureServer.documentInfo.Author &&
      this._featureServer.documentInfo.Author.length > 0
    ) {
      return this._featureServer.documentInfo.Author;
    }
  }

  @computed get rectangle(): StratumFromTraits<RectangleTraits> | undefined {
    const extent = this._featureServer.extent;

    if (
      isDefined(extent) &&
      extent.spatialReference &&
      extent.spatialReference.wkid
    ) {
      const wkid = "EPSG:" + extent.spatialReference.wkid;
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
      createInfoSection(
        i18next.t("models.arcGisMapServerCatalogItem.dataDescription"),
        this._featureServer.description
      ),
      createInfoSection(
        i18next.t("models.arcGisMapServerCatalogItem.copyrightText"),
        this._featureServer.copyrightText
      )
    ];
  }

  @computed get legends(): StratumFromTraits<LegendTraits>[] | undefined {
    function newLegendItem(
      title: string,
      imageUrl?: string,
      color?: string,
      outlineColor?: string,
      addSpacingAbove?: boolean
    ): StratumFromTraits<LegendItemTraits> {
      const item = createStratumInstance(LegendItemTraits);
      runInAction(() => {
        item.title = title;
        item.imageUrl = imageUrl;
        item.color = color;
        item.outlineColor = outlineColor;
        item.addSpacingAbove = addSpacingAbove;
      });
      return item;
    }

    if (
      !this._item.useStyleInformationFromService ||
      !this._featureServer.drawingInfo
    ) {
      return undefined;
    }
    const renderer = this._featureServer.drawingInfo.renderer;
    const rendererType = renderer.type;
    let infos: SimpleRenderer[] | UniqueValueInfo[] | ClassBreakInfo[];

    if (rendererType === "uniqueValue") {
      infos = (<UniqueValueRenderer>renderer).uniqueValueInfos;
    } else if (rendererType === "classBreaks") {
      infos = (<ClassBreaksRenderer>renderer).classBreakInfos;
    } else if (rendererType === "simple") {
      infos = [<SimpleRenderer>renderer];
    } else {
      return undefined;
    }

    const legend = createStratumInstance(LegendTraits);
    runInAction(() => {
      legend.items = legend.items || [];
    });

    infos.forEach(info => {
      const label = replaceUnderscores(info.label);
      const symbol = info.symbol;
      if (symbol) {
        const color = symbol.color;
        const imageUrl = symbol.imageData
          ? proxyCatalogItemUrl(
              this,
              `data:${symbol.contentType};base64,${symbol.imageData}`
            )
          : undefined;
        const outlineColor = symbol.outline?.color;
        if (isDefined(legend.items)) {
          legend.items.push(
            newLegendItem(
              label,
              imageUrl,
              color
                ? convertEsriColorToCesiumColor(color).toCssColorString()
                : undefined,
              outlineColor
                ? convertEsriColorToCesiumColor(outlineColor).toCssColorString()
                : undefined
            )
          );
        }
      }
    });
    return [legend];
  }
}

StratumOrder.addLoadStratum(FeatureServerStratum.stratumName);

export default class ArcGisFeatureServerCatalogItem
  extends AsyncMappableMixin(
    UrlMixin(
      CatalogMemberMixin(CreateModel(ArcGisFeatureServerCatalogItemTraits))
    )
  )
  implements Mappable {
  static readonly type = "esri-featureServer";

  get type(): string {
    return ArcGisFeatureServerCatalogItem.type;
  }

  get typeName(): string {
    return i18next.t("models.arcGisFeatureServerCatalogItem.name");
  }

  get isMappable(): boolean {
    return true;
  }

  get canZoomTo(): boolean {
    return true;
  }

  get showsInfo(): boolean {
    return true;
  }

  protected forceLoadMetadata(): Promise<void> {
    return FeatureServerStratum.load(this).then(stratum => {
      runInAction(() => {
        this.strata.set(FeatureServerStratum.stratumName, stratum);
      });
    });
  }

  protected forceLoadMapItems(): Promise<void> {
    const that = this;
    return that.loadMetadata().then(() => {
      if (isDefined(that.geoJsonItem)) {
        return that.geoJsonItem.loadMapItems().then(() => {
          const featureServerData = that.featureServerData;
          if (
            that.useStyleInformationFromService &&
            featureServerData &&
            featureServerData.drawingInfo
          ) {
            const renderer = featureServerData.drawingInfo.renderer;
            const rendererType = renderer.type;
            that.mapItems.forEach(mapItem => {
              const entities = mapItem.entities;
              entities.suspendEvents();

              // A 'simple' renderer only applies a single style to all features
              if (rendererType === "simple") {
                const simpleRenderer = <SimpleRenderer>renderer;
                const symbol = simpleRenderer.symbol;
                if (symbol) {
                  entities.values.forEach(function(entity) {
                    updateEntityWithEsriStyle(entity, symbol, that);
                  });
                }

                // For a 'uniqueValue' renderer symbology gets applied via feature properties.
              } else if (renderer.type === "uniqueValue") {
                const uniqueValueRenderer = <UniqueValueRenderer>renderer;
                const rendererObj = setupUniqueValueRenderer(
                  uniqueValueRenderer
                );
                entities.values.forEach(function(entity) {
                  const symbol = getUniqueValueSymbol(
                    entity,
                    uniqueValueRenderer,
                    rendererObj
                  );
                  if (symbol) {
                    updateEntityWithEsriStyle(entity, symbol, that);
                  }
                });

                // For a 'classBreaks' renderer symbology gets applied via classes or ranges of data.
              } else if (renderer.type === "classBreaks") {
                const classBreaksRenderer = <ClassBreaksRenderer>renderer;
                entities.values.forEach(function(entity) {
                  const symbol = getClassBreaksSymbol(
                    entity,
                    classBreaksRenderer
                  );
                  if (symbol) {
                    updateEntityWithEsriStyle(entity, symbol, that);
                  }
                });
              }

              entities.resumeEvents();
            });
          }

          return Promise.resolve();
        });
      }
    });
  }

  @computed get geoJsonItem(): GeoJsonCatalogItem | undefined {
    const stratum = <FeatureServerStratum>(
      this.strata.get(FeatureServerStratum.stratumName)
    );
    return isDefined(stratum) ? stratum.geoJsonItem : undefined;
  }

  @computed get featureServerData(): FeatureServer | undefined {
    const stratum = <FeatureServerStratum>(
      this.strata.get(FeatureServerStratum.stratumName)
    );
    return isDefined(stratum) ? stratum.featureServerData : undefined;
  }

  @computed get mapItems() {
    if (isDefined(this.geoJsonItem)) {
      return this.geoJsonItem.mapItems.map(mapItem => {
        mapItem.show = this.show;
        return mapItem;
      });
    }
    return [];
  }
}

function setupUniqueValueRenderer(renderer: UniqueValueRenderer) {
  const out: any = {};
  for (var i = 0; i < renderer.uniqueValueInfos.length; i++) {
    const val = renderer.uniqueValueInfos[i].value;
    out[val] = renderer.uniqueValueInfos[i];
  }
  return out;
}

function getUniqueValueSymbol(
  entity: Entity,
  uniqueValueRenderer: UniqueValueRenderer,
  rendererObj: any
): Symbol | null {
  let entityUniqueValue = entity.properties[
    uniqueValueRenderer.field1
  ].getValue();

  // accumulate values if there is more than one field defined
  if (uniqueValueRenderer.fieldDelimiter && uniqueValueRenderer.field2) {
    const val2 = entity.properties[uniqueValueRenderer.field2].getValue();

    if (val2) {
      entityUniqueValue += uniqueValueRenderer.fieldDelimiter + val2;

      if (uniqueValueRenderer.field3) {
        const val3 = entity.properties[uniqueValueRenderer.field3].getValue();

        if (val3) {
          entityUniqueValue += uniqueValueRenderer.fieldDelimiter + val3;
        }
      }
    }
  }

  const uniqueValueInfo = rendererObj[entityUniqueValue];

  if (uniqueValueInfo && uniqueValueInfo.symbol) {
    return uniqueValueInfo.symbol;
  } else {
    return uniqueValueRenderer.defaultSymbol;
  }
}

function getClassBreaksSymbol(
  entity: Entity,
  classBreaksRenderer: ClassBreaksRenderer
): Symbol | null {
  const entityValue = entity.properties[classBreaksRenderer.field].getValue();
  for (var i = 0; i < classBreaksRenderer.classBreakInfos.length; i++) {
    if (entityValue <= classBreaksRenderer.classBreakInfos[i].classMaxValue) {
      return classBreaksRenderer.classBreakInfos[i].symbol;
    }
  }

  return classBreaksRenderer.defaultSymbol;
}

function convertEsriColorToCesiumColor(esriColor: number[]): Color {
  return Color.fromBytes(
    esriColor[0],
    esriColor[1],
    esriColor[2],
    esriColor[3]
  );
}

function updateEntityWithEsriStyle(
  entity: Entity,
  symbol: Symbol,
  catalogItem: ArcGisFeatureServerCatalogItem
): void {
  // type of geometry is point and the applied style is image
  // TO DO: tweek the svg support
  if (symbol.type === "esriPMS") {
    // Replace a general Cesium Point with a billboard
    if (entity.point && symbol.imageData) {
      entity.billboard = new BillboardGraphics({
        image: proxyCatalogItemUrl(
          catalogItem,
          `data:${symbol.contentType};base64,${symbol.imageData}`
        ),
        heightReference: catalogItem.clampToGround
          ? HeightReference.RELATIVE_TO_GROUND
          : undefined,
        width: symbol.width,
        height: symbol.height,
        rotation: symbol.angle
      });

      if (symbol.xoffset || symbol.yoffset) {
        const x = isDefined(symbol.xoffset) ? symbol.xoffset : 0;
        const y = isDefined(symbol.yoffset) ? symbol.yoffset : 0;
        entity.billboard.pixelOffset = new Cartesian3(x, y);
      }

      entity.point.show = new ConstantProperty(false);
    }
  } else if (symbol.type === "esriSMS") {
    // Update the styling of the Cesium Point
    if (entity.point && symbol.color) {
      entity.point.color = new ConstantProperty(
        convertEsriColorToCesiumColor(symbol.color)
      );
      entity.point.pixelSize = new ConstantProperty(symbol.size);

      if (symbol.outline) {
        entity.point.outlineColor = new ConstantProperty(
          convertEsriColorToCesiumColor(symbol.outline.color)
        );
        entity.point.outlineWidth = new ConstantProperty(symbol.outline.width);
      }
    }
  } else if (symbol.type === "esriSLS") {
    /* Update the styling of the Cesium Polyline */
    if (entity.polyline && symbol.color) {
      if (isDefined(symbol.width)) {
        entity.polyline.width = new ConstantProperty(symbol.width);
      }
      /* 
        For line containing dashes PolylineDashMaterialProperty is used. 
        Definition is done using the line patterns converted from hex to decimal dashPattern.
        Source for some of the line patterns is https://www.opengl.org.ru/docs/pg/0204.html, others are created manually
      */
      esriPolylineStyle(entity, symbol);
    }
  } else if (symbol.type === "esriSFS") {
    // Update the styling of the Cesium Polygon
    if (entity.polygon && symbol.color) {
      const color = symbol.color;

      // feature picking doesn't work when the polygon interior is transparent, so
      // use an almost-transparent color instead
      if (color[3] === 0) {
        color[3] = 1;
      }
      entity.polygon.material = convertEsriColorToCesiumColor(color);

      if (symbol.outline && symbol.outline.color) {
        /* It can actually happen that entity has both polygon and polyline defined at same time,
            check the implementation of GeoJsonCatalogItem for details. */
        entity.polygon.outlineColor = convertEsriColorToCesiumColor(
          symbol.outline.color
        );
        entity.polygon.outlineWidth = new ConstantProperty(
          symbol.outline.width
        );
        if (entity.polyline) {
          esriPolylineStyle(entity, symbol.outline);
          entity.polyline.width = new ConstantProperty(symbol.outline.width);
        }
      }
    }
  }
}

function esriPolylineStyle(entity: Entity, symbol: Symbol | Outline): void {
  if (symbol.style === "esriSFSSolid") {
    // it is simple line just define color
    entity.polyline.material = new ColorMaterialProperty(
      convertEsriColorToCesiumColor(symbol.color!)
    );
  } else if (symbol.style === "esriSLSDash") {
    // default PolylineDashMaterialProperty is dashed line ` -` (0x00FF)
    entity.polyline.material = new PolylineDashMaterialProperty({
      color: convertEsriColorToCesiumColor(symbol.color!)
    });
  } else if (symbol.style === "esriSLSDot") {
    // "   -"
    entity.polyline.material = new PolylineDashMaterialProperty({
      color: convertEsriColorToCesiumColor(symbol.color!),
      dashPattern: new ConstantProperty(7)
    });
  } else if (symbol.style === "esriSLSDashDot") {
    // "   ----   -"
    entity.polyline.material = new PolylineDashMaterialProperty({
      color: convertEsriColorToCesiumColor(symbol.color!),
      dashPattern: new ConstantProperty(2017)
    });
  } else if (symbol.style === "esriSLSDashDotDot") {
    // '  --------   -   - '
    entity.polyline.material = new PolylineDashMaterialProperty({
      color: convertEsriColorToCesiumColor(symbol.color!),
      dashPattern: new ConstantProperty(16273)
    });
  } else if (symbol.style === "esriSLSLongDash") {
    // '   --------'
    entity.polyline.material = new PolylineDashMaterialProperty({
      color: convertEsriColorToCesiumColor(symbol.color!),
      dashLength: new ConstantProperty(2047)
    });
  } else if (symbol.style === "esriSLSLongDashDot") {
    // '   --------   -'
    entity.polyline.material = new PolylineDashMaterialProperty({
      color: convertEsriColorToCesiumColor(symbol.color!),
      dashPattern: new ConstantProperty(4081)
    });
  } else if (symbol.style === "esriSLSShortDash") {
    //' ----'
    entity.polyline.material = new PolylineDashMaterialProperty({
      color: convertEsriColorToCesiumColor(symbol.color!),
      dashPattern: new ConstantProperty(4095)
    });
  } else if (symbol.style === "esriSLSShortDashDot") {
    //' ---- -'
    entity.polyline.material = new PolylineDashMaterialProperty({
      color: convertEsriColorToCesiumColor(symbol.color!),
      dashPattern: new ConstantProperty(8179)
    });
  } else if (symbol.style === "esriSLSShortDashDotDot") {
    //' ---- - -'
    entity.polyline.material = new PolylineDashMaterialProperty({
      color: convertEsriColorToCesiumColor(symbol.color!),
      dashPattern: new ConstantProperty(16281)
    });
  } else if (symbol.style === "esriSLSShortDot") {
    //' - - - -'
    entity.polyline.material = new PolylineDashMaterialProperty({
      color: convertEsriColorToCesiumColor(symbol.color!),
      dashPattern: new ConstantProperty(13107)
    });
  } else if (symbol.style === "esriSLSNull") {
    entity.polyline.show = new ConstantProperty(false);
  } else {
    // we don't know how to handle style make it default
    entity.polyline.material = new ColorMaterialProperty(
      convertEsriColorToCesiumColor(symbol.color!)
    );
  }
}

function loadGeoJson(catalogItem: ArcGisFeatureServerCatalogItem) {
  return loadJson(buildGeoJsonUrl(catalogItem)).then(function(json) {
    return featureDataToGeoJson(json.layers[0]);
  });
}

function loadMetadata(catalogItem: ArcGisFeatureServerCatalogItem) {
  const metaUrl = buildMetadataUrl(catalogItem);
  return loadJson(metaUrl).then(function(json) {
    return json;
  });
}

function buildMetadataUrl(catalogItem: ArcGisFeatureServerCatalogItem) {
  return proxyCatalogItemUrl(
    catalogItem,
    new URI(catalogItem.url).addQuery("f", "json").toString()
  );
}

function buildGeoJsonUrl(catalogItem: ArcGisFeatureServerCatalogItem) {
  const url = cleanUrl(catalogItem.url || "0d");
  const urlComponents = splitLayerIdFromPath(url);
  const layerId = urlComponents.layerId;

  if (!isDefined(layerId)) {
    throw new TerriaError({
      title: i18next.t(
        "models.arcGisFeatureServerCatalogItem.invalidServiceTitle"
      ),
      message: i18next.t(
        "models.arcGisFeatureServerCatalogItem.invalidServiceMessage"
      )
    });
  }

  return proxyCatalogItemUrl(
    catalogItem,
    new URI(urlComponents.urlWithoutLayerId)
      .segment("query")
      .addQuery("f", "json")
      .addQuery("layerDefs", "{" + layerId + ':"' + catalogItem.layerDef + '"}')
      .toString()
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
