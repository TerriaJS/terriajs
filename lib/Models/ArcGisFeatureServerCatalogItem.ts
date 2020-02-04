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
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
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

const proj4 = require("proj4").default;

interface DocumentInfo {
  author?: string;
}

// TODO. see actual Symbol at https://developers.arcgis.com/javascript/latest/api-reference/esri-symbols-Symbol.html
interface Symbol {
  contentType: string;
  color?: number[];
  outline?: any;
  outlineColor?: number[];
  imageData?: any;
  xoffset?: number;
  yoffset?: number;
  width?: number;
  height?: number;
  angle?: number;
  size?: number;
}

interface Renderer {
  type: string;
}

interface ClassBreakInfo {
  classMaxValue: number;
  classMinValue?: number;
  label?: string;
  symbol: Symbol;
}

interface ClassBreaksRenderer extends Renderer {
  field: string;
  classBreakInfos: ClassBreakInfo[];
  defaultSymbol: Symbol;
}

interface UniqueValueInfo {
  value: string;
  label?: string;
  symbol: Symbol;
}

interface UniqueValueRenderer extends Renderer {
  field1: string;
  field2?: string;
  field3?: string;
  fieldDelimiter?: string;
  uniqueValueInfos: UniqueValueInfo[];
  defaultSymbol: Symbol;
}

interface SimpleRenderer extends Renderer {
  label?: string;
  symbol: Symbol;
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

  get featureServerData() {
    return this._featureServer;
  }

  get geoJsonItem() {
    return this._geoJsonItem;
  }

  static async load(item: ArcGisFeatureServerCatalogItem) {
    if (!isDefined(item.uri)) {
      throw new TerriaError({
        title: i18next.t(
          "models.arcGisFeatureServerCatalogItem.invalidUrlTitle"
        ),
        message: i18next.t(
          "models.arcGisFeatureServerCatalogItem.invalidUrlMessage"
        )
      });
    }

    const geoJsonItem = new GeoJsonCatalogItem(createGuid(), item.terria);
    geoJsonItem.setTrait(
      CommonStrata.definition,
      "clampToGround",
      item.clampToGround
    );

    return loadGeoJson(item)
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

  @computed get maximumScale() {
    return this._featureServer.maxScale;
  }

  @computed get name() {
    if (this._featureServer.name && this._featureServer.name.length > 0) {
      return this._featureServer.name;
    }
  }

  @computed get dataCustodian() {
    if (
      this._featureServer.documentInfo &&
      this._featureServer.documentInfo.author &&
      this._featureServer.documentInfo.author.length > 0
    ) {
      return this._featureServer.documentInfo.author;
    }
  }

  @computed get rectangle() {
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
    function newInfo(name: string, content?: string) {
      const traits = createStratumInstance(InfoSectionTraits);
      runInAction(() => {
        traits.name = name;
        traits.content = content;
      });
      return traits;
    }

    return [
      newInfo(
        i18next.t("models.arcGisMapServerCatalogItem.dataDescription"),
        this._featureServer.description
      ),
      newInfo(
        i18next.t("models.arcGisMapServerCatalogItem.copyrightText"),
        this._featureServer.copyrightText
      )
    ];
  }

  @computed get legends(): StratumFromTraits<LegendTraits>[] | undefined {
    if (
      !this._item.useStyleInformationFromService ||
      !this._featureServer.drawingInfo
    ) {
      return undefined;
    }
    const renderer = this._featureServer.drawingInfo.renderer;
    const rendererType = renderer.type;

    if (rendererType === "classBreaks") {
      const classBreaksRenderer = <ClassBreaksRenderer>(
        this._featureServer.drawingInfo.renderer
      );

      const items = [];
      for (var i = 0; i < classBreaksRenderer.classBreakInfos.length; i++) {
        const label = classBreaksRenderer.classBreakInfos[i].label;
        const color = classBreaksRenderer.classBreakInfos[i].symbol.color;
        if (color) {
          const item = {
            title: label,
            color: convertEsriColorToCesiumColor(color).toCssColorString()
          };
          items.push(item);
        }
      }
      const legend = <StratumFromTraits<LegendTraits>>(
        (<unknown>{ items: items })
      );
      return [legend];
    }

    return undefined;
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

  get type() {
    return ArcGisFeatureServerCatalogItem.type;
  }

  get typeName() {
    return i18next.t("models.arcGisFeatureServerCatalogItem.name");
  }

  get isMappable() {
    return true;
  }

  get canZoomTo() {
    return true;
  }

  get showsInfo() {
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
                entities.values.forEach(function(entity) {
                  updateEntityWithEsriStyle(
                    entity,
                    simpleRenderer.symbol,
                    that
                  );
                });

                // For a 'uniqueValue' renderer symbology gets applied via feature properties.
              } else if (renderer.type === "uniqueValue") {
                const uniqueValueRenderer = <UniqueValueRenderer>renderer;
                const rendererObj = setupUniqueValRenderer(uniqueValueRenderer);

                const primaryFieldForSymbology = uniqueValueRenderer.field1;

                entities.values.forEach(function(entity) {
                  let symbolName = entity.properties[
                    primaryFieldForSymbology
                  ].getValue();

                  // accumulate values if there is more than one field defined
                  if (
                    uniqueValueRenderer.fieldDelimiter &&
                    uniqueValueRenderer.field2
                  ) {
                    let val2 = entity.properties[
                      uniqueValueRenderer.field2
                    ].getValue();

                    if (val2) {
                      symbolName += uniqueValueRenderer.fieldDelimiter + val2;

                      if (uniqueValueRenderer.field3) {
                        let val3 = entity.properties[
                          uniqueValueRenderer.field3
                        ].getValue();

                        if (val3) {
                          symbolName +=
                            uniqueValueRenderer.fieldDelimiter + val3;
                        }
                      }
                    }
                  }

                  let symbol: Symbol | undefined =
                    rendererObj[symbolName].symbol;
                  if (symbol === undefined || symbol === null) {
                    symbol = uniqueValueRenderer.defaultSymbol;
                  }

                  updateEntityWithEsriStyle(entity, symbol, that);
                });
              } else if (renderer.type === "classBreaks") {
                const classBreaksRenderer = <ClassBreaksRenderer>renderer;
                const field = classBreaksRenderer.field;

                entities.values.forEach(function(entity) {
                  let symbol: Symbol | undefined;
                  let entityValue = entity.properties[field].getValue();

                  for (
                    var i = 0;
                    i < classBreaksRenderer.classBreakInfos.length;
                    i++
                  ) {
                    if (
                      entityValue <=
                      classBreaksRenderer.classBreakInfos[i].classMaxValue
                    ) {
                      symbol = classBreaksRenderer.classBreakInfos[i].symbol;
                      break;
                    }
                  }

                  if (symbol === undefined || symbol === null) {
                    symbol = classBreaksRenderer.defaultSymbol;
                  }

                  updateEntityWithEsriStyle(entity, symbol, that);
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

  @computed get geoJsonItem() {
    const stratum = <FeatureServerStratum>(
      this.strata.get(FeatureServerStratum.stratumName)
    );
    return isDefined(stratum) ? stratum.geoJsonItem : undefined;
  }

  @computed get featureServerData() {
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

function setupUniqueValRenderer(renderer: UniqueValueRenderer) {
  const out: any = {};
  for (var i = 0; i < renderer.uniqueValueInfos.length; i++) {
    const val = renderer.uniqueValueInfos[i].value;
    out[val] = renderer.uniqueValueInfos[i];
  }
  return out;
}

function convertEsriColorToCesiumColor(esriColor: number[]) {
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
) {
  // Replace a general Cesium Point with a billboard
  if (isDefined(entity.point) && isDefined(symbol.imageData)) {
    entity.billboard = {
      image: proxyCatalogItemUrl(
        catalogItem,
        `data:${symbol.contentType};base64,${symbol.imageData}`
      ),
      heightReference: catalogItem.clampToGround
        ? HeightReference.RELATIVE_TO_GROUND
        : null,
      width: symbol.width,
      height: symbol.height,
      rotation: symbol.angle
    };

    if (isDefined(symbol.xoffset) || isDefined(symbol.yoffset)) {
      const x = isDefined(symbol.xoffset) ? symbol.xoffset : 0;
      const y = isDefined(symbol.yoffset) ? symbol.yoffset : 0;
      entity.billboard.pixelOffset = new Cartesian2(x, y);
    }
    entity.point = undefined;
  }

  // Update the styling of the Cesium Polyline
  if (isDefined(entity.polyline) && isDefined(symbol.color)) {
    entity.polyline.material = convertEsriColorToCesiumColor(symbol.color);
    entity.polyline.width = symbol.width;
  }

  // Update the styling of the Cesium Point
  if (isDefined(entity.point) && isDefined(symbol.color)) {
    entity.point.color = convertEsriColorToCesiumColor(symbol.color);
    entity.point.pixelSize = symbol.size;

    if (isDefined(symbol.outline)) {
      entity.point.outlineColor = convertEsriColorToCesiumColor(
        symbol.outline.color
      );
      entity.point.outlineWidth = symbol.outline.width;
    }
  }

  // Update the styling of the Cesium Polygon
  if (isDefined(entity.polygon) && isDefined(symbol.color)) {
    entity.polygon.material = convertEsriColorToCesiumColor(symbol.color);
    if (isDefined(symbol.outline)) {
      entity.polygon.outlineColor = convertEsriColorToCesiumColor(
        symbol.outline.color
      );
      entity.polygon.outlineWidth = symbol.outline.width;
    }
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
  var url = cleanAndProxyUrl(catalogItem, catalogItem.url || "TODO");
  var urlComponents = splitLayerIdFromPath(url);
  return new URI(urlComponents.urlWithoutLayerId)
    .segment("query")
    .addQuery("f", "json")
    .addQuery(
      "layerDefs",
      "{" + (urlComponents.layerId || 0) + ':"' + catalogItem.layerDef + '"}'
    )
    .toString();
}

function splitLayerIdFromPath(url: string) {
  var regex = /^(.*)\/(\d+)$/;
  var matches = url.match(regex);
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

function cleanAndProxyUrl(
  catalogItem: ArcGisFeatureServerCatalogItem,
  url: string
) {
  return proxyCatalogItemUrl(catalogItem, cleanUrl(url));
}

function cleanUrl(url: string) {
  // Strip off the search portion of the URL
  var uri = new URI(url);
  uri.search("");
  return uri.toString();
}
