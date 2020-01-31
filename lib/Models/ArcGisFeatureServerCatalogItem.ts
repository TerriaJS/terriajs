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

class FeatureServerStratum extends LoadableStratum(
  ArcGisFeatureServerCatalogItemTraits
) {
  static stratumName = "featureServer";

  constructor(
    readonly item: ArcGisFeatureServerCatalogItem,
    readonly geoJsonItem: GeoJsonCatalogItem,
    readonly metadata: any
  ) {
    super();
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new FeatureServerStratum(
      newModel as ArcGisFeatureServerCatalogItem,
      this.geoJsonItem,
      this.metadata
    ) as this;
  }

  @computed get rectangle() {
    return isDefined(this.geoJsonItem) ? this.geoJsonItem.rectangle : undefined;
  }

  @computed get name() {
    return isDefined(this.metadata) ? this.metadata.name : undefined;
  }

  @computed get info() {
    if (isDefined(this.metadata) && this.metadata.description) {
      return [
        createStratumInstance(InfoSectionTraits, {
          name: "Description",
          content: this.metadata.description
        })
      ];
    } else {
      return undefined;
    }
  }

  static async load(item: ArcGisFeatureServerCatalogItem) {
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
      .then(metadata => {
        const stratum = new FeatureServerStratum(item, geoJsonItem, metadata);
        return stratum;
      });
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
    return i18next.t("models.arcGisFeatureServer.name");
  }

  get isMappable() {
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
          const metadata = that.metadata;
          if (that.useStyleInformationFromService) {
            const renderer = metadata.drawingInfo.renderer;
            that.mapItems.forEach(mapItem => {
              const entities = mapItem.entities;
              entities.suspendEvents();

              // A 'simple' renderer only applies a single style to all features
              if (renderer.type === "simple") {
                entities.values.forEach(function(entity) {
                  updateEntityWithEsriStyle(entity, renderer.symbol, that);
                });

                // For a 'uniqueValue' renderer symbology gets applied via feature properties.
              } else if (renderer.type === "uniqueValue") {
                const rendererObj = setupUniqueValRenderer(renderer);

                const primaryFieldForSymbology = renderer.field1;

                entities.values.forEach(function(entity) {
                  let symbolName = entity.properties[
                    primaryFieldForSymbology
                  ].getValue();

                  // accumulate values if there is more than one field defined
                  if (renderer.fieldDelimiter && renderer.field2) {
                    var val2 = entity.properties[renderer.field2].getValue();
                    if (val2) {
                      symbolName += renderer.fieldDelimiter + val2;
                      var val3 = entity.properties[renderer.field3].getValue();
                      if (val3) {
                        symbolName += renderer.fieldDelimiter + val3;
                      }
                    }
                  }

                  let rendererStyle = rendererObj[symbolName];
                  if (rendererStyle === null) {
                    rendererStyle = metadata.drawingInfo.renderer.defaultSymbol;
                  }

                  updateEntityWithEsriStyle(entity, rendererStyle.symbol, that);
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

  @computed get metadata() {
    const stratum = <FeatureServerStratum>(
      this.strata.get(FeatureServerStratum.stratumName)
    );
    return isDefined(stratum) ? stratum.metadata : undefined;
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

function setupUniqueValRenderer(renderer) {
  const out = {};
  for (var i = 0; i < renderer.uniqueValueInfos.length; i++) {
    const val = renderer.uniqueValueInfos[i].value;
    out[val] = renderer.uniqueValueInfos[i];
  }
  return out;
}

function convertEsriColorToCesiumColor(esriColor) {
  return Color.fromBytes(
    esriColor[0],
    esriColor[1],
    esriColor[2],
    esriColor[3]
  );
}

function updateEntityWithEsriStyle(
  entity,
  symbol,
  catalogItem: ArcGisFeatureServerCatalogItem
) {
  // We're going to replace a general Cesium Point with a billboard
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

  // We're going to update the styling of the Cesium Polyline
  if (isDefined(entity.polyline)) {
    entity.polyline.material = convertEsriColorToCesiumColor(symbol.color);
    entity.polyline.width = symbol.width;
  }

  // We're going to update the styling of the Cesium Point
  if (isDefined(entity.point)) {
    entity.point.color = convertEsriColorToCesiumColor(symbol.color);
    entity.point.pixelSize = symbol.size;

    if (isDefined(symbol.outline)) {
      entity.point.outlineColor = convertEsriColorToCesiumColor(
        symbol.outline.color
      );
      entity.point.outlineWidth = symbol.outline.width;
    }
  }

  // We're going to update the styling of the Cesium Polygon
  if (isDefined(entity.polygon)) {
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
