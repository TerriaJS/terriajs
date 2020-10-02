// const mobx = require('mobx');
// const mobxUtils = require('mobx-utils');
// Problems in current architecture:
// 1. After loading, can't tell what user actually set versus what came from e.g. GetCapabilities.
//  Solution: layering
// 2. CkanCatalogItem producing a WebMapServiceCatalogItem on load
// 3. Observable spaghetti
//  Solution: think in terms of pipelines with computed observables, document patterns.
// 4. All code for all catalog item types needs to be loaded before we can do anything.
import i18next from "i18next";
import { computed, runInAction } from "mobx";
import moment from "moment";
import combine from "terriajs-cesium/Source/Core/combine";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import WebMapServiceImageryProvider from "terriajs-cesium/Source/Scene/WebMapServiceImageryProvider";
import URI from "urijs";
import containsAny from "../Core/containsAny";
import createTransformerAllowUndefined from "../Core/createTransformerAllowUndefined";
import filterOutUndefined from "../Core/filterOutUndefined";
import isDefined from "../Core/isDefined";
import isReadOnlyArray from "../Core/isReadOnlyArray";
import { JsonObject } from "../Core/Json";
import TerriaError from "../Core/TerriaError";
import AsyncChartableMixin from "../ModelMixins/AsyncChartableMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import DiffableMixin from "../ModelMixins/DiffableMixin";
import ExportableMixin from "../ModelMixins/ExportableMixin";
import GetCapabilitiesMixin from "../ModelMixins/GetCapabilitiesMixin";
import TimeFilterMixin from "../ModelMixins/TimeFilterMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import SelectableDimensions, {
  SelectableDimension
} from "../Models/SelectableDimensions";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import DiscreteTimeTraits from "../Traits/DiscreteTimeTraits";
import LegendTraits from "../Traits/LegendTraits";
import { RectangleTraits } from "../Traits/MappableTraits";
import WebMapServiceCatalogItemTraits, {
  WebMapServiceAvailableLayerDimensionsTraits,
  WebMapServiceAvailableLayerStylesTraits
} from "../Traits/WebMapServiceCatalogItemTraits";
import { callWebCoverageService } from "./callWebCoverageService";
import CommonStrata from "./CommonStrata";
import CreateModel from "./CreateModel";
import createStratumInstance from "./createStratumInstance";
import LoadableStratum from "./LoadableStratum";
import Mappable, { ImageryParts } from "./Mappable";
import { BaseModel } from "./Model";
import { CapabilitiesStyle } from "./OwsInterfaces";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumFromTraits from "./StratumFromTraits";
import WebMapServiceCapabilities, {
  CapabilitiesContactInformation,
  CapabilitiesDimension,
  CapabilitiesLayer,
  getRectangleFromLayer
} from "./WebMapServiceCapabilities";

const dateFormat = require("dateformat");

class GetCapabilitiesStratum extends LoadableStratum(
  WebMapServiceCatalogItemTraits
) {
  static async load(
    catalogItem: WebMapServiceCatalogItem,
    capabilities?: WebMapServiceCapabilities
  ): Promise<GetCapabilitiesStratum> {
    if (!isDefined(catalogItem.getCapabilitiesUrl)) {
      throw new TerriaError({
        title: i18next.t("models.webMapServiceCatalogItem.missingUrlTitle"),
        message: i18next.t("models.webMapServiceCatalogItem.missingUrlMessage")
      });
    }

    if (!isDefined(capabilities))
      capabilities = await WebMapServiceCapabilities.fromUrl(
        proxyCatalogItemUrl(
          catalogItem,
          catalogItem.getCapabilitiesUrl,
          catalogItem.getCapabilitiesCacheDuration
        )
      );

    return new GetCapabilitiesStratum(catalogItem, capabilities);
  }

  constructor(
    readonly catalogItem: WebMapServiceCatalogItem,
    readonly capabilities: WebMapServiceCapabilities
  ) {
    super();
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new GetCapabilitiesStratum(
      model as WebMapServiceCatalogItem,
      this.capabilities
    ) as this;
  }

  @computed
  get supportsReordering() {
    return !this.keepOnTop;
  }

  @computed
  get layers(): string | undefined {
    let layers: string | undefined;

    if (this.catalogItem.uri !== undefined) {
      // Try to extract a layer from the URL
      const query: any = this.catalogItem.uri.query(true);
      layers = query.layers;
    }

    if (layers === undefined) {
      // Use all the top-level, named layers
      layers = filterOutUndefined(
        this.capabilities.topLevelNamedLayers.map(layer => layer.Name)
      ).join(",");
    }

    return layers;
  }

  @computed
  get legends(): StratumFromTraits<LegendTraits>[] | undefined {
    const availableStyles = this.catalogItem.availableStyles || [];
    const layers = this.catalogItem.layersArray;
    const styles = this.catalogItem.stylesArray;

    const result: StratumFromTraits<LegendTraits>[] = [];

    for (let i = 0; i < layers.length; ++i) {
      const layer = layers[i];
      const style = i < styles.length ? styles[i] : undefined;

      const layerAvailableStyles = availableStyles.find(
        candidate => candidate.layerName === layer
      );
      if (
        layerAvailableStyles !== undefined &&
        Array.isArray(layerAvailableStyles.styles) &&
        layerAvailableStyles.styles.length > 0
      ) {
        // Use the first style if none is explicitly specified.
        // Note that the WMS 1.3.0 spec (section 7.3.3.4) explicitly says we can't assume this,
        // but because the server has no other way of indicating the default style, let's hope that
        // sanity prevails.
        const layerStyle =
          style === undefined
            ? layerAvailableStyles.styles[0]
            : layerAvailableStyles.styles.find(
                candidate => candidate.name === style
              );

        if (layerStyle !== undefined && layerStyle.legend !== undefined) {
          result.push(
            <StratumFromTraits<LegendTraits>>(<unknown>layerStyle.legend)
          );
        }

        // If no styles - make up legend
      } else if (isDefined(this.catalogItem.url)) {
        result.push(
          createStratumInstance(LegendTraits, {
            url: URI(
              `${proxyCatalogItemUrl(
                this.catalogItem,
                this.catalogItem.url
              )}?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image/png&transparent=True`
            )
              .addQuery("layer", layer)
              .toString(),
            urlMimeType: "image/png"
          })
        );
      }
    }

    return result;
  }

  @computed
  get capabilitiesLayers(): ReadonlyMap<string, CapabilitiesLayer | undefined> {
    const lookup: (
      name: string
    ) => [string, CapabilitiesLayer | undefined] = name => [
      name,
      this.capabilities && this.capabilities.findLayer(name)
    ];
    return new Map(this.catalogItem.layersArray.map(lookup));
  }

  @computed
  get availableDimensions(): StratumFromTraits<
    WebMapServiceAvailableLayerDimensionsTraits
  >[] {
    const result: StratumFromTraits<
      WebMapServiceAvailableLayerDimensionsTraits
    >[] = [];

    if (!this.capabilities) {
      return result;
    }

    const capabilitiesLayers = this.capabilitiesLayers;

    for (const layerTuple of capabilitiesLayers) {
      const layerName = layerTuple[0];
      const layer = layerTuple[1];

      const dimensions: ReadonlyArray<CapabilitiesDimension> = layer
        ? this.capabilities.getInheritedValues(layer, "Dimension")
        : [];

      result.push({
        layerName: layerName,
        dimensions: dimensions
          .filter(dim => dim.name !== "time")
          .map(dim => {
            return {
              name: dim.name,
              units: dim.units,
              unitSymbol: dim.unitSymbol,
              default: dim.default,
              multipleValues: dim.multipleValues,
              current: dim.current,
              nearestValue: dim.nearestValue,
              values: dim.text?.split(",")
            };
          })
      });
    }

    return result;
  }

  @computed
  get availableStyles(): StratumFromTraits<
    WebMapServiceAvailableLayerStylesTraits
  >[] {
    const result: StratumFromTraits<
      WebMapServiceAvailableLayerStylesTraits
    >[] = [];

    if (!this.capabilities) {
      return result;
    }

    const capabilitiesLayers = this.capabilitiesLayers;
    for (const layerTuple of capabilitiesLayers) {
      const layerName = layerTuple[0];
      const layer = layerTuple[1];

      const styles: ReadonlyArray<CapabilitiesStyle> = layer
        ? this.capabilities.getInheritedValues(layer, "Style")
        : [];
      result.push({
        layerName: layerName,
        styles: styles.map(style => {
          var wmsLegendUrl = isReadOnlyArray(style.LegendURL)
            ? style.LegendURL[0]
            : style.LegendURL;

          var legendUri, legendMimeType;
          if (
            wmsLegendUrl &&
            wmsLegendUrl.OnlineResource &&
            wmsLegendUrl.OnlineResource["xlink:href"]
          ) {
            legendUri = new URI(
              decodeURIComponent(wmsLegendUrl.OnlineResource["xlink:href"])
            );
            legendMimeType = wmsLegendUrl.Format;
          }
          const legend = !legendUri
            ? undefined
            : createStratumInstance(LegendTraits, {
                url: legendUri.toString(),
                urlMimeType: legendMimeType,
                title:
                  (capabilitiesLayers.size > 1 && layer?.Title) || undefined // Add layer Title as legend title if showing multiple layers
              });

          return {
            name: style.Name,
            title: style.Title,
            abstract: style.Abstract,
            legend: legend
          };
        })
      });
    }

    return result;
  }

  @computed
  get info(): StratumFromTraits<InfoSectionTraits>[] {
    const result: StratumFromTraits<InfoSectionTraits>[] = [];

    let firstDataDescription: string | undefined;

    result.push(
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.webMapServiceCatalogItem.serviceDescription"),
        contentAsObject: this.capabilities.Service as JsonObject
      })
    );

    const onlyHasSingleLayer = this.catalogItem.layersArray.length === 1;

    if (onlyHasSingleLayer) {
      // Clone the capabilitiesLayer as we'll modify it in a second
      const out = Object.assign(
        {},
        this.capabilitiesLayers.get(this.catalogItem.layersArray[0])
      ) as any;
      if (out !== undefined) {
        // remove a circular reference to the parent
        delete out._parent;

        result.push(
          createStratumInstance(InfoSectionTraits, {
            name: i18next.t("models.webMapServiceCatalogItem.dataDescription"),
            contentAsObject: out as JsonObject
          })
        );
      }
    }

    for (const layer of this.capabilitiesLayers.values()) {
      if (
        !layer ||
        !layer.Abstract ||
        containsAny(layer.Abstract, WebMapServiceCatalogItem.abstractsToIgnore)
      ) {
        continue;
      }

      const suffix =
        this.capabilitiesLayers.size === 1 ? "" : ` - ${layer.Title}`;
      const name = `Web Map Service Layer Description${suffix}`;
      result.push(
        createStratumInstance(InfoSectionTraits, {
          name,
          content: layer.Abstract
        })
      );
      firstDataDescription = firstDataDescription || layer.Abstract;
    }

    // Show the service abstract if there is one and if it isn't the Geoserver default "A compliant implementation..."
    const service = this.capabilities && this.capabilities.Service;
    if (service) {
      if (service.ContactInformation !== undefined) {
        result.push(
          createStratumInstance(InfoSectionTraits, {
            name: i18next.t("models.webMapServiceCatalogItem.serviceContact"),
            content: getServiceContactInformation(service.ContactInformation)
          })
        );
      }

      result.push(
        createStratumInstance(InfoSectionTraits, {
          name: i18next.t("models.webMapServiceCatalogItem.getCapabilitiesUrl"),
          content: this.catalogItem.getCapabilitiesUrl
        })
      );

      if (
        service &&
        service.Abstract &&
        !containsAny(
          service.Abstract,
          WebMapServiceCatalogItem.abstractsToIgnore
        ) &&
        service.Abstract !== firstDataDescription
      ) {
        result.push(
          createStratumInstance(InfoSectionTraits, {
            name: i18next.t(
              "models.webMapServiceCatalogItem.serviceDescription"
            ),
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
              "models.webMapServiceCatalogItem.accessConstraints"
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
    let layerDescriptions = [`Web Map Service Layer Description`];

    // If more than one layer, push layer description titles for each applicable layer
    if (this.capabilitiesLayers.size > 1) {
      layerDescriptions = [];
      this.capabilitiesLayers.forEach(layer => {
        if (
          layer &&
          layer.Abstract &&
          !containsAny(
            layer.Abstract,
            WebMapServiceCatalogItem.abstractsToIgnore
          )
        ) {
          layerDescriptions.push(
            `Web Map Service Layer Description - ${layer.Title}`
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
      i18next.t("models.webMapServiceCatalogItem.serviceDescription"),
      i18next.t("preview.resourceDescription"),
      i18next.t("preview.licence"),
      i18next.t("preview.accessConstraints"),
      i18next.t("models.webMapServiceCatalogItem.accessConstraints"),
      i18next.t("preview.author"),
      i18next.t("preview.contact"),
      i18next.t("models.webMapServiceCatalogItem.serviceContact"),
      i18next.t("preview.created"),
      i18next.t("preview.modified"),
      i18next.t("preview.updateFrequency"),
      i18next.t("models.webMapServiceCatalogItem.getCapabilitiesUrl")
    ];
  }

  @computed
  get shortReport() {
    const catalogItem = this.catalogItem;
    if (catalogItem.isShowingDiff) {
      const format = "yyyy/mm/dd";
      const d1 = dateFormat(catalogItem.firstDiffDate, format);
      const d2 = dateFormat(catalogItem.secondDiffDate, format);
      return `Showing difference image computed for ${catalogItem.diffStyleId} style on dates ${d1} and ${d2}`;
    }
  }

  @computed
  get rectangle(): StratumFromTraits<RectangleTraits> | undefined {
    const layers: CapabilitiesLayer[] = [...this.capabilitiesLayers.values()]
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
  get discreteTimes(): { time: string; tag: string | undefined }[] | undefined {
    const result = [];

    for (let layer of this.capabilitiesLayers.values()) {
      if (!layer) {
        continue;
      }
      const dimensions = this.capabilities.getInheritedValues(
        layer,
        "Dimension"
      );

      const timeDimension = dimensions.find(
        dimension => dimension.name.toLowerCase() === "time"
      );
      if (!timeDimension) {
        continue;
      }

      let extent: string = timeDimension;

      // WMS 1.1.1 puts dimension values in an Extent element instead of directly in the Dimension element.
      const extentElements = this.capabilities.getInheritedValues(
        layer,
        "Extent"
      );
      const extentElement = extentElements.find(
        extent => extent.name.toLowerCase() === "time"
      );
      if (extentElement) {
        extent = extentElement;
      }

      if (!extent || !extent.split) {
        continue;
      }

      const values = extent.split(",");
      for (let i = 0; i < values.length; ++i) {
        const value = values[i];
        const isoSegments = value.split("/");
        if (isoSegments.length === 1) {
          result.push({
            time: values[i],
            tag: undefined
          });
        } else {
          createDiscreteTimesFromIsoSegments(
            result,
            isoSegments,
            this.catalogItem.maxRefreshIntervals
          );
        }
      }
    }

    return result;
  }
}

class DiffStratum extends LoadableStratum(WebMapServiceCatalogItemTraits) {
  constructor(readonly catalogItem: WebMapServiceCatalogItem) {
    super();
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new DiffStratum(model as WebMapServiceCatalogItem) as this;
  }

  @computed
  get legends() {
    if (this.catalogItem.isShowingDiff && this.diffLegendUrl) {
      const urlMimeType =
        new URL(this.diffLegendUrl).searchParams.get("format") || undefined;
      return [
        createStratumInstance(LegendTraits, {
          url: this.diffLegendUrl,
          urlMimeType
        })
      ];
    }
    return undefined;
  }

  @computed
  get diffLegendUrl() {
    const diffStyleId = this.catalogItem.diffStyleId;
    const firstDate = this.catalogItem.firstDiffDate;
    const secondDate = this.catalogItem.secondDiffDate;
    if (diffStyleId && firstDate && secondDate) {
      return this.catalogItem.getLegendUrlForStyle(
        diffStyleId,
        JulianDate.fromIso8601(firstDate),
        JulianDate.fromIso8601(secondDate)
      );
    }
    return undefined;
  }

  @computed
  get disableDateTimeSelector() {
    return this.catalogItem.isShowingDiff;
  }
}

class WebMapServiceCatalogItem
  extends ExportableMixin(
    DiffableMixin(
      TimeFilterMixin(
        AsyncChartableMixin(
          GetCapabilitiesMixin(
            UrlMixin(
              CatalogMemberMixin(CreateModel(WebMapServiceCatalogItemTraits))
            )
          )
        )
      )
    )
  )
  implements SelectableDimensions {
  /**
   * The collection of strings that indicate an Abstract property should be ignored.  If these strings occur anywhere
   * in the Abstract, the Abstract will not be used.  This makes it easy to filter out placeholder data like
   * Geoserver's "A compliant implementation of WMS..." stock abstract.
   */
  static abstractsToIgnore = ["A compliant implementation of WMS"];

  // hide elements in the info section which might show information about the datasource
  _sourceInfoItemNames = [
    i18next.t("models.webMapServiceCatalogItem.getCapabilitiesUrl")
  ];

  static defaultParameters = {
    transparent: true,
    format: "image/png",
    exceptions: "application/vnd.ogc.se_xml",
    styles: "",
    tiled: true
  };

  static readonly type = "wms";
  readonly canZoomTo = true;
  readonly supportsSplitting = true;

  get type() {
    return WebMapServiceCatalogItem.type;
  }

  // TODO
  get isMappable() {
    return true;
  }

  async createGetCapabilitiesStratumFromParent(
    capabilities: WebMapServiceCapabilities
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

      const diffStratum = new DiffStratum(this);
      this.strata.set(DiffableMixin.diffStratumName, diffStratum);
    });
  }

  protected forceLoadChartItems(): Promise<void> {
    return this.forceLoadMetadata();
  }

  loadMapItems(): Promise<void> {
    return this.loadMetadata();
  }

  @computed get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "0d";
  }

  @computed
  get _canExportData() {
    return isDefined(this.linkedWcsCoverage) && isDefined(this.linkedWcsUrl);
  }

  _exportData() {
    return callWebCoverageService(this);
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
  get stylesArray(): ReadonlyArray<string> {
    if (Array.isArray(this.styles)) {
      return this.styles;
    } else if (this.styles) {
      return this.styles.split(",");
    } else {
      return [];
    }
  }

  @computed
  get discreteTimes() {
    const getCapabilitiesStratum:
      | GetCapabilitiesStratum
      | undefined = this.strata.get(
      GetCapabilitiesMixin.getCapabilitiesStratumName
    ) as GetCapabilitiesStratum;
    return getCapabilitiesStratum?.discreteTimes;
  }

  protected get defaultGetCapabilitiesUrl(): string | undefined {
    if (this.uri) {
      return this.uri
        .clone()
        .setSearch({
          service: "WMS",
          version: "1.3.0",
          request: "GetCapabilities"
        })
        .toString();
    } else {
      return undefined;
    }
  }

  @computed
  get canDiffImages(): boolean {
    const hasValidDiffStyles = this.availableDiffStyles.some(diffStyle =>
      this.styleSelectableDimensions?.[0]?.options?.find(
        style => style.id === diffStyle
      )
    );
    return hasValidDiffStyles === true;
  }

  showDiffImage(
    firstDate: JulianDate,
    secondDate: JulianDate,
    diffStyleId: string
  ) {
    if (this.canDiffImages === false) {
      return;
    }

    // A helper to get the diff tag given a date string
    const firstDateStr = this.getTagForTime(firstDate);
    const secondDateStr = this.getTagForTime(secondDate);
    this.setTrait(CommonStrata.user, "firstDiffDate", firstDateStr);
    this.setTrait(CommonStrata.user, "secondDiffDate", secondDateStr);
    this.setTrait(CommonStrata.user, "diffStyleId", diffStyleId);
    this.setTrait(CommonStrata.user, "isShowingDiff", true);
  }

  clearDiffImage() {
    this.setTrait(CommonStrata.user, "firstDiffDate", undefined);
    this.setTrait(CommonStrata.user, "secondDiffDate", undefined);
    this.setTrait(CommonStrata.user, "diffStyleId", undefined);
    this.setTrait(CommonStrata.user, "isShowingDiff", false);
  }

  getLegendUrlForStyle(
    styleId: string,
    firstDate?: JulianDate,
    secondDate?: JulianDate
  ) {
    const firstTag = firstDate && this.getTagForTime(firstDate);
    const secondTag = secondDate && this.getTagForTime(secondDate);
    const time = filterOutUndefined([firstTag, secondTag]).join(",");
    const layerName = this.availableStyles.find(style =>
      style.styles.some(s => s.name === styleId)
    )?.layerName;
    const uri = URI(
      `${this.url}?service=WMS&version=1.1.0&request=GetLegendGraphic&format=image/png&transparent=True`
    )
      .addQuery("layer", encodeURIComponent(layerName || ""))
      .addQuery("styles", encodeURIComponent(styleId));
    if (time) {
      uri.addQuery("time", time);
    }
    return uri.toString();
  }

  @computed
  get mapItems() {
    if (this.isShowingDiff === true) {
      return this._diffImageryParts ? [this._diffImageryParts] : [];
    }

    const result = [];

    const current = this._currentImageryParts;
    if (current) {
      result.push(current);
    }

    const next = this._nextImageryParts;
    if (next) {
      result.push(next);
    }

    return result;
  }

  @computed
  private get _currentImageryParts(): ImageryParts | undefined {
    const imageryProvider = this._createImageryProvider(
      this.currentDiscreteTimeTag
    );
    if (imageryProvider === undefined) {
      return undefined;
    }
    return {
      imageryProvider,
      alpha: this.opacity,
      show: this.show !== undefined ? this.show : true
    };
  }

  @computed
  private get _nextImageryParts(): ImageryParts | undefined {
    if (this.nextDiscreteTimeTag) {
      const imageryProvider = this._createImageryProvider(
        this.nextDiscreteTimeTag
      );
      if (imageryProvider === undefined) {
        return undefined;
      }
      return {
        imageryProvider,
        alpha: 0.0,
        show: true
      };
    } else {
      return undefined;
    }
  }

  @computed
  private get _diffImageryParts(): ImageryParts | undefined {
    const diffStyleId = this.diffStyleId;
    if (
      this.firstDiffDate === undefined ||
      this.secondDiffDate === undefined ||
      diffStyleId === undefined
    ) {
      return;
    }
    const time = `${this.firstDiffDate},${this.secondDiffDate}`;
    const imageryProvider = this._createImageryProvider(time);
    if (imageryProvider) {
      return {
        imageryProvider,
        alpha: this.opacity,
        show: this.show !== undefined ? this.show : true
      };
    }
    return undefined;
  }

  @computed
  get diffModeParameters() {
    return { styles: this.diffStyleId };
  }

  getTagForTime(date: JulianDate): string | undefined {
    const index = this.getDiscreteTimeIndex(date);
    return index !== undefined
      ? this.discreteTimesAsSortedJulianDates?.[index].tag
      : undefined;
  }

  private _createImageryProvider = createTransformerAllowUndefined(
    (time: string | undefined): WebMapServiceImageryProvider | undefined => {
      // Don't show anything on the map until GetCapabilities finishes loading.
      if (this.isLoadingMetadata) {
        return undefined;
      }
      if (this.url === undefined) {
        return undefined;
      }

      console.log(`Creating new ImageryProvider for time ${time}`);

      // Set dimensionParameters
      const dimensionParameters = formatDimensionsForOws(this.dimensions);

      if (time !== undefined) {
        dimensionParameters.time = time;
      }

      const diffModeParameters = this.isShowingDiff
        ? this.diffModeParameters
        : {};

      const parameters: { [key: string]: any } = {
        ...WebMapServiceCatalogItem.defaultParameters,
        ...this.parameters,
        ...dimensionParameters
      };

      if (isDefined(this.styles)) {
        parameters.styles = this.styles;
      }

      Object.assign(parameters, diffModeParameters);

      const maximumLevel = scaleDenominatorToLevel(this.minScaleDenominator);

      const queryParametersToRemove = [
        "request",
        "service",
        "x",
        "y",
        "width",
        "height",
        "bbox",
        "layers"
      ];

      const baseUrl = queryParametersToRemove.reduce(
        (url, parameter) => url.removeQuery(parameter),
        new URI(this.url)
      );

      let rectangle;

      if (
        this.clipToRectangle &&
        this.rectangle !== undefined &&
        this.rectangle.east !== undefined &&
        this.rectangle.west !== undefined &&
        this.rectangle.north !== undefined &&
        this.rectangle.south !== undefined
      ) {
        rectangle = Rectangle.fromDegrees(
          this.rectangle.west,
          this.rectangle.south,
          this.rectangle.east,
          this.rectangle.north
        );
      } else {
        rectangle = undefined;
      }

      const gcStratum: GetCapabilitiesStratum | undefined = this.strata.get(
        GetCapabilitiesMixin.getCapabilitiesStratumName
      ) as GetCapabilitiesStratum;

      let lyrs: string[] = [];
      if (this.layers && gcStratum !== undefined) {
        this.layersArray.forEach(function(lyr) {
          const gcLayer = gcStratum.capabilities.findLayer(lyr);
          if (gcLayer !== undefined && gcLayer.Name) lyrs.push(gcLayer.Name);
        });
      }

      const imageryOptions = {
        url: proxyCatalogItemUrl(this, baseUrl.toString()),
        layers: lyrs.length > 0 ? lyrs.join(",") : "",
        parameters: parameters,
        getFeatureInfoParameters: {
          ...dimensionParameters,
          styles: this.styles === undefined ? "" : this.styles
        },
        tilingScheme: /*defined(this.tilingScheme) ? this.tilingScheme :*/ new WebMercatorTilingScheme(),
        maximumLevel: maximumLevel,
        rectangle: rectangle
      };

      if (
        imageryOptions.maximumLevel !== undefined &&
        this.hideLayerAfterMinScaleDenominator
      ) {
        // Make Cesium request one extra level so we can tell the user what's happening and return a blank image.
        ++imageryOptions.maximumLevel;
      }

      const imageryProvider = new WebMapServiceImageryProvider(imageryOptions);
      if (
        maximumLevel !== undefined &&
        this.hideLayerAfterMinScaleDenominator
      ) {
        const realRequestImage = imageryProvider.requestImage;
        let messageDisplayed = false;

        imageryProvider.requestImage = (
          x: number,
          y: number,
          level: number
        ) => {
          if (level > maximumLevel) {
            if (!messageDisplayed) {
              this.terria.error.raiseEvent(
                new TerriaError({
                  title: i18next.t(
                    "models.webMapServiceCatalogItem.datasetScaleErrorTitle"
                  ),
                  message: i18next.t(
                    "models.webMapServiceCatalogItem.datasetScaleErrorMessage",
                    { name: this.name }
                  )
                })
              );
              messageDisplayed = true;
            }
            // cast to any because @types/cesium currently has the wrong signature for this function.
            return (<any>ImageryProvider).loadImage(
              imageryProvider,
              this.terria.baseUrl + "images/blank.png"
            );
          }
          return realRequestImage.call(imageryProvider, x, y, level);
        };
      }

      return imageryProvider;
    }
  );

  @computed
  get styleSelectableDimensions(): SelectableDimension[] {
    return this.availableStyles.map((layer, layerIndex) => {
      let name = "Styles";

      // If multiple layers -> prepend layer name to name
      if (this.availableStyles.length > 1) {
        // Attempt to get layer title from GetCapabilitiesStratum
        const layerTitle =
          layer.layerName &&
          (this.strata.get(
            GetCapabilitiesMixin.getCapabilitiesStratumName
          ) as GetCapabilitiesStratum).capabilitiesLayers.get(layer.layerName)
            ?.Title;

        name = `${layerTitle ||
          layer.layerName ||
          `Layer ${layerIndex + 1}`} styles`;
      }

      return {
        name,
        id: `${this.uniqueId}-${layer.layerName}-styles`,
        options: filterOutUndefined(
          layer.styles.map(function(s) {
            if (isDefined(s.name)) {
              return {
                name: s.title || s.name || "",
                id: s.name as string
              };
            }
          })
        ),

        // Set selectedId to value stored in `styles` trait for this `layerIndex` or the first available style value
        // The `styles` parameter is CSV, a style for each layer
        selectedId:
          this.styles?.split(",")?.[layerIndex] || layer.styles[0]?.name,

        setDimensionValue: (stratumId: string, newStyle: string) => {
          runInAction(() => {
            const styles = this.styleSelectableDimensions.map(
              style => style.selectedId || ""
            );
            styles[layerIndex] = newStyle;
            this.setTrait(stratumId, "styles", styles.join(","));
          });
        },
        disable: this.isShowingDiff
      };
    });
  }

  @computed
  get wmsDimensionSelectableDimensions(): SelectableDimension[] {
    const dimensions: SelectableDimension[] = [];

    // For each layer -> For each dimension
    this.availableDimensions.forEach(layer => {
      layer.dimensions.forEach(dim => {
        // Only add dimensions if hasn't already been added (multiple layers may have the same dimension)
        if (
          !isDefined(dim.name) ||
          dim.values.length < 2 ||
          dimensions.findIndex(findDim => findDim.name === dim.name) !== -1
        ) {
          return;
        }

        dimensions.push({
          name: dim.name,
          id: `${this.uniqueId}-${dim.name}`,
          options: dim.values.map(value => {
            let name = value;
            // Add units and unitSybol if defined
            if (typeof dim.units === "string" && dim.units !== "") {
              if (typeof dim.unitSymbol === "string" && dim.unitSymbol !== "") {
                name = `${value} (${dim.units} ${dim.unitSymbol})`;
              } else {
                name = `${value} (${dim.units})`;
              }
            }
            return {
              name,
              id: value
            };
          }),

          // Set selectedId to value stored in `dimensions` trait, the default value, or the first available value
          selectedId:
            this.dimensions?.[dim.name]?.toString() ||
            dim.default ||
            dim.values[0],

          setDimensionValue: (stratumId: string, newDimension: string) => {
            let newDimensions: any = {};

            newDimensions[dim.name!] = newDimension;

            if (isDefined(this.dimensions)) {
              newDimensions = combine(newDimensions, this.dimensions);
            }
            runInAction(() => {
              this.setTrait(stratumId, "dimensions", newDimensions);
            });
          }
        });
      });
    });

    return dimensions;
  }

  @computed
  get selectableDimensions() {
    return filterOutUndefined([
      ...this.wmsDimensionSelectableDimensions,
      ...this.styleSelectableDimensions
    ]);
  }
}

function scaleDenominatorToLevel(
  minScaleDenominator: number | undefined
): number | undefined {
  if (minScaleDenominator == undefined || minScaleDenominator <= 0.0) {
    return undefined;
  }

  var metersPerPixel = 0.00028; // from WMS 1.3.0 spec section 7.2.4.6.9
  var tileWidth = 256;

  var circumferenceAtEquator = 2 * Math.PI * Ellipsoid.WGS84.maximumRadius;
  var distancePerPixelAtLevel0 = circumferenceAtEquator / tileWidth;
  var level0ScaleDenominator = distancePerPixelAtLevel0 / metersPerPixel;

  // 1e-6 epsilon from WMS 1.3.0 spec, section 7.2.4.6.9.
  var ratio = level0ScaleDenominator / (minScaleDenominator - 1e-6);
  var levelAtMinScaleDenominator = Math.log(ratio) / Math.log(2);
  return levelAtMinScaleDenominator | 0;
}

function createDiscreteTimesFromIsoSegments(
  result: StratumFromTraits<DiscreteTimeTraits>[],
  isoSegments: string[],
  maxRefreshIntervals: number
) {
  // Note parseZone will create a moment with the original specified UTC offset if there is one,
  // but if not, it will create a moment in UTC.
  const start = moment.parseZone(isoSegments[0]);
  const stop = moment.parseZone(isoSegments[1]);

  // Note WMS uses extension ISO19128 of ISO8601; ISO 19128 allows start/end/periodicity
  // and does not use the "R[n]/" prefix for repeated intervals
  // eg. Data refreshed every 30 min: 2000-06-18T14:30Z/2000-06-18T14:30Z/PT30M
  // See 06-042_OpenGIS_Web_Map_Service_WMS_Implementation_Specification.pdf section D.4
  let duration: moment.Duration | undefined;
  if (isoSegments[2] && isoSegments[2].length > 0) {
    duration = moment.duration(isoSegments[2]);
  }

  // If we don't have a duration, or the duration is zero, then assume this is
  // a continuous interval for which it's valid to request _any_ time. But
  // we need to generate some discrete times, so choose an appropriate
  // periodicity.
  if (
    duration === undefined ||
    !duration.isValid() ||
    duration.asSeconds() === 0.0
  ) {
    const spanMilliseconds = stop.diff(start);

    // These times, in milliseconds, are approximate;
    const second = 1000;
    const minute = 60 * second;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 31 * day;
    const year = 366 * day;
    const decade = 10 * year;

    if (spanMilliseconds <= 1000) {
      duration = moment.duration(1, "millisecond");
    } else if (spanMilliseconds <= 1000 * second) {
      duration = moment.duration(1, "second");
    } else if (spanMilliseconds <= 1000 * minute) {
      duration = moment.duration(1, "minute");
    } else if (spanMilliseconds <= 1000 * hour) {
      duration = moment.duration(1, "hour");
    } else if (spanMilliseconds <= 1000 * day) {
      duration = moment.duration(1, "day");
    } else if (spanMilliseconds <= 1000 * week) {
      duration = moment.duration(1, "week");
    } else if (spanMilliseconds <= 1000 * month) {
      duration = moment.duration(1, "month");
    } else if (spanMilliseconds <= 1000 * year) {
      duration = moment.duration(1, "year");
    } else if (spanMilliseconds <= 1000 * decade) {
      duration = moment.duration(10, "year");
    } else {
      duration = moment.duration(100, "year");
    }
  }

  let current = start.clone();
  let count = 0;

  // Add intervals starting at start until:
  //    we go past the stop date, or
  //    we go past the max limit
  while (
    current &&
    current.isSameOrBefore(stop) &&
    count < maxRefreshIntervals
  ) {
    result.push({
      time: formatMomentForWms(current, duration),
      tag: undefined
    });
    current.add(duration);
    ++count;
  }

  if (count >= maxRefreshIntervals) {
    console.warn(
      "Interval has more than the allowed number of discrete times. Consider setting `maxRefreshIntervals`."
    );
  } else if (!current.isSame(stop)) {
    result.push({
      time: formatMomentForWms(stop, duration),
      tag: undefined
    });
  }
}

function formatMomentForWms(m: moment.Moment, duration: moment.Duration) {
  // If the original moment only contained a date (not a time), and the
  // duration doesn't include hours, minutes, or seconds, format as a date
  // only instead of a date+time.  Some WMS servers get confused when
  // you add a time on them.
  if (
    duration.hours() > 0 ||
    duration.minutes() > 0 ||
    duration.seconds() > 0 ||
    duration.milliseconds() > 0
  ) {
    return m.format();
  } else {
    const creationData = m.creationData();
    if (creationData) {
      const format = creationData.format;
      if (typeof format === "string" && format.indexOf("T") < 0) {
        return m.format(format);
      }
    }
  }

  return m.format();
}

/**
 * Add `_dim` prefix to dimensions for OWS (WMS, WCS...) excluding time, styles and elevation
 */
export function formatDimensionsForOws(
  dimensions: { [key: string]: string } | undefined
) {
  if (!isDefined(dimensions)) {
    return {};
  }
  return Object.entries(dimensions).reduce<{ [key: string]: string }>(
    (formattedDimensions, [key, value]) =>
      // elevation is specified as simply "elevation", styles is specified as "styles"
      // Other (custom) dimensions are prefixed with 'dim_'.
      // See WMS 1.3.0 spec section C.3.2 and C.3.3.
      {
        formattedDimensions[
          ["time", "styles", "elevation"].includes(key?.toLowerCase())
            ? key
            : `dim_${key}`
        ] = value;
        return formattedDimensions;
      },
    {}
  );
}

function getServiceContactInformation(
  contactInfo: CapabilitiesContactInformation
) {
  const primary = contactInfo.ContactPersonPrimary;
  let text = "";
  if (isDefined(primary)) {
    if (
      isDefined(primary.ContactOrganization) &&
      primary.ContactOrganization.length > 0 &&
      // Geoserver default
      primary.ContactOrganization !== "The Ancient Geographers"
    ) {
      text += primary.ContactOrganization + "<br/>";
    }
  }

  if (
    isDefined(contactInfo.ContactElectronicMailAddress) &&
    contactInfo.ContactElectronicMailAddress.length > 0 &&
    // Geoserver default
    contactInfo.ContactElectronicMailAddress !== "claudius.ptolomaeus@gmail.com"
  ) {
    text += `[${contactInfo.ContactElectronicMailAddress}](mailto:${contactInfo.ContactElectronicMailAddress})`;
  }

  return text;
}

export default WebMapServiceCatalogItem;
