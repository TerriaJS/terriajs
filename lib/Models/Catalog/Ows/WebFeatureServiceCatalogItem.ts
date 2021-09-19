import i18next from "i18next";
import { computed, isObservableArray, observable, runInAction } from "mobx";
import combine from "terriajs-cesium/Source/Core/combine";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import containsAny from "../../../Core/containsAny";
import isDefined from "../../../Core/isDefined";
import isReadOnlyArray from "../../../Core/isReadOnlyArray";
import loadText from "../../../Core/loadText";
import TerriaError from "../../../Core/TerriaError";
import gmlToGeoJson from "../../../Map/gmlToGeoJson";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import ExportableMixin from "../../../ModelMixins/ExportableMixin";
import GetCapabilitiesMixin from "../../../ModelMixins/GetCapabilitiesMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import xml2json from "../../../ThirdParty/xml2json";
import { InfoSectionTraits } from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import { RectangleTraits } from "../../../Traits/TraitsClasses/MappableTraits";
import WebFeatureServiceCatalogItemTraits from "../../../Traits/TraitsClasses/WebFeatureServiceCatalogItemTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import GeoJsonCatalogItem from "../CatalogItems/GeoJsonCatalogItem";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import WebFeatureServiceCapabilities, {
  FeatureType,
  getRectangleFromLayer
} from "./WebFeatureServiceCapabilities";

class GetCapabilitiesStratum extends LoadableStratum(
  WebFeatureServiceCatalogItemTraits
) {
  static async load(
    catalogItem: WebFeatureServiceCatalogItem,
    capabilities?: WebFeatureServiceCapabilities
  ): Promise<GetCapabilitiesStratum> {
    if (!isDefined(catalogItem.getCapabilitiesUrl)) {
      throw new TerriaError({
        title: i18next.t("models.webFeatureServiceCatalogItem.missingUrlTitle"),
        message: i18next.t(
          "models.webFeatureServiceCatalogItem.missingUrlMessage"
        )
      });
    }

    if (!isDefined(capabilities))
      capabilities = await WebFeatureServiceCapabilities.fromUrl(
        proxyCatalogItemUrl(
          catalogItem,
          catalogItem.getCapabilitiesUrl,
          catalogItem.getCapabilitiesCacheDuration
        )
      );

    return new GetCapabilitiesStratum(catalogItem, capabilities);
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
    return new Map(this.catalogItem.typeNamesArray.map(lookup));
  }

  @computed
  get info(): StratumFromTraits<InfoSectionTraits>[] {
    const result: StratumFromTraits<InfoSectionTraits>[] = [
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t(
          "models.webFeatureServiceCatalogItem.getCapabilitiesUrl"
        ),
        content: this.catalogItem.getCapabilitiesUrl
      })
    ];

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
      const name = `${i18next.t(
        "models.webFeatureServiceCatalogItem.abstract"
      )}${suffix}`;

      result.push(
        createStratumInstance(InfoSectionTraits, {
          name,
          content: layer.Abstract
        })
      );

      firstDataDescription = firstDataDescription || layer.Abstract;
    }

    // Show the service abstract if there is one and if it isn't the Geoserver default "A compliant implementation..."
    const service = this.capabilities && this.capabilities.service;
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
        result.push(
          createStratumInstance(InfoSectionTraits, {
            name: i18next.t("models.webFeatureServiceCatalogItem.abstract"),
            content: service.Abstract
          })
        );
      }

      // Show the Access Constraints if it isn't "none" (because that's the default, and usually a lie).
      if (
        service.AccessConstraints &&
        !/^none$/i.test(service.AccessConstraints)
      ) {
        result.push(
          createStratumInstance(InfoSectionTraits, {
            name: i18next.t(
              "models.webFeatureServiceCatalogItem.accessConstraints"
            ),
            content: service.AccessConstraints
          })
        );
      }
    }
    return result;
  }

  @computed
  get infoSectionOrder(): string[] {
    let layerDescriptions = [
      i18next.t("models.webFeatureServiceCatalogItem.abstract")
    ];

    // If more than one layer, push layer description titles for each applicable layer
    if (this.capabilitiesFeatureTypes.size > 1) {
      layerDescriptions = [];
      this.capabilitiesFeatureTypes.forEach(layer => {
        if (
          layer &&
          layer.Abstract &&
          !containsAny(
            layer.Abstract,
            WebFeatureServiceCatalogItem.abstractsToIgnore
          )
        ) {
          layerDescriptions.push(
            `${i18next.t("models.webFeatureServiceCatalogItem.abstract")} - ${
              layer.Title
            }`
          );
        }
      });
    }

    return [
      i18next.t("preview.disclaimer"),
      i18next.t("description.name"),
      ...layerDescriptions,
      i18next.t("preview.datasetDescription"),
      i18next.t("preview.serviceDescription"),
      i18next.t("models.webFeatureServiceCatalogItem.serviceDescription"),
      i18next.t("preview.resourceDescription"),
      i18next.t("preview.licence"),
      i18next.t("preview.accessConstraints"),
      i18next.t("models.webFeatureServiceCatalogItem.accessConstraints"),
      i18next.t("preview.author"),
      i18next.t("preview.contact"),
      i18next.t("models.webFeatureServiceCatalogItem.serviceContact"),
      i18next.t("preview.created"),
      i18next.t("preview.modified"),
      i18next.t("preview.updateFrequency"),
      i18next.t("models.webFeatureServiceCatalogItem.getCapabilitiesUrl")
    ];
  }

  @computed
  get rectangle(): StratumFromTraits<RectangleTraits> | undefined {
    const layers: FeatureType[] = [
      ...this.capabilitiesFeatureTypes.values()
    ].filter(isDefined);

    // Only return first layer's rectangle - as we don't support multiple WFS layers
    return layers.length > 0 ? getRectangleFromLayer(layers[0]) : undefined;
  }

  @computed
  get isGeoServer(): boolean | undefined {
    if (!this.capabilities) {
      return undefined;
    }

    if (
      !this.capabilities.service ||
      !this.capabilities.service.KeywordList ||
      !this.capabilities.service.KeywordList.Keyword
    ) {
      return false;
    }

    const keyword = this.capabilities.service.KeywordList.Keyword;
    if (isReadOnlyArray(keyword)) {
      return keyword.indexOf("GEOSERVER") >= 0;
    } else {
      return keyword === "GEOSERVER";
    }
  }
}

class WebFeatureServiceCatalogItem extends ExportableMixin(
  MappableMixin(
    GetCapabilitiesMixin(
      UrlMixin(
        CatalogMemberMixin(CreateModel(WebFeatureServiceCatalogItemTraits))
      )
    )
  )
) {
  /**
   * The collection of strings that indicate an Abstract property should be ignored.  If these strings occur anywhere
   * in the Abstract, the Abstract will not be used.  This makes it easy to filter out placeholder data like
   * Geoserver's "A compliant implementation of WFS..." stock abstract.
   */
  static abstractsToIgnore = [
    "A compliant implementation of WFS",
    "This is the reference implementation of WFS 1.0.0 and WFS 1.1.0, supports all WFS operations including Transaction."
  ];

  // hide elements in the info section which might show information about the datasource
  _sourceInfoItemNames = [
    i18next.t("models.webFeatureServiceCatalogItem.getCapabilitiesUrl")
  ];

  static readonly type = "wfs";
  @observable
  private geojsonCatalogItem: GeoJsonCatalogItem | undefined;

  get type() {
    return WebFeatureServiceCatalogItem.type;
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

  async createGetCapabilitiesStratumFromParent(
    capabilities: WebFeatureServiceCapabilities
  ) {
    const stratum = await GetCapabilitiesStratum.load(this, capabilities);
    runInAction(() => {
      this.strata.set(GetCapabilitiesMixin.getCapabilitiesStratumName, stratum);
    });
  }

  protected async forceLoadMetadata(): Promise<void> {
    if (
      this.strata.get(GetCapabilitiesMixin.getCapabilitiesStratumName) !==
      undefined
    )
      return;
    const stratum = await GetCapabilitiesStratum.load(this);
    runInAction(() => {
      this.strata.set(GetCapabilitiesMixin.getCapabilitiesStratumName, stratum);
    });
  }

  async forceLoadMapItems(): Promise<void> {
    const getCapabilitiesStratum:
      | GetCapabilitiesStratum
      | undefined = this.strata.get(
      GetCapabilitiesMixin.getCapabilitiesStratumName
    ) as GetCapabilitiesStratum;

    if (!this.uri) {
      throw new TerriaError({
        sender: this,
        title: i18next.t("models.webFeatureServiceCatalogItem.missingUrlTitle"),
        message: i18next.t(
          "models.webFeatureServiceCatalogItem.missingUrlMessage",
          this
        )
      });
    }

    // Check if layers exist
    const missingLayers = this.typeNamesArray.filter(
      layer => !getCapabilitiesStratum.capabilitiesFeatureTypes.has(layer)
    );
    if (missingLayers.length > 0) {
      throw new TerriaError({
        sender: this,
        title: i18next.t(
          "models.webFeatureServiceCatalogItem.noLayerFoundTitle"
        ),
        message: i18next.t(
          "models.webFeatureServiceCatalogItem.noLayerFoundMessage",
          this
        )
      });
    }

    // Check if geojson output is supported (by checking GetCapabilities OutputTypes OR FeatureType OutputTypes)
    const hasOutputFormat = (outputFormats: string[] | undefined) => {
      return isDefined(
        outputFormats?.find(format =>
          ["json", "JSON", "application/json"].includes(format)
        )
      );
    };

    const supportsGeojson =
      hasOutputFormat(getCapabilitiesStratum.capabilities.outputTypes) ||
      [...getCapabilitiesStratum.capabilitiesFeatureTypes.values()].reduce<
        boolean
      >(
        (hasGeojson, current) =>
          hasGeojson && hasOutputFormat(current?.OutputFormats),
        true
      );

    const url = this.uri
      .clone()
      .setSearch(
        combine(
          {
            service: "WFS",
            request: "GetFeature",
            typeName: this.typeNames,
            version: "1.1.0",
            outputFormat: supportsGeojson ? "JSON" : "gml3",
            srsName: "urn:ogc:def:crs:EPSG::4326", // srsName must be formatted like this for correct lat/long order  >:(
            maxFeatures: this.maxFeatures
          },
          this.parameters
        )
      )
      .toString();

    const getFeatureResponse = await loadText(proxyCatalogItemUrl(this, url));

    // Check for errors (if supportsGeojson and the request returns XML, OR the response includes ExceptionReport)
    if (
      (supportsGeojson && getFeatureResponse.startsWith("<")) ||
      getFeatureResponse.includes("ExceptionReport")
    ) {
      let errorMessage: string | undefined;
      try {
        errorMessage = xml2json(getFeatureResponse).Exception?.ExceptionText;
      } catch {}

      throw new TerriaError({
        sender: this,
        title: i18next.t(
          "models.webFeatureServiceCatalogItem.missingDataTitle"
        ),
        message: `${i18next.t(
          "models.webFeatureServiceCatalogItem.missingDataMessage",
          this
        )} ${isDefined(errorMessage) ? `<br/>Error: ${errorMessage}` : ""}`
      });
    }

    let geojsonData = supportsGeojson
      ? JSON.parse(getFeatureResponse)
      : gmlToGeoJson(getFeatureResponse);

    runInAction(() => {
      this.geojsonCatalogItem = new GeoJsonCatalogItem(
        createGuid(),
        this.terria,
        this
      );

      this.geojsonCatalogItem.setTrait(
        CommonStrata.definition,
        "geoJsonData",
        geojsonData
      );

      if (isDefined(this.style))
        this.geojsonCatalogItem.setTrait(
          CommonStrata.definition,
          "style",
          this.style
        );
    });

    (await this.geojsonCatalogItem!.loadMapItems()).throwIfError();
  }

  @computed
  get typeNamesArray(): ReadonlyArray<string> {
    if (Array.isArray(this.typeNames)) {
      return this.typeNames;
    } else if (this.typeNames) {
      return this.typeNames.split(",");
    } else {
      return [];
    }
  }

  @computed
  get _canExportData() {
    return isDefined(this.geojsonCatalogItem?.geoJsonData);
  }

  async _exportData() {
    if (isDefined(this.geojsonCatalogItem?.geoJsonData)) {
      return {
        name: `${this.name} export.json`,
        file: new Blob([JSON.stringify(this.geojsonCatalogItem!.geoJsonData)])
      };
    }
    return;
  }

  @computed
  get mapItems() {
    if (this.geojsonCatalogItem) {
      return this.geojsonCatalogItem.mapItems.map(mapItem => {
        mapItem.show = this.show;
        return mapItem;
      });
    }
    return [];
  }

  @computed
  get shortReport(): string | undefined {
    // Show notice if reached
    if (
      isObservableArray(this.geojsonCatalogItem?.geoJsonData?.features) &&
      this.geojsonCatalogItem!.geoJsonData!.features.length >= this.maxFeatures
    ) {
      return i18next.t(
        "models.webFeatureServiceCatalogItem.reachedMaxFeatureLimit",
        this
      );
    }
    return undefined;
  }
}

export default WebFeatureServiceCatalogItem;
