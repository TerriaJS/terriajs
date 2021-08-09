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
import combine from "terriajs-cesium/Source/Core/combine";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import GeographicTilingScheme from "terriajs-cesium/Source/Core/GeographicTilingScheme";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import WebMapServiceImageryProvider from "terriajs-cesium/Source/Scene/WebMapServiceImageryProvider";
import URI from "urijs";
import containsAny from "../../../Core/containsAny";
import createDiscreteTimesFromIsoSegments from "../../../Core/createDiscreteTimes";
import createTransformerAllowUndefined from "../../../Core/createTransformerAllowUndefined";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import isReadOnlyArray from "../../../Core/isReadOnlyArray";
import { JsonObject } from "../../../Core/Json";
import TerriaError from "../../../Core/TerriaError";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import ChartableMixin from "../../../ModelMixins/ChartableMixin";
import DiffableMixin from "../../../ModelMixins/DiffableMixin";
import ExportableMixin from "../../../ModelMixins/ExportableMixin";
import GetCapabilitiesMixin from "../../../ModelMixins/GetCapabilitiesMixin";
import { ImageryParts } from "../../../ModelMixins/MappableMixin";
import TileErrorHandlerMixin from "../../../ModelMixins/TileErrorHandlerMixin";
import TimeFilterMixin from "../../../ModelMixins/TimeFilterMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import SelectableDimensions, {
  SelectableDimension
} from "../../SelectableDimensions";
import { terriaTheme } from "../../../ReactViews/StandardUserInterface/StandardTheme";
import {
  InfoSectionTraits,
  MetadataUrlTraits
} from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import LegendTraits from "../../../Traits/TraitsClasses/LegendTraits";
import { RectangleTraits } from "../../../Traits/TraitsClasses/MappableTraits";
import WebMapServiceCatalogItemTraits, {
  SUPPORTED_CRS_3857,
  SUPPORTED_CRS_4326,
  WebMapServiceAvailableLayerDimensionsTraits,
  WebMapServiceAvailableLayerStylesTraits,
  WebMapServiceAvailableStyleTraits
} from "../../../Traits/TraitsClasses/WebMapServiceCatalogItemTraits";
import { callWebCoverageService } from "./callWebCoverageService";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import Model, { BaseModel } from "../../Definition/Model";
import { CapabilitiesStyle } from "./OwsInterfaces";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import WebMapServiceCapabilities, {
  CapabilitiesContactInformation,
  CapabilitiesDimension,
  CapabilitiesLayer,
  getRectangleFromLayer,
  MetadataURL
} from "./WebMapServiceCapabilities";
import WebMapServiceCatalogGroup from "./WebMapServiceCatalogGroup";

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

  @computed get metadataUrls() {
    const metadataUrls: MetadataURL[] = [];

    Array.from(this.capabilitiesLayers.values()).forEach(layer => {
      if (!layer?.MetadataURL) return;
      Array.isArray(layer?.MetadataURL)
        ? metadataUrls.push(...layer?.MetadataURL)
        : metadataUrls.push(layer?.MetadataURL as MetadataURL);
    });

    return metadataUrls
      .filter(m => m.OnlineResource?.["xlink:href"])
      .map(m =>
        createStratumInstance(MetadataUrlTraits, {
          url: m.OnlineResource!["xlink:href"]
        })
      );
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

  /**
 * **How we determine WMS legends (in order)**
  1. Defined manually in catalog JSON
  2. If `style` is undefined, and server doesn't support `GetLegendGraphic`, we must select first style as default - as there is no way to know what the default style is, and to request a legend for it
  3. If `style` is is set and it has a `legendUrl` -> use it!
  4. If server supports `GetLegendGraphic`, we can request a legend (with or without `style` parameter)
 */
  @computed
  get legends(): StratumFromTraits<LegendTraits>[] | undefined {
    const availableStyles = this.catalogItem.availableStyles || [];
    const layers = this.catalogItem.layersArray;
    const styles = this.catalogItem.stylesArray;

    const result: StratumFromTraits<LegendTraits>[] = [];

    for (let i = 0; i < layers.length; ++i) {
      const layer = layers[i];
      const style = i < styles.length ? styles[i] : undefined;

      let legendUri: uri.URI | undefined;
      let legendUrlMimeType: string | undefined;
      let legendScaling: number | undefined;

      const layerAvailableStyles = availableStyles.find(
        candidate => candidate.layerName === layer
      )?.styles;

      let layerStyle: Model<WebMapServiceAvailableStyleTraits> | undefined;

      if (isDefined(style)) {
        // Attempt to find layer style based on AvailableStyleTraits
        layerStyle = layerAvailableStyles?.find(
          candidate => candidate.name === style
        );
      }

      // If no style is selected and this WMS doesn't support GetLegendGraphics - we must use the first style if none is explicitly specified.
      // (If WMS supports GetLegendGraphics we can use it and omit style parameter to get the "default" style's legend)
      if (!isDefined(layerStyle) && !this.catalogItem.supportsGetLegendGraphic)
        layerStyle = layerAvailableStyles?.[0];

      // If legend found - proxy URL and set mimetype
      if (layerStyle?.legend?.url) {
        legendUri = URI(
          proxyCatalogItemUrl(this.catalogItem, layerStyle.legend.url)
        );

        legendUrlMimeType = layerStyle.legend.urlMimeType;
      }

      // If no legends found and WMS supports GetLegendGraphics - make one up!
      if (
        !isDefined(legendUri) &&
        isDefined(this.catalogItem.url) &&
        this.catalogItem.supportsGetLegendGraphic
      ) {
        legendUri = URI(
          proxyCatalogItemUrl(
            this.catalogItem,
            this.catalogItem.url.split("?")[0]
          )
        );
        legendUri
          .setQuery("service", "WMS")
          .setQuery("version", "1.3.0")
          .setQuery("request", "GetLegendGraphic")
          .setQuery("format", "image/png")
          .setQuery("layer", layer);

        // From OGC — about style property for GetLegendGraphic request:
        // If not present, the default style is selected. The style may be any valid style available for a layer, including non-SLD internally-defined styles.
        if (style) {
          legendUri.setQuery("style", style);
        }
        legendUrlMimeType = "image/png";
      }

      if (isDefined(legendUri)) {
        // Add geoserver related LEGEND_OPTIONS to match terria styling (if supported)
        if (
          this.catalogItem.isGeoServer &&
          legendUri.hasQuery("request", "GetLegendGraphic")
        ) {
          let legendOptions =
            "fontName:Courier;fontStyle:bold;fontSize:12;forceLabels:on;fontAntiAliasing:true;labelMargin:5";

          // Geoserver fontColor must be a hex value - use `textLight` theme colour
          let fontColor = terriaTheme.textLight.split("#")?.[1];
          if (isDefined(fontColor)) {
            // If fontColor is a 3-character hex -> turn into 6
            if (fontColor.length === 3) {
              fontColor = `${fontColor[0]}${fontColor[0]}${fontColor[1]}${fontColor[1]}${fontColor[2]}${fontColor[2]}`;
            }
            legendOptions += `;fontColor:0x${fontColor}`;
          }

          legendOptions += ";dpi:182"; // enable if we can scale the image back down by 50%.
          legendScaling = 0.5;
          legendUri.setQuery("LEGEND_OPTIONS", legendOptions);
          legendUri.setQuery("transparent", "true");
        }

        // Add colour scale range params if supported
        if (
          this.catalogItem.supportsColorScaleRange &&
          this.catalogItem.colorScaleRange
        ) {
          legendUri.setQuery(
            "colorscalerange",
            this.catalogItem.colorScaleRange
          );
        }
        result.push(
          createStratumInstance(LegendTraits, {
            url: legendUri.toString(),
            urlMimeType: legendUrlMimeType,
            imageScaling: legendScaling
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

  @computed get crs() {
    // Get set of supported CRS from layer hierarchy
    const layerCrs = new Set<string>();
    this.capabilitiesLayers.forEach(layer => {
      if (layer) {
        const srs = this.capabilities.getInheritedValues(layer, "SRS");
        const crs = this.capabilities.getInheritedValues(layer, "CRS");
        [
          ...(Array.isArray(srs) ? srs : [srs]),
          ...(Array.isArray(crs) ? crs : [crs])
        ].forEach(c => layerCrs.add(c));
      }
    });

    // Note order is important here, the first one found will be used
    const supportedCrs = [...SUPPORTED_CRS_3857, ...SUPPORTED_CRS_4326];

    // If nothing is supported, ask for EPSG:3857, and hope for the best.
    return supportedCrs.find(crs => layerCrs.has(crs)) ?? "EPSG:3857";
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
        contentAsObject: this.capabilities.Service as JsonObject,
        // Hide big ugly table by default
        show: false
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
        // The Dimension object is really weird and has a bunch of stray text in there
        if ("Dimension" in out) {
          const goodDimension: any = {};
          Object.keys(out.Dimension).forEach((k: any) => {
            if (isNaN(k)) {
              goodDimension[k] = out.Dimension[k];
            }
          });
          out.Dimension = goodDimension;
        }

        // remove a circular reference to the parent
        delete out._parent;

        try {
          result.push(
            createStratumInstance(InfoSectionTraits, {
              name: i18next.t(
                "models.webMapServiceCatalogItem.dataDescription"
              ),
              contentAsObject: out as JsonObject,
              // Hide big ugly table by default
              show: false
            })
          );
        } catch (e) {
          console.log(
            `FAILED to create InfoSection with WMS layer Capabilities`
          );
          console.log(e);
        }
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
    const keyword = this.capabilities?.Service?.KeywordList?.Keyword;
    return (
      (isReadOnlyArray(keyword) && keyword.indexOf("GEOSERVER") >= 0) ||
      keyword === "GEOSERVER" ||
      this.catalogItem.url?.toLowerCase().includes("geoserver")
    );
  }

  // TODO - There is possibly a better way to do this
  @computed
  get isThredds(): boolean {
    if (
      this.catalogItem.url &&
      (this.catalogItem.url.indexOf("thredds") > -1 ||
        this.catalogItem.url.indexOf("tds") > -1)
    ) {
      return true;
    }
    return false;
  }

  // TODO - Geoserver also support NCWMS via a plugin, just need to work out how to detect that
  @computed
  get isNcWMS(): boolean {
    if (this.catalogItem.isThredds) return true;
    return false;
  }

  @computed
  get isEsri(): boolean {
    if (this.catalogItem.url !== undefined)
      return this.catalogItem.url.indexOf("MapServer/WMSServer") > -1;
    return false;
  }

  @computed
  get supportsGetLegendGraphic(): boolean {
    return (
      isDefined(this.capabilities?.json?.["xmlns:sld"]) ||
      isDefined(
        this.capabilities?.json?.Capability?.Request?.GetLegendGraphic
      ) ||
      (this.catalogItem.isGeoServer ?? false) ||
      (this.catalogItem.isNcWMS ?? false)
    );
  }

  @computed
  get supportsColorScaleRange(): boolean {
    return this.catalogItem.isNcWMS;
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
            isoSegments[0],
            isoSegments[1],
            isoSegments[2],
            this.catalogItem.maxRefreshIntervals
          );
        }
      }
    }

    return result;
  }

  @computed get currentTime() {
    // Get default times for all layers
    const defaultTimes = filterOutUndefined(
      Array.from(this.capabilitiesLayers).map(([layerName, layer]) => {
        if (!layer) return;
        const dimensions = this.capabilities.getInheritedValues(
          layer,
          "Dimension"
        );

        const timeDimension = dimensions.find(
          dimension => dimension.name.toLowerCase() === "time"
        );

        return timeDimension?.default;
      })
    );

    // Return first default time
    return defaultTimes[0];
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
  extends TileErrorHandlerMixin(
    ExportableMixin(
      DiffableMixin(
        TimeFilterMixin(
          ChartableMixin(
            GetCapabilitiesMixin(
              UrlMixin(
                CatalogMemberMixin(CreateModel(WebMapServiceCatalogItemTraits))
              )
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

  _webMapServiceCatalogGroup: undefined | WebMapServiceCatalogGroup = undefined;

  static defaultParameters = {
    transparent: true,
    format: "image/png",
    exceptions: "application/vnd.ogc.se_xml",
    styles: "",
    tiled: true
  };

  static readonly type = "wms";

  get type() {
    return WebMapServiceCatalogItem.type;
  }

  @computed
  get shortReport(): string | undefined {
    if (
      this.tilingScheme instanceof GeographicTilingScheme &&
      this.terria.currentViewer.type === "Leaflet"
    ) {
      return i18next.t("map.cesium.notWebMercatorTilingScheme", this);
    }
    return super.shortReport;
  }

  @computed
  get colorScaleRange(): string | undefined {
    if (this.supportsColorScaleRange) {
      return `${this.colorScaleMinimum},${this.colorScaleMaximum}`;
    }
    return undefined;
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

  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
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
  get tilingScheme() {
    if (this.crs) {
      if (SUPPORTED_CRS_3857.includes(this.crs))
        return new WebMercatorTilingScheme();
      if (SUPPORTED_CRS_4326.includes(this.crs))
        return new GeographicTilingScheme();
    }

    return new WebMercatorTilingScheme();
  }

  @computed
  private get _currentImageryParts(): ImageryParts | undefined {
    const imageryProvider = this._createImageryProvider(
      this.currentDiscreteTimeTag
    );
    if (imageryProvider === undefined) {
      return undefined;
    }

    imageryProvider.enablePickFeatures = true;

    return {
      imageryProvider,
      alpha: this.opacity,
      show: this.show,
      clippingRectangle: this.clipToRectangle ? this.cesiumRectangle : undefined
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

      imageryProvider.enablePickFeatures = false;

      return {
        imageryProvider,
        alpha: 0.0,
        show: true,
        clippingRectangle: this.clipToRectangle
          ? this.cesiumRectangle
          : undefined
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
        show: this.show,
        clippingRectangle: this.clipToRectangle
          ? this.cesiumRectangle
          : undefined
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

      if (this.crs) {
        parameters.crs = this.crs;
      }

      if (this.supportsColorScaleRange) {
        parameters.COLORSCALERANGE = this.colorScaleRange;
      }

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

      const imageryOptions: WebMapServiceImageryProvider.ConstructorOptions = {
        url: proxyCatalogItemUrl(this, baseUrl.toString()),
        layers: lyrs.length > 0 ? lyrs.join(",") : "",
        parameters: parameters,
        getFeatureInfoParameters: {
          ...dimensionParameters,
          feature_count:
            1 +
            (this.maximumShownFeatureInfos ??
              this.terria.configParameters.defaultMaximumShownFeatureInfos),
          styles: this.styles === undefined ? "" : this.styles
        },
        tileWidth: this.tileWidth,
        tileHeight: this.tileHeight,
        tilingScheme: this.tilingScheme,
        maximumLevel: maximumLevel,
        credit: this.attribution
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
              this.terria.raiseErrorToUser(
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

      const options = filterOutUndefined(
        layer.styles.map(function(s) {
          if (isDefined(s.name)) {
            return {
              name: s.title || s.name || "",
              id: s.name as string
            };
          }
        })
      );

      // Try to set selectedId to value stored in `styles` trait for this `layerIndex`
      // The `styles` parameter is CSV, a style for each layer
      let selectedId = this.styles?.split(",")?.[layerIndex];

      // There is no way of finding out default style if no style has been selected :(
      // If !supportsGetLegendGraphic - we have to just use the first available style
      if (
        !isDefined(selectedId) &&
        options.length > 0 &&
        !this.supportsGetLegendGraphic
      ) {
        selectedId = options[0].id;
      }

      return {
        name,
        id: `${this.uniqueId}-${layer.layerName}-styles`,
        options,
        selectedId,
        setDimensionValue: (stratumId: string, newStyle: string) => {
          runInAction(() => {
            const styles = this.styleSelectableDimensions.map(
              style => style.selectedId || ""
            );
            styles[layerIndex] = newStyle;
            this.setTrait(stratumId, "styles", styles.join(","));
          });
        },
        // Only allow undefined if more then one style (if there is only one style then it is the default style!) - and WMS server supports GetLegendGraphic (otherwise we can't request default styles!)
        allowUndefined: this.supportsGetLegendGraphic && options.length > 1,
        undefinedLabel: i18next.t(
          "models.webMapServiceCatalogItem.defaultStyleLabel"
        ),
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
    if (this.disableDimensionSelectors) {
      return super.selectableDimensions;
    }

    return filterOutUndefined([
      ...super.selectableDimensions,
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
