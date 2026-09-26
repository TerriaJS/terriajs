import { FeatureCollection } from "geojson";
import i18next from "i18next";
import { computed, makeObservable, override, runInAction } from "mobx";
import GeographicTilingScheme from "terriajs-cesium/Source/Core/GeographicTilingScheme";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import GetFeatureInfoFormat from "terriajs-cesium/Source/Scene/GetFeatureInfoFormat";
import WebMapTileServiceImageryProvider from "terriajs-cesium/Source/Scene/WebMapTileServiceImageryProvider";
import URI from "urijs";
import containsAny from "../../../Core/containsAny";
import createDiscreteTimesFromIsoSegments from "../../../Core/createDiscreteTimes";
import createTransformerAllowUndefined from "../../../Core/createTransformerAllowUndefined";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import isReadOnlyArray from "../../../Core/isReadOnlyArray";
import TerriaError from "../../../Core/TerriaError";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import DiscretelyTimeVaryingMixin, {
  DiscreteTimeAsJS
} from "../../../ModelMixins/DiscretelyTimeVaryingMixin";
import GetCapabilitiesMixin from "../../../ModelMixins/GetCapabilitiesMixin";
import MappableMixin, {
  ImageryParts,
  MapItem
} from "../../../ModelMixins/MappableMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import { InfoSectionTraits } from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import LegendTraits from "../../../Traits/TraitsClasses/LegendTraits";
import { RectangleTraits } from "../../../Traits/TraitsClasses/MappableTraits";
import WebMapTileServiceCatalogItemTraits, {
  WebMapTileServiceAvailableLayerStylesTraits
} from "../../../Traits/TraitsClasses/WebMapTileServiceCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel, ModelConstructorParameters } from "../../Definition/Model";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import CommonStrata from "../../Definition/CommonStrata";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import { ServiceProvider } from "./OwsInterfaces";
import WebMapTileServiceCapabilities, {
  CapabilitiesStyle,
  ResourceUrl,
  TileMatrix,
  TileMatrixSetLink,
  WmtsCapabilitiesLegend,
  WmtsDimension,
  WmtsLayer
} from "./WebMapTileServiceCapabilities";
import geoJsonToFeatureInfoWithProject from "./geoJsonToFeatureInfoWithProject";

export const SUPPORTED_CRS_3857 = [/EPSG.*3857/, /EPSG.*900913/];
export const SUPPORTED_CRS_4326 = [/EPSG.*4326/, /CRS.*84/, /EPSG.*4283/];

interface UsableTileMatrixSets {
  /** Matrix identifiers indexed by Cesium tile level (padded when minLevel > 0). */
  identifiers: string[];
  minLevel: number;
  maxLevel: number;
  tileWidth: number;
  tileHeight: number;
  scheme: WebMercatorTilingScheme | GeographicTilingScheme;
}

class GetCapabilitiesStratum extends LoadableStratum(
  WebMapTileServiceCatalogItemTraits
) {
  static stratumName = "wmtsServer";

  static async load(
    catalogItem: WebMapTileServiceCatalogItem,
    capabilities?: WebMapTileServiceCapabilities
  ): Promise<GetCapabilitiesStratum> {
    if (!isDefined(catalogItem.getCapabilitiesUrl)) {
      throw new TerriaError({
        title: i18next.t(
          ($) => $.models.webMapTileServiceCatalogItem.missingUrlTitle
        ),
        message: i18next.t(
          ($) => $.models.webMapTileServiceCatalogItem.missingUrlMessage
        )
      });
    }

    if (!isDefined(capabilities))
      capabilities = await WebMapTileServiceCapabilities.fromUrl(
        proxyCatalogItemUrl(
          catalogItem,
          catalogItem.getCapabilitiesUrl,
          catalogItem.getCapabilitiesCacheDuration
        )
      );

    return new GetCapabilitiesStratum(catalogItem, capabilities);
  }

  constructor(
    readonly catalogItem: WebMapTileServiceCatalogItem,
    readonly capabilities: WebMapTileServiceCapabilities
  ) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new GetCapabilitiesStratum(
      model as WebMapTileServiceCatalogItem,
      this.capabilities
    ) as this;
  }

  @computed
  get layer(): string | undefined {
    let layer: string | undefined;

    if (this.catalogItem.uri !== undefined) {
      const query: any = this.catalogItem.uri.query(true);
      layer = query.layer;
    }

    return layer;
  }

  @computed
  get info(): StratumFromTraits<InfoSectionTraits>[] {
    const result: StratumFromTraits<InfoSectionTraits>[] = [
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t(
          ($) => $.models.webMapTileServiceCatalogItem.getCapabilitiesUrl
        ),
        content: this.catalogItem.getCapabilitiesUrl
      })
    ];
    let layerAbstract: string | undefined;
    const layer = this.capabilitiesLayer;
    if (
      layer &&
      layer.Abstract &&
      !containsAny(
        layer.Abstract,
        WebMapTileServiceCatalogItem.abstractsToIgnore
      )
    ) {
      result.push(
        createStratumInstance(InfoSectionTraits, {
          name: i18next.t(
            ($) => $.models.webMapTileServiceCatalogItem.dataDescription
          ),
          content: layer.Abstract
        })
      );
      layerAbstract = layer.Abstract;
    }

    const serviceIdentification =
      this.capabilities && this.capabilities.ServiceIdentification;
    if (serviceIdentification) {
      if (
        serviceIdentification.Abstract &&
        !containsAny(
          serviceIdentification.Abstract,
          WebMapTileServiceCatalogItem.abstractsToIgnore
        ) &&
        serviceIdentification.Abstract !== layerAbstract
      ) {
        result.push(
          createStratumInstance(InfoSectionTraits, {
            name: i18next.t(
              ($) => $.models.webMapTileServiceCatalogItem.serviceDescription
            ),
            content: serviceIdentification.Abstract
          })
        );
      }

      // Show the Access Constraints if it isn't "none" (because that's the default, and usually a lie).
      if (
        serviceIdentification.AccessConstraints &&
        !/^none$/i.test(serviceIdentification.AccessConstraints)
      ) {
        result.push(
          createStratumInstance(InfoSectionTraits, {
            name: i18next.t(
              ($) => $.models.webMapTileServiceCatalogItem.accessConstraints
            ),
            content: serviceIdentification.AccessConstraints
          })
        );
      }

      // Show the Access Constraints if it isn't "none" (because that's the default, and usually a lie).
      if (
        serviceIdentification.Fees &&
        !/^none$/i.test(serviceIdentification.Fees)
      ) {
        result.push(
          createStratumInstance(InfoSectionTraits, {
            name: i18next.t(($) => $.models.webMapTileServiceCatalogItem.fees),
            content: serviceIdentification.Fees
          })
        );
      }
    }

    const serviceProvider =
      this.capabilities && this.capabilities.ServiceProvider;
    if (serviceProvider) {
      result.push(
        createStratumInstance(InfoSectionTraits, {
          name: i18next.t(
            ($) => $.models.webMapTileServiceCatalogItem.serviceContact
          ),
          content: getServiceContactInformation(serviceProvider) || ""
        })
      );
    }

    if (!isDefined(this.catalogItem.tileMatrixSet)) {
      result.push(
        createStratumInstance(InfoSectionTraits, {
          name: i18next.t(
            ($) => $.models.webMapTileServiceCatalogItem.noUsableTileMatrixTitle
          ),
          content: i18next.t(
            ($) =>
              $.models.webMapTileServiceCatalogItem.noUsableTileMatrixMessage
          )
        })
      );
    }
    return result;
  }

  @computed
  get infoSectionOrder(): string[] {
    return [
      i18next.t(($) => $.preview.disclaimer),
      i18next.t(
        ($) => $.models.webMapTileServiceCatalogItem.noUsableTileMatrixTitle
      ),
      i18next.t(($) => $.description.name),
      i18next.t(($) => $.preview.datasetDescription),
      i18next.t(($) => $.models.webMapTileServiceCatalogItem.dataDescription),
      i18next.t(($) => $.preview.serviceDescription),
      i18next.t(
        ($) => $.models.webMapTileServiceCatalogItem.serviceDescription
      ),
      i18next.t(($) => $.preview.resourceDescription),
      i18next.t(($) => $.preview.licence),
      i18next.t(($) => $.preview.accessConstraints),
      i18next.t(($) => $.models.webMapTileServiceCatalogItem.accessConstraints),
      i18next.t(($) => $.models.webMapTileServiceCatalogItem.fees),
      i18next.t(($) => $.preview.author),
      i18next.t(($) => $.preview.contact),
      i18next.t(($) => $.models.webMapTileServiceCatalogItem.serviceContact),
      i18next.t(($) => $.preview.created),
      i18next.t(($) => $.preview.modified),
      i18next.t(($) => $.preview.updateFrequency),
      i18next.t(($) => $.models.webMapTileServiceCatalogItem.getCapabilitiesUrl)
    ];
  }

  @computed
  get shortReport() {
    return !isDefined(this.catalogItem.tileMatrixSet)
      ? `${i18next.t(
          ($) => $.models.webMapTileServiceCatalogItem.noUsableTileMatrixTitle
        )}: ${i18next.t(
          ($) => $.models.webMapTileServiceCatalogItem.noUsableTileMatrixMessage
        )}`
      : undefined;
  }

  @computed
  get legends() {
    const layerAvailableStyles = this.catalogItem.availableStyles.find(
      (candidate) => candidate.layerName === this.capabilitiesLayer?.Identifier
    )?.styles;

    const layerStyle = layerAvailableStyles?.find(
      (candidate) => candidate.identifier === this.catalogItem.style
    );

    if (isDefined(layerStyle?.legend)) {
      return [
        createStratumInstance(LegendTraits, {
          url: layerStyle!.legend.url,
          urlMimeType: layerStyle!.legend.urlMimeType
        })
      ];
    }
  }

  @computed
  get capabilitiesLayer(): Readonly<WmtsLayer | undefined> {
    const result = this.catalogItem.layer
      ? this.capabilities.findLayer(this.catalogItem.layer)
      : undefined;
    return result;
  }

  @computed
  get availableStyles(): StratumFromTraits<WebMapTileServiceAvailableLayerStylesTraits>[] {
    const result: any = [];
    if (!this.capabilities) {
      return result;
    }
    const layer = this.capabilitiesLayer;
    if (!layer) {
      return result;
    }
    const styles: ReadonlyArray<CapabilitiesStyle> =
      layer && layer.Style
        ? Array.isArray(layer.Style)
          ? layer.Style
          : [layer.Style]
        : [];
    result.push({
      layerName: layer?.Identifier,
      styles: styles.map((style: CapabilitiesStyle) => {
        const wmtsLegendUrl: WmtsCapabilitiesLegend | undefined =
          isReadOnlyArray(style.LegendURL)
            ? style.LegendURL[0]
            : style.LegendURL;
        let legendUri, legendMimeType;
        if (wmtsLegendUrl && wmtsLegendUrl["xlink:href"]) {
          legendUri = new URI(decodeURIComponent(wmtsLegendUrl["xlink:href"]));
          legendMimeType = wmtsLegendUrl.Format;
        }
        const legend = !legendUri
          ? undefined
          : createStratumInstance(LegendTraits, {
              url: legendUri.toString(),
              urlMimeType: legendMimeType
            });
        return {
          identifier: style.Identifier,
          isDefault: style.isDefault,
          abstract: style.Abstract,
          legend: legend
        };
      })
    });

    return result;
  }

  @computed
  get usableTileMatrixSets() {
    const usableTileMatrixSets: { [key: string]: UsableTileMatrixSets } = {};

    const matrixSets = this.capabilities.tileMatrixSets;
    if (matrixSets === undefined) {
      return;
    }
    for (let i = 0; i < matrixSets.length; i++) {
      const matrixSet = matrixSets[i];
      if (
        !matrixSet.SupportedCRS ||
        ![...SUPPORTED_CRS_3857, ...SUPPORTED_CRS_4326].some((crs) =>
          crs.test(matrixSet.SupportedCRS as string)
        )
      ) {
        continue;
      }
      // Usable tile matrix sets must have a single 256x256 tile at the root.
      const matrices = matrixSet.TileMatrix;
      if (!isDefined(matrices) || matrices.length < 1) {
        continue;
      }

      const levelZeroMatrix = matrices[0];

      if (!isDefined(levelZeroMatrix.TopLeftCorner)) {
        continue;
      }

      const scheme = SUPPORTED_CRS_3857.some((crs) =>
        crs.test(matrixSet.SupportedCRS as string)
      )
        ? new WebMercatorTilingScheme()
        : new GeographicTilingScheme();

      if (scheme instanceof WebMercatorTilingScheme) {
        const standardTilingScheme = new WebMercatorTilingScheme();
        const levelZeroTopLeftCorner = levelZeroMatrix.TopLeftCorner.split(" ");
        const startX = parseFloat(levelZeroTopLeftCorner[0]);
        const startY = parseFloat(levelZeroTopLeftCorner[1]);
        const rectangleInMeters =
          standardTilingScheme.rectangleToNativeRectangle(
            standardTilingScheme.rectangle
          );
        if (
          Math.abs(startX - rectangleInMeters.west) > 1 ||
          Math.abs(startY - rectangleInMeters.north) > 1
        ) {
          continue;
        }
      }

      const ids = matrices.map((matrix) => matrix.Identifier);
      const levels = levelsForTileMatrixSet(matrices, ids, scheme);
      if (levels) {
        const firstTile = matrices[0];
        usableTileMatrixSets[matrixSet.Identifier] = {
          ...levels,
          tileWidth: firstTile.TileWidth,
          tileHeight: firstTile.TileHeight
        };
      }
    }

    return usableTileMatrixSets;
  }

  @computed
  get rectangle(): StratumFromTraits<RectangleTraits> | undefined {
    const layer: WmtsLayer | undefined = this.capabilitiesLayer;
    if (!layer) {
      return;
    }
    const bbox = layer.WGS84BoundingBox;
    if (bbox) {
      const lowerCorner = bbox.LowerCorner.split(" ");
      const upperCorner = bbox.UpperCorner.split(" ");
      return {
        west: parseFloat(lowerCorner[0]),
        south: parseFloat(lowerCorner[1]),
        east: parseFloat(upperCorner[0]),
        north: parseFloat(upperCorner[1])
      };
    }
  }

  @computed get style(): string | undefined {
    if (!isDefined(this.catalogItem.layer)) return;

    const layerAvailableStyles = this.availableStyles.find(
      (candidate) => candidate.layerName === this.capabilitiesLayer?.Identifier
    )?.styles;

    return (
      layerAvailableStyles?.find((style) => style.isDefault)?.identifier ??
      layerAvailableStyles?.[0]?.identifier
    );
  }

  /** The layer's time `<Dimension>`, matched case-insensitively on Identifier. */
  @computed
  private get timeDimension(): WmtsDimension | undefined {
    const layer = this.capabilitiesLayer;
    if (!layer || !layer.Dimension) return undefined;
    const dimensions: ReadonlyArray<WmtsDimension> = Array.isArray(
      layer.Dimension
    )
      ? layer.Dimension
      : [layer.Dimension];
    return dimensions.find(
      (d) => isDefined(d.Identifier) && d.Identifier.toLowerCase() === "time"
    );
  }

  /**
   * Discrete times from the time `<Dimension>`. Each `<Value>` may be an ISO
   * instant, a `start/stop/period` range, or a comma-separated list of either.
   */
  @computed
  get discreteTimes(): DiscreteTimeAsJS[] | undefined {
    const dimension = this.timeDimension;
    if (!dimension || !isDefined(dimension.Value)) return undefined;

    const rawValues = isReadOnlyArray(dimension.Value)
      ? dimension.Value
      : [dimension.Value];
    return parseTimeValues(rawValues, this.catalogItem.maxRefreshIntervals);
  }

  @computed
  get initialTimeSource() {
    return "now";
  }

  /**
   * Tile dimensions and level range come from the tile matrix set the layer
   * uses. They are traits so that catalog configuration can still override
   * them - a stratum value beats the trait's default, and the definition and
   * user strata beat this one.
   */
  @computed
  get tileWidth(): number | undefined {
    return this.catalogItem.tileMatrixSet?.tileWidth;
  }

  @computed
  get tileHeight(): number | undefined {
    return this.catalogItem.tileMatrixSet?.tileHeight;
  }

  @computed
  get minimumLevel(): number | undefined {
    return this.catalogItem.tileMatrixSet?.minLevel;
  }

  @computed
  get maximumLevel(): number | undefined {
    return this.catalogItem.tileMatrixSet?.maxLevel;
  }

  @computed
  get currentTime(): string | undefined {
    const defaultTime = this.timeDimension?.Default;
    // Defer keyword defaults to initialTimeSource so the timeline gets a date.
    return defaultTime === "current" || defaultTime === "default"
      ? undefined
      : defaultTime;
  }
}

class WebMapTileServiceCatalogItem extends MappableMixin(
  DiscretelyTimeVaryingMixin(
    GetCapabilitiesMixin(
      UrlMixin(
        CatalogMemberMixin(CreateModel(WebMapTileServiceCatalogItemTraits))
      )
    )
  )
) {
  /**
   * The collection of strings that indicate an Abstract property should be ignored.  If these strings occur anywhere
   * in the Abstract, the Abstract will not be used.  This makes it easy to filter out placeholder data like
   * Geoserver's "A compliant implementation of WMTS..." stock abstract.
   */
  static abstractsToIgnore = [
    "A compliant implementation of WMTS service.",
    "This is the reference implementation of WMTS 1.0.0"
  ];

  // hide elements in the info section which might show information about the datasource
  _sourceInfoItemNames = [
    i18next.t(($) => $.models.webMapTileServiceCatalogItem.getCapabilitiesUrl)
  ];

  static readonly type = "wmts";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return WebMapTileServiceCatalogItem.type;
  }

  @override
  get shortReport(): string | undefined {
    // Unlike WMS, a WMTS server cannot reproject on request: if it publishes no
    // Web Mercator tile matrix set there is nothing the 2D map can draw.
    if (
      this.tileMatrixSet?.scheme instanceof GeographicTilingScheme &&
      this.terria.currentViewer.type === "Leaflet"
    ) {
      return i18next.t(($) => $.map.cesium.notWebMercatorTilingScheme);
    }

    // A configured tile size is honoured even when no matrix set serves it,
    // rather than quietly substituting one. Say so: the tiles still land in
    // the right place, so the only symptom is a layer drawn at the wrong
    // level of detail, which is easy to miss.
    const requested = this.requestedTileSize;
    const served = this.tileMatrixSet;
    if (
      served &&
      requested &&
      ((isDefined(requested.width) && requested.width !== served.tileWidth) ||
        (isDefined(requested.height) && requested.height !== served.tileHeight))
    ) {
      return i18next.t(
        ($) => $.models.webMapTileServiceCatalogItem.unavailableTileSizeMessage,
        {
          requested: `${requested.width ?? served.tileWidth}x${
            requested.height ?? served.tileHeight
          }`,
          available: `${served.tileWidth}x${served.tileHeight}`
        }
      );
    }

    return super.shortReport;
  }

  /** Explicit `timeValues` take precedence over times advertised by capabilities. */
  @computed
  get discreteTimes() {
    const timeOverrides = parseTimeValues(
      this.timeValues ?? [],
      this.maxRefreshIntervals
    );
    if (timeOverrides) {
      return timeOverrides;
    }
    const getCapabilitiesStratum = this.strata.get(
      GetCapabilitiesMixin.getCapabilitiesStratumName
    ) as GetCapabilitiesStratum | undefined;
    return getCapabilitiesStratum?.discreteTimes;
  }

  async createGetCapabilitiesStratumFromParent(
    capabilities: WebMapTileServiceCapabilities
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

  @override
  get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "1d";
  }

  /**
   * One imagery provider per selected time, cached by MobX. Cesium applies
   * `dimensions` itself: as a `{Time}` template value on REST URLs and as a
   * query parameter on KVP requests.
   */
  private _createImageryProvider = createTransformerAllowUndefined(
    (
      time: string | undefined
    ): WebMapTileServiceImageryProvider | undefined => {
      const stratum = this.strata.get(
        GetCapabilitiesMixin.getCapabilitiesStratumName
      ) as GetCapabilitiesStratum;

      if (
        !isDefined(this.layer) ||
        !isDefined(this.url) ||
        !isDefined(stratum) ||
        !isDefined(this.style)
      ) {
        return;
      }

      const layer = stratum.capabilitiesLayer;
      const layerIdentifier = layer?.Identifier;
      if (!isDefined(layer) || !isDefined(layerIdentifier)) {
        return;
      }

      let format: string = "image/png";
      const formats = layer.Format;
      if (
        formats &&
        formats?.indexOf("image/png") === -1 &&
        formats?.indexOf("image/jpeg") !== -1
      ) {
        format = "image/jpeg";
      }

      const tileUrl: string = this.getTileUrl(
        layer,
        stratum.capabilities,
        format,
        time
      );

      const tileMatrixSet = this.tileMatrixSet;
      if (!isDefined(tileMatrixSet)) {
        return;
      }

      // Cesium's template substitution is case-sensitive, so match the
      // placeholder's casing ({Time} for GIBS, {time} for GeoServer).
      const timeDimensionKey = tileUrl.match(/\{(time)\}/i)?.[1] ?? "Time";

      const imageryProvider = new WebMapTileServiceImageryProvider({
        url: proxyCatalogItemUrl(this, tileUrl),
        layer: layerIdentifier,
        style: this.style,
        tileMatrixSetID: tileMatrixSet.id,
        tileMatrixLabels: tileMatrixSet.labels,
        minimumLevel: this.minimumLevel,
        maximumLevel: this.maximumLevel,
        tileWidth: this.tileWidth,
        tileHeight: this.tileHeight,
        tilingScheme: tileMatrixSet.scheme,
        format,
        credit: this.attribution,
        ...(isDefined(time)
          ? { dimensions: { [timeDimensionKey]: time } }
          : {}),
        // enablePickFeatures is set per map item (current on, next off).
        getFeatureInfoUrl: isDefined(this.featureInfoUrl)
          ? proxyCatalogItemUrl(this, this.featureInfoUrl)
          : undefined,
        getFeatureInfoFormats: this.getFeatureInfoFormats
      });
      return imageryProvider;
    }
  );

  @computed
  private get _currentImageryParts(): ImageryParts | undefined {
    const imageryProvider = this._createImageryProvider(
      this.currentDiscreteTimeTag
    );
    if (imageryProvider === undefined) {
      return undefined;
    }

    imageryProvider.enablePickFeatures =
      this.allowFeaturePicking && this.supportsFeatureInfo;

    return {
      imageryProvider,
      alpha: this.opacity,
      show: this.show,
      clippingRectangle: this.clipToRectangle ? this.cesiumRectangle : undefined
    };
  }

  @computed
  private get _nextImageryParts(): ImageryParts | undefined {
    if (
      this.terria.timelineStack.contains(this) &&
      !this.isPaused &&
      this.nextDiscreteTimeTag
    ) {
      const imageryProvider = this._createImageryProvider(
        this.nextDiscreteTimeTag
      );
      if (imageryProvider === undefined) {
        return undefined;
      }

      // Disable feature picking for the next imagery layer during cross-fade.
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

  /**
   * GetFeatureInfo endpoint: the trait, else the RESTful `FeatureInfo`
   * ResourceURL advertised by capabilities (WMTS `{I}`/`{J}` renamed to the
   * `{i}`/`{j}` Cesium expects). Undefined lets Cesium use `url` (KVP).
   */
  @computed
  private get featureInfoUrl(): string | undefined {
    if (isDefined(this.getFeatureInfoUrl)) return this.getFeatureInfoUrl;

    const template = this.featureInfoResourceUrls[0]?.template;
    if (this.requestEncoding === "RESTful" && template) {
      // WMTS names the pixel {I}/{J}; Cesium substitutes {i}/{j}.
      return template.replace(/\{I\}/g, "{i}").replace(/\{J\}/g, "{j}");
    }

    // Otherwise KVP, which a service may serve from its own endpoint rather
    // than the one GetTile uses. Undefined leaves Cesium using the tile URL.
    const stratum = this.strata.get(
      GetCapabilitiesMixin.getCapabilitiesStratumName
    ) as GetCapabilitiesStratum | undefined;
    return stratum
      ? kvpEndpoint(stratum.capabilities, "GetFeatureInfo")
      : undefined;
  }

  /**
   * Whether the layer offers GetFeatureInfo at all. Per WMTS 07-057r7 a layer
   * declares support with `<InfoFormat>` or a `FeatureInfo` ResourceURL;
   * without either (NASA GIBS, for example) picking would be sent to the tile
   * endpoint, so it stays off unless a `getFeatureInfoUrl` is configured.
   */
  @computed
  get supportsFeatureInfo(): boolean {
    const stratum = this.strata.get(
      GetCapabilitiesMixin.getCapabilitiesStratumName
    ) as GetCapabilitiesStratum | undefined;
    return (
      isDefined(this.getFeatureInfoUrl) ||
      this.featureInfoResourceUrls.length > 0 ||
      isDefined(stratum?.capabilitiesLayer?.InfoFormat)
    );
  }

  @computed
  private get featureInfoResourceUrls(): ResourceUrl[] {
    const stratum = this.strata.get(
      GetCapabilitiesMixin.getCapabilitiesStratumName
    ) as GetCapabilitiesStratum | undefined;
    const resourceUrls = stratum?.capabilitiesLayer?.ResourceURL;
    if (!resourceUrls) return [];
    return (Array.isArray(resourceUrls) ? resourceUrls : [resourceUrls]).filter(
      (resourceUrl) => resourceUrl.resourceType === "FeatureInfo"
    );
  }

  /**
   * Formats to try for GetFeatureInfo, from the layer's `<InfoFormat>` list
   * (or the RESTful template's format). Falls back to Cesium's defaults.
   */
  @computed
  private get getFeatureInfoFormats(): GetFeatureInfoFormat[] | undefined {
    const stratum = this.strata.get(
      GetCapabilitiesMixin.getCapabilitiesStratumName
    ) as GetCapabilitiesStratum | undefined;
    const infoFormats = stratum?.capabilitiesLayer?.InfoFormat;
    const advertised = isDefined(this.getFeatureInfoUrl)
      ? []
      : this.featureInfoResourceUrls.map((resourceUrl) => resourceUrl.format);
    const formats = advertised.length
      ? advertised
      : Array.isArray(infoFormats)
        ? infoFormats
        : isDefined(infoFormats)
          ? [infoFormats]
          : [];
    const result = filterOutUndefined(
      formats.map((format) => {
        if (format === "application/json")
          return new GetFeatureInfoFormat(
            "json",
            format,
            (json: FeatureCollection) => {
              const features = json.features.map((feature) => {
                const { lat, lon } = feature.properties ?? {};
                const geometry = feature.geometry;
                // Copernicus returns latitude-first points, confirmed by its
                // explicitly labelled properties. Leave other responses alone.
                if (
                  geometry?.type !== "Point" ||
                  typeof lat !== "number" ||
                  typeof lon !== "number" ||
                  !Number.isFinite(lat) ||
                  !Number.isFinite(lon) ||
                  Math.abs(lat) > 90 ||
                  Math.abs(lon) > 180 ||
                  geometry.coordinates[0] !== lat ||
                  geometry.coordinates[1] !== lon
                )
                  return feature;

                return {
                  ...feature,
                  geometry: {
                    ...geometry,
                    coordinates: [lon, lat, ...geometry.coordinates.slice(2)]
                  }
                };
              });
              return geoJsonToFeatureInfoWithProject(
                { ...json, features },
                this.tileMatrixSet?.scheme.projection
              );
            }
          );
        if (format === "text/xml" || format.includes("gml"))
          return new GetFeatureInfoFormat("xml", format);
        if (format === "text/html")
          return new GetFeatureInfoFormat("html", format);
        if (format === "text/plain")
          return new GetFeatureInfoFormat("text", format);
        return undefined;
      })
    );
    return result.length > 0 ? result : undefined;
  }

  getTileUrl(
    layer: WmtsLayer,
    capabilities: WebMapTileServiceCapabilities,
    format: string,
    time?: string
  ) {
    let url: string | undefined = kvpEndpoint(capabilities, "GetTile");

    const resourceUrls: ResourceUrl[] | undefined =
      !layer.ResourceURL || Array.isArray(layer.ResourceURL)
        ? layer.ResourceURL
        : [layer.ResourceURL];

    if (resourceUrls && (this.requestEncoding === "RESTful" || !url)) {
      const templates = resourceUrls
        .filter(
          (resourceUrl) =>
            (resourceUrl.resourceType === "tile" &&
              resourceUrl.format.indexOf(format) !== -1) ||
            resourceUrl.format.indexOf("png") !== -1
        )
        .map((resourceUrl) => resourceUrl.template);
      const hasTimePlaceholder = (template: string) =>
        /\{time\}/i.test(template);
      // Servers such as NASA GIBS advertise several tile templates; only the
      // one with a {Time} placeholder can serve the selected time. Without a
      // selected time prefer a template that needs no substitution.
      url =
        (isDefined(time) ? templates.find(hasTimePlaceholder) : undefined) ??
        templates.find((template) => !hasTimePlaceholder(template)) ??
        templates[templates.length - 1] ??
        url;
    }

    return url ?? new URI(this.url).search("").toString();
  }

  /**
   * The tile size asked for in catalog configuration, if any. The
   * GetCapabilities stratum supplies one as well, so only the strata an author
   * writes to count as a request.
   */
  @computed
  private get requestedTileSize():
    | { width: number | undefined; height: number | undefined }
    | undefined {
    const configured = (trait: "tileWidth" | "tileHeight") =>
      this.getTrait(CommonStrata.user, trait) ??
      this.getTrait(CommonStrata.definition, trait);
    const width = configured("tileWidth");
    const height = configured("tileHeight");
    return isDefined(width) || isDefined(height)
      ? { width, height }
      : undefined;
  }

  @computed
  get tileMatrixSet():
    | {
        id: string;
        labels: string[];
        maxLevel: number;
        minLevel: number;
        tileWidth: number;
        tileHeight: number;
        scheme: GeographicTilingScheme | WebMercatorTilingScheme;
      }
    | undefined {
    const stratum = this.strata.get(
      GetCapabilitiesMixin.getCapabilitiesStratumName
    ) as GetCapabilitiesStratum | undefined;
    // Reachable before the capabilities have loaded, e.g. from `shortReport`.
    if (!this.layer || !stratum) {
      return;
    }
    const layer = stratum.capabilitiesLayer;
    if (!layer) {
      return;
    }

    const usableTileMatrixSets = stratum.usableTileMatrixSets;

    let tileMatrixSetLinks: TileMatrixSetLink[] = [];
    if (layer?.TileMatrixSetLink) {
      if (Array.isArray(layer?.TileMatrixSetLink)) {
        // eslint-disable-next-line no-unsafe-optional-chaining
        tileMatrixSetLinks = [...layer?.TileMatrixSetLink];
      } else {
        tileMatrixSetLinks = [layer.TileMatrixSetLink];
      }
    }

    let tileMatrixSetId: string | undefined = undefined;
    let maxLevel: number = 0;
    let minLevel: number = 0;
    let tileWidth: number = 256;
    let tileHeight: number = 256;
    let tileMatrixSetLabels: string[] = [];
    let scheme: WebMercatorTilingScheme | GeographicTilingScheme;
    // Prefer Web Mercator: it is the only projection the 2D map can draw, and
    // Cesium handles either.
    const isWebMercator = (link: TileMatrixSetLink) =>
      usableTileMatrixSets?.[link.TileMatrixSet]?.scheme instanceof
      WebMercatorTilingScheme;
    // Servers commonly publish the same layer at several tile sizes - the
    // `@2x`/`x2` high resolution convention - so an asked-for size picks
    // between them. Projection still comes first: only Web Mercator can be
    // drawn in 2D, whatever size its tiles are.
    const servesRequestedTileSize = (link: TileMatrixSetLink) => {
      const usable = usableTileMatrixSets?.[link.TileMatrixSet];
      const requested = this.requestedTileSize;
      if (!usable || !requested) return false;
      return (
        (requested.width === undefined ||
          Number(usable.tileWidth) === requested.width) &&
        (requested.height === undefined ||
          Number(usable.tileHeight) === requested.height)
      );
    };
    const links = [...tileMatrixSetLinks].sort(
      (a, b) =>
        Number(isWebMercator(b)) - Number(isWebMercator(a)) ||
        Number(servesRequestedTileSize(b)) - Number(servesRequestedTileSize(a))
    );
    for (let i = 0; i < links.length; i++) {
      const tileMatrixSet = links[i].TileMatrixSet;
      const usable = usableTileMatrixSets?.[tileMatrixSet];
      if (usable) {
        tileMatrixSetId = tileMatrixSet;
        tileMatrixSetLabels = usable.identifiers;
        minLevel = usable.minLevel;
        maxLevel = usable.maxLevel;
        tileWidth = Number(usable.tileWidth);
        tileHeight = Number(usable.tileHeight);
        scheme = usable.scheme;
        break;
      }
    }

    if (!tileMatrixSetId) return undefined;

    return {
      id: tileMatrixSetId,
      labels: tileMatrixSetLabels,
      maxLevel: maxLevel,
      minLevel: minLevel,
      tileWidth: tileWidth,
      tileHeight: tileHeight,
      scheme: scheme!
    };
  }

  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  @computed
  get mapItems(): MapItem[] {
    const result: MapItem[] = [];

    const current = this._currentImageryParts;
    if (current) {
      result.push(current);
    }

    // Only present while animating on the timeline (there is a next time).
    const next = this._nextImageryParts;
    if (next) {
      result.push(next);
    }

    return result;
  }

  protected get defaultGetCapabilitiesUrl(): string | undefined {
    if (this.uri) {
      return this.uri
        .clone()
        .setSearch({
          service: "WMTS",
          version: "1.0.0",
          request: "GetCapabilities"
        })
        .toString();
    } else {
      return undefined;
    }
  }
}

export function getServiceContactInformation(contactInfo: ServiceProvider) {
  let text = "";
  if (contactInfo.ProviderName && contactInfo.ProviderName.length > 0) {
    text += contactInfo.ProviderName + "<br/>";
  }

  if (contactInfo.ProviderSite && contactInfo.ProviderSite["xlink:href"]) {
    text += contactInfo.ProviderSite["xlink:href"] + "<br/>";
  }

  const serviceContact = contactInfo.ServiceContact;
  if (serviceContact) {
    const invidualName = serviceContact.InvidualName;
    if (invidualName && invidualName.length > 0) {
      text += invidualName + "<br/>";
    }
    const contactInfo = serviceContact.ContactInfo?.Address;
    if (
      contactInfo &&
      isDefined(contactInfo.ElectronicMailAddress) &&
      contactInfo.ElectronicMailAddress.length > 0
    ) {
      text += `[${contactInfo.ElectronicMailAddress}](mailto:${contactInfo.ElectronicMailAddress})`;
    }
  }
  return text;
}

export default WebMapTileServiceCatalogItem;

/**
 * How many tiles a re-rooted scheme may need for the whole globe. Cesium's own
 * schemes use one or two; NASA GIBS' geographic sets need 50. Much beyond that
 * and the coarsest view of the layer costs thousands of requests, so the set is
 * better left unused.
 */
const MAXIMUM_LEVEL_ZERO_TILES = 100;

/** Does this matrix's grid of tiles cover the tiling scheme's rectangle exactly? */
function coversTilingScheme(
  matrix: TileMatrix,
  columns: number,
  rows: number,
  scheme: WebMercatorTilingScheme | GeographicTilingScheme
): boolean {
  // WMTS 07-057r7 6.1: a scale denominator assumes a 0.28mm pixel, and is
  // converted to CRS units with the standardized metres per unit.
  const metersPerUnit =
    scheme instanceof WebMercatorTilingScheme ? 1 : 111319.4907932736;
  const unitsPerPixel =
    (Number(matrix.ScaleDenominator) * 0.00028) / metersPerUnit;
  const rectangle = scheme.rectangleToNativeRectangle(scheme.rectangle);
  const tolerance = rectangle.width * 1e-6;
  return (
    Math.abs(
      columns * Number(matrix.TileWidth) * unitsPerPixel - rectangle.width
    ) < tolerance &&
    Math.abs(
      rows * Number(matrix.TileHeight) * unitsPerPixel - rectangle.height
    ) < tolerance
  );
}

/**
 * Work out which tile levels Cesium can serve from a `<TileMatrixSet>`, and the
 * tiling scheme that matches them.
 *
 * Cesium divides the world uniformly, so every matrix must hold
 * `levelZeroTiles * 2^level` columns. A set that already follows that (the
 * usual case) keeps its own level numbering, with unavailable low levels
 * padded out. NASA GIBS' geographic sets instead run 2, 3, 5, 10, 20, 40
 * columns: the top matrices cover more than the globe and have no uniform
 * equivalent, so the scheme is rooted at the first matrix from which the
 * doubling holds, dropping the coarser ones.
 */
function levelsForTileMatrixSet(
  matrices: TileMatrix[],
  ids: string[],
  scheme: WebMercatorTilingScheme | GeographicTilingScheme
):
  | Pick<
      UsableTileMatrixSets,
      "identifiers" | "minLevel" | "maxLevel" | "scheme"
    >
  | undefined {
  const levelOf = (id: string) =>
    Math.abs(Number(id.substring(id.lastIndexOf(":") + 1)));
  const columns = matrices.map((matrix) => Number(matrix.MatrixWidth));
  const rows = matrices.map((matrix) => Number(matrix.MatrixHeight));
  // Sizes are optional in the schema; without them assume the scheme's own.
  const sized = columns.every(
    (column, i) => isFinite(column) && isFinite(rows[i])
  );
  const matchesScheme = columns.every(
    (column, i) =>
      column === scheme.getNumberOfXTilesAtLevel(levelOf(ids[i])) &&
      rows[i] === scheme.getNumberOfYTilesAtLevel(levelOf(ids[i]))
  );

  if (!sized || matchesScheme) {
    const levels = ids.map(levelOf);
    const minLevel = Math.min(...levels);
    return {
      identifiers: [...new Array(minLevel).fill(""), ...ids],
      minLevel,
      maxLevel: Math.max(...levels),
      scheme
    };
  }

  const root = matrices.findIndex(
    (matrix, index) =>
      coversTilingScheme(matrix, columns[index], rows[index], scheme) &&
      columns
        .slice(index)
        .every(
          (column, i) =>
            column === columns[index] * 2 ** i &&
            rows[index + i] === rows[index] * 2 ** i
        )
  );
  // Nothing uniform to render, or the coarsest uniform matrix is so deep that
  // showing the whole globe would mean thousands of requests.
  if (root < 0 || columns[root] * rows[root] > MAXIMUM_LEVEL_ZERO_TILES) {
    return undefined;
  }
  return {
    identifiers: ids.slice(root),
    minLevel: 0,
    maxLevel: ids.length - 1 - root,
    scheme:
      scheme instanceof WebMercatorTilingScheme
        ? new WebMercatorTilingScheme({
            numberOfLevelZeroTilesX: columns[root],
            numberOfLevelZeroTilesY: rows[root]
          })
        : new GeographicTilingScheme({
            numberOfLevelZeroTilesX: columns[root],
            numberOfLevelZeroTilesY: rows[root]
          })
  };
}

/**
 * The URL a service advertises for an operation's KVP requests, if any. A
 * service may serve each operation from its own endpoint, so GetFeatureInfo
 * cannot be assumed to live where GetTile does.
 */
function kvpEndpoint(
  capabilities: WebMapTileServiceCapabilities,
  operation: string
): string | undefined {
  const gets = capabilities.OperationsMetadata?.[operation]?.Get;
  if (!gets) return undefined;

  let url: string | undefined;
  for (const get of gets) {
    const constraints = !get.Constraint
      ? undefined
      : Array.isArray(get.Constraint)
        ? get.Constraint
        : [get.Constraint];
    if (constraints) {
      const encodings = constraints.find(
        (constraint) => constraint.name === "GetEncoding"
      )?.AllowedValues?.Value;
      if (encodings?.includes("KVP")) url = get["xlink:href"];
    } else if (get["xlink:href"]) {
      url = get["xlink:href"];
    }
  }
  return url;
}

/** Parse the same timestamp and interval encodings for metadata and catalog overrides. */
function parseTimeValues(
  rawValues: readonly string[],
  maxRefreshIntervals: number
): DiscreteTimeAsJS[] | undefined {
  const result: DiscreteTimeAsJS[] = [];
  for (const raw of rawValues) {
    if (typeof raw !== "string") continue;
    for (const segment of raw.split(",")) {
      const value = segment.trim();
      if (value.length === 0) continue;
      const isoSegments = value.split("/");
      if (isoSegments.length === 1) {
        result.push({ time: value, tag: undefined });
      } else {
        createDiscreteTimesFromIsoSegments(
          result,
          isoSegments[0],
          isoSegments[1],
          isoSegments[2],
          maxRefreshIntervals
        );
      }
    }
  }
  return result.length > 0 ? result : undefined;
}
