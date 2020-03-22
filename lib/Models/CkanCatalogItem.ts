import i18next from "i18next";
import CkanCatalogItemTraits from "../Traits/CkanCatalogItemTraits";
import LoadableStratum from "./LoadableStratum";
import { BaseModel } from "./Model";
import Terria from "./Terria";
import StratumOrder from "./StratumOrder";
import UrlMixin from "../ModelMixins/UrlMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import CreateModel from "./CreateModel";
import Mappable from "./Mappable";
import { runInAction, computed } from "mobx";
import URI from "urijs";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import loadJson from "../Core/loadJson";
import ArcGisFeatureServerCatalogItem from "./ArcGisFeatureServerCatalogItem";
import ArcGisMapServerCatalogItem from "./ArcGisMapServerCatalogItem";
import GeoJsonCatalogItem from "./GeoJsonCatalogItem";
import CsvCatalogItem from "./CsvCatalogItem";
import KmlCatalogItem from "./KmlCatalogItem";
import WebMapServiceCatalogItem from "./WebMapServiceCatalogItem";
// import WebFeatureServiceCatalogItem from "./WebFeatureServiceCatalogItem";
import isDefined from "../Core/isDefined";
import CommonStrata from "./CommonStrata";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import Color from "terriajs-cesium/Source/Core/Color";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import createStratumInstance from "./createStratumInstance";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import StratumFromTraits from "./StratumFromTraits";
import LegendTraits from "../Traits/LegendTraits";
import { RectangleTraits } from "../Traits/MappableTraits";
import TerriaError from "../Core/TerriaError";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import replaceUnderscores from "../Core/replaceUnderscores";
import CkanCatalogGroup from "./CkanCatalogGroup";
import { CkanDataset, CkanOrganisation, CkanResource } from "./CkanDefinitions";
import { JsonObject } from "../Core/Json";

class CkanDatasetStratum extends LoadableStratum(CkanCatalogItemTraits) {
  static stratumName = "ckanDataset";

  constructor(
    private readonly ckanDataset: CkanDataset,
    private readonly ckanResource: CkanResource,
    private readonly ckanCatalogGroup: CkanCatalogGroup
  ) {
    super();
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new CkanDatasetStratum(
      this.ckanDataset,
      this.ckanResource,
      this.ckanCatalogGroup
    ) as this;
  }

  static async load(
    ckanDataset: CkanDataset,
    ckanResource: CkanResource,
    ckanCatalogGroup: CkanCatalogGroup
  ) {
    return new CkanDatasetStratum(ckanDataset, ckanResource, ckanCatalogGroup);
  }

  @computed get url() {
    return this.ckanDataset.url;
  }

  @computed get name() {
    if (this.ckanCatalogGroup.useResourceName) return this.ckanResource.name;
    if (
      this.ckanCatalogGroup.useDatasetNameAndFormatWhereMultipleResources &&
      this.ckanDataset.resources.length > 1
    )
      return this.ckanDataset.title + " - " + this.ckanResource.format;
    if (
      this.ckanCatalogGroup.useCombinationNameWhereMultipleResources &&
      this.ckanDataset.resources.length > 1
    )
      return this.ckanDataset.title + " - " + this.ckanResource.name;
    return this.ckanDataset.title;
  }

  @computed get dataCustodian() {
    return (
      this.ckanDataset.organization.description ||
      this.ckanDataset.organization.title
    );
  }

  @computed get rectangle() {
    if (this.ckanDataset.geo_coverage === undefined) return undefined;
    var bboxString = this.ckanDataset.geo_coverage;
    if (isDefined(bboxString)) {
      var parts = bboxString.split(",");
      if (parts.length === 4) {
        return Rectangle.fromDegrees(
          parseInt(parts[0]),
          parseInt(parts[1]),
          parseInt(parts[2]),
          parseInt(parts[3])
        );
      }
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

    function prettifyDate(date: string) {
      if (date.match(/^\d\d\d\d-\d\d-\d\d.*/)) {
        return date.substr(0, 10);
      } else return date;
    }

    const outArray = [];

    if (isDefined(this.ckanDataset.license_url)) {
      outArray.push(
        newInfo(
          i18next.t("models.ckan.licence"),
          // TODO - Double check prettier doesn't clobber this line
          `[${this.ckanDataset.license_title ||
            this.ckanDataset.license_url}](${this.ckanDataset.license_url})`
        )
      );
    } else if (isDefined(this.ckanDataset.license_title)) {
      outArray.push({
        name: i18next.t("models.ckan.licence"),
        content: this.ckanDataset.license_title
      });
    }

    outArray.push(
      newInfo(
        i18next.t("models.ckan.contact_point"),
        this.ckanDataset.contact_point
      )
    );

    outArray.push(
      newInfo(
        i18next.t("models.ckan.datasetDescription"),
        this.ckanDataset.notes
      )
    );
    outArray.push(
      newInfo(i18next.t("models.ckan.author"), this.ckanDataset.author)
    );
    outArray.push(
      newInfo(
        i18next.t("models.ckan.metadata_created"),
        prettifyDate(this.ckanDataset.metadata_created)
      )
    );
    outArray.push(
      newInfo(
        i18next.t("models.ckan.metadata_modified"),
        prettifyDate(this.ckanDataset.metadata_modified)
      )
    );
    outArray.push(
      newInfo(
        i18next.t("models.ckan.update_freq"),
        this.ckanDataset.update_freq
      )
    );
    return outArray;
  }
}

StratumOrder.addLoadStratum(CkanDatasetStratum.stratumName);

function createItem(
  ckanCatalogGroup: CkanCatalogGroup,
  itemId: string,
  itemType: any
) {
  const existingModel = ckanCatalogGroup.terria.getModelById(itemType, itemId);
  let model: any;
  if (existingModel === undefined) {
    model = new itemType(itemId, ckanCatalogGroup.terria);
    ckanCatalogGroup.terria.addModel(model);
  } else {
    model = existingModel;
  }
  return model;
}

function setCkanRelatedStrata(
  model: any,
  resource: CkanResource,
  dataset: CkanDataset,
  ckanCatalogGroup: CkanCatalogGroup
) {
  model.setTrait("underride", "url", resource.url);
  CkanDatasetStratum.load(dataset, resource, ckanCatalogGroup).then(statum => {
    runInAction(() => {
      model.strata.set(CkanDatasetStratum.stratumName, statum);
    });
  });
}

export function setupSupportedFormats(ckanCatalogGroup: CkanCatalogGroup) {
  function addSupportedFormat(constructor: any, resourceFormat: string) {
    return {
      constructor: constructor,
      resourceFormat: resourceFormat
    };
  }
  const supportedFormats: any = [];
  if (ckanCatalogGroup.allowGeoJson) {
    supportedFormats.push(
      addSupportedFormat(
        GeoJsonCatalogItem,
        ckanCatalogGroup.geoJsonResourceFormat
      )
    );
  }
  if (ckanCatalogGroup.allowWms) {
    supportedFormats.push(
      addSupportedFormat(
        WebMapServiceCatalogItem,
        ckanCatalogGroup.wmsResourceFormat
      )
    );
  }
  if (ckanCatalogGroup.allowKml) {
    supportedFormats.push(
      addSupportedFormat(KmlCatalogItem, ckanCatalogGroup.kmlResourceFormat)
    );
  }
  if (ckanCatalogGroup.allowCsv) {
    supportedFormats.push(
      addSupportedFormat(CsvCatalogItem, ckanCatalogGroup.csvResourceFormat)
    );
  }
  if (ckanCatalogGroup.allowArcGisFeatureServer) {
    supportedFormats.push(
      addSupportedFormat(
        ArcGisFeatureServerCatalogItem,
        ckanCatalogGroup.arcgisFeatureServerResourceFormat
      )
    );
  }
  if (ckanCatalogGroup.allowArcGisMapServer) {
    supportedFormats.push(
      addSupportedFormat(
        ArcGisMapServerCatalogItem,
        ckanCatalogGroup.arcgisMapServerResourceFormat
      )
    );
  }

  // if (ckanCatalogGroup.allowWfs) {
  //   supportedFormats.push(addSupportedFormat(WebFeatureServiceCatalogItem, ckanCatalogGroup.wfsResourceFormat))
  // }
  return supportedFormats;
}

function findMatchingFormat(supportedFormats: any[], resource: CkanResource) {
  for (var i = 0; i < supportedFormats.length; ++i) {
    const format = supportedFormats[i];
    if (new RegExp(format.resourceFormat, "i").test(resource.format)) {
      return format;
    }
  }
  return undefined;
}

export function createCatalogItemFromCkanResource(
  resource: CkanResource,
  dataset: CkanDataset,
  ckanCatalogGroup: CkanCatalogGroup,
  supportedFormats: any[]
) {
  const itemId =
    ckanCatalogGroup.uniqueId + "/" + dataset.id + "/" + resource.id;

  const format = findMatchingFormat(supportedFormats, resource);
  if (format === undefined) return undefined;

  let model = createItem(ckanCatalogGroup, itemId, format.constructor);
  model.setTrait("underride", "url", resource.url);
  setCkanRelatedStrata(model, resource, dataset, ckanCatalogGroup);
  return model;
}
