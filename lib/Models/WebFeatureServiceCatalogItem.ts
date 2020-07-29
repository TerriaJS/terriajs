// const mobx = require('mobx');
// const mobxUtils = require('mobx-utils');
// Problems in current architecture:
// 1. After loading, can't tell what user actually set versus what came from e.g. GetCapabilities.
//  Solution: layering
// 2. CkanCatalogItem producing a WebFeatureServiceCatalogItem on load
// 3. Observable spaghetti
//  Solution: think in terms of pipelines with computed observables, document patterns.
// 4. All code for all catalog item types needs to be loaded before we can do anything.
import i18next from "i18next";
import { computed, runInAction } from "mobx";
import containsAny from "../Core/containsAny";
import createTransformerAllowUndefined from "../Core/createTransformerAllowUndefined";
import filterOutUndefined from "../Core/filterOutUndefined";
import isDefined from "../Core/isDefined";
import isReadOnlyArray from "../Core/isReadOnlyArray";
import TerriaError from "../Core/TerriaError";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import DiffableMixin from "../ModelMixins/DiffableMixin";
import GetCapabilitiesMixin from "../ModelMixins/GetCapabilitiesMixin";
import TimeFilterMixin from "../ModelMixins/TimeFilterMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import DiscreteTimeTraits from "../Traits/DiscreteTimeTraits";
import LegendTraits from "../Traits/LegendTraits";
import { RectangleTraits } from "../Traits/MappableTraits";
import WebFeatureServiceCatalogItemTraits from "../Traits/WebFeatureServiceCatalogItemTraits";
import CommonStrata from "./CommonStrata";
import CreateModel from "./CreateModel";
import createStratumInstance from "./createStratumInstance";
import LoadableStratum from "./LoadableStratum";
import Mappable, { ImageryParts } from "./Mappable";
import { BaseModel } from "./Model";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import { AvailableStyle } from "./SelectableStyle";
import StratumFromTraits from "./StratumFromTraits";
import WebFeatureServiceCapabilities, {
  getRectangleFromLayer,
  FeatureType
} from "./WebFeatureServiceCapabilities";
import { callWebCoverageService } from "./callWebCoverageService";
import ExportableData from "./ExportableData";
import combine from "terriajs-cesium/Source/Core/combine";
import loadJson from "../Core/loadJson";
import GeoJsonCatalogItem from "./GeoJsonCatalogItem";

import createGuid from "terriajs-cesium/Source/Core/createGuid";
import xml2json from "../ThirdParty/xml2json";
import loadText from "../Core/loadText";

const dateFormat = require("dateformat");

interface LegendUrl {
  url: string;
  mimeType?: string;
}

interface WebFeatureServiceStyle {
  name: string;
  title: string;
  abstract?: string;
  legendUrl?: LegendUrl;
}

interface WebFeatureServiceStyles {
  [layerName: string]: WebFeatureServiceStyle[];
}

class GetCapabilitiesStratum extends LoadableStratum(
  WebFeatureServiceCatalogItemTraits
) {
  static load(
    catalogItem: WebFeatureServiceCatalogItem
  ): Promise<GetCapabilitiesStratum> {
    console.log("Loading GetCapabilities");

    if (catalogItem.getCapabilitiesUrl === undefined) {
      return Promise.reject(
        new TerriaError({
          title: i18next.t(
            "models.WebFeatureServiceCatalogItem.missingUrlTitle"
          ),
          message: i18next.t(
            "models.WebFeatureServiceCatalogItem.missingUrlMessage"
          )
        })
      );
    }

    const proxiedUrl = proxyCatalogItemUrl(
      catalogItem,
      catalogItem.getCapabilitiesUrl,
      catalogItem.getCapabilitiesCacheDuration
    );
    return WebFeatureServiceCapabilities.fromUrl(proxiedUrl).then(
      capabilities => {
        return new GetCapabilitiesStratum(catalogItem, capabilities);
      }
    );
  }

  constructor(
    readonly catalogItem: WebFeatureServiceCatalogItem,
    readonly capabilities: WebFeatureServiceCapabilities
  ) {
    super();
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new GetCapabilitiesStratum(
      model as WebFeatureServiceCatalogItem,
      this.capabilities
    ) as this;
  }

  @computed
  get capabilitiesFeatureTypes(): ReadonlyMap<string, FeatureType | undefined> {
    const lookup: (
      name: string
    ) => [string, FeatureType | undefined] = name => [
      name,
      this.capabilities && this.capabilities.findLayer(name)
    ];
    return new Map(this.catalogItem.layersArray.map(lookup));
  }

  @computed
  get info(): StratumFromTraits<InfoSectionTraits>[] {
    const result: StratumFromTraits<InfoSectionTraits>[] = [];

    const capabilitiesTraits = createStratumInstance(InfoSectionTraits);
    capabilitiesTraits.name = i18next.t(
      "models.WebFeatureServiceCatalogItem.getCapabilitiesUrl"
    );
    capabilitiesTraits.content = this.catalogItem.getCapabilitiesUrl;
    result.push(capabilitiesTraits);

    let firstDataDescription: string | undefined;
    for (const layer of this.capabilitiesFeatureTypes.values()) {
      if (
        !layer ||
        !layer.Abstract ||
        containsAny(
          layer.Abstract,
          WebFeatureServiceCatalogItem.abstractsToIgnore
        )
      ) {
        continue;
      }

      const suffix =
        this.capabilitiesFeatureTypes.size === 1 ? "" : ` - ${layer.Title}`;
      const name = `Web Map Service Layer Description${suffix}`;

      const traits = createStratumInstance(InfoSectionTraits);
      traits.name = name;
      traits.content = layer.Abstract;
      result.push(traits);

      firstDataDescription = firstDataDescription || layer.Abstract;
    }

    // Show the service abstract if there is one and if it isn't the Geoserver default "A compliant implementation..."
    const service = this.capabilities && this.capabilities.Service;
    if (service) {
      if (
        service &&
        service.Abstract &&
        !containsAny(
          service.Abstract,
          WebFeatureServiceCatalogItem.abstractsToIgnore
        ) &&
        service.Abstract !== firstDataDescription
      ) {
        const traits = createStratumInstance(InfoSectionTraits);
        traits.name = "Web Map Service Description";
        traits.content = service.Abstract;
        result.push(traits);
      }

      // Show the Access Constraints if it isn't "none" (because that's the default, and usually a lie).
      if (
        service.AccessConstraints &&
        !/^none$/i.test(service.AccessConstraints)
      ) {
        const traits = createStratumInstance(InfoSectionTraits);
        traits.name = "Web Map Service Access Constraints";
        traits.content = service.AccessConstraints;
        result.push(traits);
      }
    }
    return result;
  }

  @computed
  get rectangle(): StratumFromTraits<RectangleTraits> | undefined {
    const layers: FeatureType[] = [...this.capabilitiesFeatureTypes.values()]
      .filter(layer => layer !== undefined)
      .map(l => l!);
    // Needs to take union of all layer rectangles
    return layers.length > 0 ? getRectangleFromLayer(layers[0]) : undefined;
    // if (layers.length === 1) {
    //     return getRectangleFromLayer(layers[0]);
    // }
    // Otherwise get the union of rectangles from all layers
    // return undefined;
  }

  @computed
  get isGeoServer(): boolean | undefined {
    if (!this.capabilities) {
      return undefined;
    }

    if (
      !this.capabilities.Service ||
      !this.capabilities.Service.KeywordList ||
      !this.capabilities.Service.KeywordList.Keyword
    ) {
      return false;
    }

    const keyword = this.capabilities.Service.KeywordList.Keyword;
    if (isReadOnlyArray(keyword)) {
      return keyword.indexOf("GEOSERVER") >= 0;
    } else {
      return keyword === "GEOSERVER";
    }
  }

  @computed
  get outputFormats(): string[] {
    return (
      this.capabilities.json.OperationsMetadata?.Operation?.find(
        (op: any) => op.name === "GetFeature"
      )?.Parameter?.find((p: any) => p.name === "outputFormat")?.Value || []
    );
  }
}

class WebFeatureServiceCatalogItem
  extends GetCapabilitiesMixin(
    UrlMixin(
      CatalogMemberMixin(CreateModel(WebFeatureServiceCatalogItemTraits))
    )
  )
  implements Mappable, ExportableData {
  /**
   * The collection of strings that indicate an Abstract property should be ignored.  If these strings occur anywhere
   * in the Abstract, the Abstract will not be used.  This makes it easy to filter out placeholder data like
   * Geoserver's "A compliant implementation of WFS..." stock abstract.
   */
  static abstractsToIgnore = ["A compliant implementation of WFS"];

  // hide elements in the info section which might show information about the datasource
  _sourceInfoItemNames = [
    i18next.t("models.WebFeatureServiceCatalogItem.getCapabilitiesUrl")
  ];

  static defaultParameters = {
    transparent: true,
    format: "image/png",
    exceptions: "application/vnd.ogc.se_xml",
    styles: "",
    tiled: true
  };

  static readonly type = "wfs";
  readonly canZoomTo = true;
  readonly supportsSplitting = true;

  private geojsonCatalogItem: GeoJsonCatalogItem | undefined;

  get type() {
    return WebFeatureServiceCatalogItem.type;
  }

  // TODO
  get isMappable() {
    return true;
  }

  protected get defaultGetCapabilitiesUrl(): string | undefined {
    if (this.uri) {
      return this.uri
        .clone()
        .setSearch({
          service: "WFS",
          version: "1.1.0",
          request: "GetCapabilities"
        })
        .toString();
    } else {
      return undefined;
    }
  }

  protected forceLoadMetadata(): Promise<void> {
    return GetCapabilitiesStratum.load(this).then(stratum => {
      runInAction(() => {
        this.strata.set(
          GetCapabilitiesMixin.getCapabilitiesStratumName,
          stratum
        );
      });
    });
  }

  async loadMapItems(): Promise<void> {
    await this.loadMetadata();
    const getCapabilitiesStratum:
      | GetCapabilitiesStratum
      | undefined = this.strata.get(
      GetCapabilitiesMixin.getCapabilitiesStratumName
    ) as GetCapabilitiesStratum;

    if (!this.uri) return;

    if (
      getCapabilitiesStratum.outputFormats.find(format =>
        ["json", "JSON", "application/json"].includes(format)
      )
    ) {
      const url = this.uri
        .clone()
        .setSearch(
          combine(
            {
              service: "WFS",
              request: "GetFeature",
              typeName: this.layers,
              version: "1.1.0",
              outputFormat: "JSON",
              srsName: "EPSG:4326",
              maxFeatures: 500
            },
            this.parameters
          )
        )
        .toString();

      const geojson = await loadText(proxyCatalogItemUrl(this, url));

      if (geojson.startsWith("<")) {
        try {
          const error = xml2json(geojson);
          throw `Failed to GetFeature:
${error.ExceptionReport?.Exception?.ExceptionText || error.toString()}`;
        } catch (e) {
        } finally {
          throw `Failed to parse WFS GetFeature response: ${geojson}`;
        }
      }

      this.geojsonCatalogItem = new GeoJsonCatalogItem(
        createGuid(),
        this.terria
      );

      this.geojsonCatalogItem.setTrait(
        "definition",
        "geoJsonData",
        JSON.parse(geojson)
      );

      this.geojsonCatalogItem.setTrait("definition", "clampToGround", true);

      await this.geojsonCatalogItem.loadMapItems();
    }
  }

  @computed
  get layersArray(): ReadonlyArray<string> {
    if (Array.isArray(this.layers)) {
      return this.layers;
    } else if (this.layers) {
      return this.layers.split(",");
    } else {
      return [];
    }
  }

  @computed
  get canExportData() {
    // return isDefined(this.linkedWcsCoverage) && isDefined(this.linkedWcsUrl);
    return false;
  }

  async exportData() {
    return undefined;
  }

  @computed
  get mapItems() {
    if (this.geojsonCatalogItem) {
      return this.geojsonCatalogItem.mapItems;
    }
    return [];
  }
}

export default WebFeatureServiceCatalogItem;
