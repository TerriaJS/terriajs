// const mobx = require('mobx');
// const mobxUtils = require('mobx-utils');
// Problems in current architecture:
// 1. After loading, can't tell what user actually set versus what came from e.g. GetCapabilities.
//  Solution: layering
// 2. CkanCatalogItem producing a WebMapServiceCatalogItem on load
// 3. Observable spaghetti
//  Solution: think in terms of pipelines with computed observables, document patterns.
// 4. All code for all catalog item types needs to be loaded before we can do anything.
import { autorun, computed, observable, runInAction, trace } from "mobx";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import WebMapServiceImageryProvider from "terriajs-cesium/Source/Scene/WebMapServiceImageryProvider";
import URI from "urijs";
import containsAny from "../Core/containsAny";
import createTransformerAllowUndefined from "../Core/createTransformerAllowUndefined";
import isReadOnlyArray from "../Core/isReadOnlyArray";
import TerriaError from "../Core/TerriaError";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import DiscretelyTimeVaryingMixin from "../ModelMixins/DiscretelyTimeVaryingMixin";
import GetCapabilitiesMixin from "../ModelMixins/GetCapabilitiesMixin";
import GroupMixin from "../ModelMixins/GroupMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import DiscreteTimeTraits from "../Traits/DiscreteTimeTraits";
import { RectangleTraits } from "../Traits/MappableTraits";
import WebMapServiceCatalogItemTraits, {
  LegendTraits,
  WebMapServiceAvailableLayerStylesTraits
} from "../Traits/WebMapServiceCatalogItemTraits";
import CreateModel from "./CreateModel";
import createStratumInstance from "./createStratumInstance";
import LoadableStratum from "./LoadableStratum";
import Mappable, { ImageryParts } from "./Mappable";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumFromTraits from "./StratumFromTraits";
import Terria from "./Terria";
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

          const legendUrl = !legendUri
            ? undefined
            : {
                url: legendUri.toString(),
                mimeType: legendMimeType
              };

          return {
            name: style.Name,
            title: style.Title,
            abstract: style.Abstract,
            legendUrl: legendUrl
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
      const name = `Data Description${suffix}`;

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
        traits.name = "Service Description";
        traits.content = service.Abstract;
        result.push(traits);
      }

      // Show the Access Constraints if it isn't "none" (because that's the default, and usually a lie).
      if (
        service.AccessConstraints &&
        !/^none$/i.test(service.AccessConstraints)
      ) {
        const traits = createStratumInstance(InfoSectionTraits);
        traits.name = "Access Constraints";
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
        result.push({
          time: values[i],
          tag: undefined
        });
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

  @observable
  ancestors:
    | (GroupMixin.GroupMixin & CatalogMemberMixin.CatalogMemberMixin)[]
    | undefined;

  get type() {
    return WebMapServiceCatalogItem.type;
  }

  // TODO
  get isMappable() {
    return true;
  }

  constructor(id: string, terria: Terria) {
    super(id, terria);
    if (this.opacity === undefined) {
      console.log("Whaaaaa... This should have a default of 0.8");
    }
    autorun(() => {
      console.log(`Opacity changed to ${this.opacity}`);
    });
  }

  protected get loadMetadataPromise(): Promise<void> {
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
  get layers(): string | undefined {
    let layers = super.layers;

    if (layers === undefined && this.uri !== undefined) {
      // Try to extract a layer from the URL
      const query: any = this.uri.query(true);
      layers = query.layers;
    }

    if (layers === undefined) {
      // Use the first layer with a name in GetCapabilities
      const capabilitiesStratum = <GetCapabilitiesStratum | undefined>(
        this.strata.get(GetCapabilitiesMixin.getCapabilitiesStratumName)
      );
      if (capabilitiesStratum !== undefined) {
        const firstLayerWithName = capabilitiesStratum.capabilities.allLayers.find(
          layer => layer.Name !== undefined
        );
        if (firstLayerWithName !== undefined) {
          return firstLayerWithName.Name;
        }
      }
    }

    return layers;
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
  get legendUrls(): StratumFromTraits<LegendTraits>[] {
    const availableStyles = this.availableStyles || [];
    const layers = this.layersArray;
    const styles = this.stylesArray;

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
        if (layerStyle !== undefined && layerStyle.legendUrl !== undefined) {
          result.push(layerStyle.legendUrl);
        }
      }
    }

    return result;
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

      console.log(`Creating new ImageryProvider for time ${time}`);

      const parameters: any = {
        ...WebMapServiceCatalogItem.defaultParameters
      };

      if (time !== undefined) {
        parameters.time = time;
      }

      const maximumLevel = scaleDenominatorToLevel(this.minScaleDenominator);

      const imageryOptions = {
        url: this.url || "",
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

export default WebMapServiceCatalogItem;
