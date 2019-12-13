// const mobx = require('mobx');
// const mobxUtils = require('mobx-utils');
// Problems in current architecture:
// 1. After loading, can't tell what user actually set versus what came from e.g. GetCapabilities.
//  Solution: layering
// 2. CkanCatalogItem producing a WebMapServiceCatalogItem on load
// 3. Observable spaghetti
//  Solution: think in terms of pipelines with computed observables, document patterns.
// 4. All code for all catalog item types needs to be loaded before we can do anything.
import { computed, runInAction, trace } from "mobx";
import moment from "moment";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import WebMapServiceImageryProvider from "terriajs-cesium/Source/Scene/WebMapServiceImageryProvider";
import URI from "urijs";
import containsAny from "../Core/containsAny";
import createTransformerAllowUndefined from "../Core/createTransformerAllowUndefined";
import filterOutUndefined from "../Core/filterOutUndefined";
import isReadOnlyArray from "../Core/isReadOnlyArray";
import TerriaError from "../Core/TerriaError";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import DiscretelyTimeVaryingMixin from "../ModelMixins/DiscretelyTimeVaryingMixin";
import GetCapabilitiesMixin from "../ModelMixins/GetCapabilitiesMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import DiscreteTimeTraits from "../Traits/DiscreteTimeTraits";
import LegendTraits from "../Traits/LegendTraits";
import { RectangleTraits } from "../Traits/MappableTraits";
import WebMapServiceCatalogItemTraits, {
  WebMapServiceAvailableLayerStylesTraits
} from "../Traits/WebMapServiceCatalogItemTraits";
import CreateModel from "./CreateModel";
import createStratumInstance from "./createStratumInstance";
import LoadableStratum from "./LoadableStratum";
import Mappable, { ImageryParts } from "./Mappable";
import { BaseModel } from "./Model";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumFromTraits from "./StratumFromTraits";
import WebMapServiceCapabilities, {
  CapabilitiesLayer,
  CapabilitiesStyle,
  getRectangleFromLayer
} from "./WebMapServiceCapabilities";

interface LegendUrl {
  url: string;
  mimeType?: string;
}

interface WebMapServiceStyle {
  name: string;
  title: string;
  abstract?: string;
  legendUrl?: LegendUrl;
}

interface WebMapServiceStyles {
  [layerName: string]: WebMapServiceStyle[];
}

class GetCapabilitiesStratum extends LoadableStratum(
  WebMapServiceCatalogItemTraits
) {
  static load(
    catalogItem: WebMapServiceCatalogItem
  ): Promise<GetCapabilitiesStratum> {
    console.log("Loading GetCapabilities");

    if (catalogItem.getCapabilitiesUrl === undefined) {
      return Promise.reject(
        new TerriaError({
          title: "Unable to load GetCapabilities",
          message:
            "Could not load the Web Map Service (WMS) GetCapabilities document because the catalog item does not have a `url`."
        })
      );
    }

    const proxiedUrl = proxyCatalogItemUrl(
      catalogItem,
      catalogItem.getCapabilitiesUrl,
      catalogItem.getCapabilitiesCacheDuration
    );
    return WebMapServiceCapabilities.fromUrl(proxiedUrl).then(capabilities => {
      return new GetCapabilitiesStratum(catalogItem, capabilities);
    });
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
        layerAvailableStyles.styles !== undefined
      ) {
        // Use the first style if none is explicitly specified.
        // Note that the WMS 1.3.0 spec (section 7.3.3.4) explicitly says we can't assume this,
        // but because the server has no other way of indicating the default style, let's hope that
        // sanity prevails.
        const layerStyle =
          style === undefined
            ? layerAvailableStyles.styles.length > 0
              ? layerAvailableStyles.styles[0]
              : undefined
            : layerAvailableStyles.styles.find(
                candidate => candidate.name === style
              );
        if (layerStyle !== undefined && layerStyle.legend !== undefined) {
          result.push(<StratumFromTraits<LegendTraits>>(
            (<unknown>layerStyle.legend)
          ));
        }
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
                urlMimeType: legendMimeType
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
          WebMapServiceCatalogItem.abstractsToIgnore
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
  get discreteTimes(): StratumFromTraits<DiscreteTimeTraits>[] | undefined {
    const result: StratumFromTraits<DiscreteTimeTraits>[] = [];

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

class WebMapServiceCatalogItem
  extends DiscretelyTimeVaryingMixin(
    GetCapabilitiesMixin(
      UrlMixin(CatalogMemberMixin(CreateModel(WebMapServiceCatalogItemTraits)))
    )
  )
  implements Mappable {
  /**
   * The collection of strings that indicate an Abstract property should be ignored.  If these strings occur anywhere
   * in the Abstract, the Abstract will not be used.  This makes it easy to filter out placeholder data like
   * Geoserver's "A compliant implementation of WMS..." stock abstract.
   */
  static abstractsToIgnore = ["A compliant implementation of WMS"];

  static defaultParameters = {
    transparent: true,
    format: "image/png",
    exceptions: "application/vnd.ogc.se_xml",
    styles: "",
    tiled: true
  };

  static readonly type = "wms";
  readonly canZoomTo = true;
  readonly showsInfo = true;
  readonly supportsSplitting = true;

  get type() {
    return WebMapServiceCatalogItem.type;
  }

  // TODO
  get isMappable() {
    return true;
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

  loadMapItems(): Promise<void> {
    return this.loadMetadata();
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
  get mapItems() {
    trace();
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
    trace();
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
    trace();
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

  private _createImageryProvider = createTransformerAllowUndefined(
    (
      time: string | undefined
    ): Cesium.WebMapServiceImageryProvider | undefined => {
      // Don't show anything on the map until GetCapabilities finishes loading.
      if (this.isLoadingMetadata) {
        return undefined;
      }
      if (this.url === undefined) {
        return undefined;
      }

      console.log(`Creating new ImageryProvider for time ${time}`);

      const parameters: any = {
        ...WebMapServiceCatalogItem.defaultParameters
      };

      if (time !== undefined) {
        parameters.time = time;
      }

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

      const imageryOptions = {
        url: proxyCatalogItemUrl(this, baseUrl.toString()),
        layers: this.layers || "",
        parameters: parameters,
        tilingScheme: /*defined(this.tilingScheme) ? this.tilingScheme :*/ new WebMercatorTilingScheme(),
        maximumLevel: maximumLevel,
        rectangle: this.rectangle
          ? Rectangle.fromDegrees(
              this.rectangle.west,
              this.rectangle.south,
              this.rectangle.east,
              this.rectangle.north
            )
          : undefined
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
                  title: "Dataset will not be shown at this scale",
                  message:
                    'The "' +
                    this.name +
                    '" dataset will not be shown when zoomed in this close to the map because the data custodian has ' +
                    "indicated that the data is not intended or suitable for display at this scale.  Click the dataset's Info button on the " +
                    "Now Viewing tab for more information about the dataset and the data custodian."
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

export default WebMapServiceCatalogItem;
