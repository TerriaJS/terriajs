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
import GeographicTilingScheme from "terriajs-cesium/Source/Core/GeographicTilingScheme";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import WebMapServiceImageryProvider from "terriajs-cesium/Source/Scene/WebMapServiceImageryProvider";
import URI from "urijs";
import createTransformerAllowUndefined from "../../../Core/createTransformerAllowUndefined";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import ChartableMixin from "../../../ModelMixins/ChartableMixin";
import DiffableMixin from "../../../ModelMixins/DiffableMixin";
import ExportWebCoverageServiceMixin from "../../../ModelMixins/ExportWebCoverageServiceMixin";
import GetCapabilitiesMixin from "../../../ModelMixins/GetCapabilitiesMixin";
import { ImageryParts } from "../../../ModelMixins/MappableMixin";
import MinMaxLevelMixin from "../../../ModelMixins/MinMaxLevelMixin";
import TileErrorHandlerMixin from "../../../ModelMixins/TileErrorHandlerMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import WebMapServiceCatalogItemTraits, {
  SUPPORTED_CRS_3857,
  SUPPORTED_CRS_4326
} from "../../../Traits/TraitsClasses/WebMapServiceCatalogItemTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import SelectableDimensions, {
  SelectableDimension,
  SelectableDimensionSelect
} from "../../SelectableDimensions";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import WebMapServiceCapabilities from "./WebMapServiceCapabilities";
import WebMapServiceCapabilitiesStratum from "./WebMapServiceCapabilitiesStratum";
import WebMapServiceCatalogGroup from "./WebMapServiceCatalogGroup";
class WebMapServiceCatalogItem
  extends TileErrorHandlerMixin(
    ExportWebCoverageServiceMixin(
      DiffableMixin(
        ChartableMixin(
          MinMaxLevelMixin(
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
    const stratum = await WebMapServiceCapabilitiesStratum.load(
      this,
      capabilities
    );
    runInAction(() => {
      this.strata.set(GetCapabilitiesMixin.getCapabilitiesStratumName, stratum);
    });
  }

  protected async forceLoadMapItems(): Promise<void> {}

  protected async forceLoadMetadata(): Promise<void> {
    if (
      this.strata.get(GetCapabilitiesMixin.getCapabilitiesStratumName) !==
      undefined
    )
      return;
    const stratum = await WebMapServiceCapabilitiesStratum.load(this);
    runInAction(() => {
      this.strata.set(GetCapabilitiesMixin.getCapabilitiesStratumName, stratum);
    });
  }

  @computed get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "0d";
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
    return this.styles?.split(",") ?? [];
  }

  @computed
  get discreteTimes() {
    const getCapabilitiesStratum:
      | WebMapServiceCapabilitiesStratum
      | undefined = this.strata.get(
      GetCapabilitiesMixin.getCapabilitiesStratumName
    ) as WebMapServiceCapabilitiesStratum;
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

      const maximumLevel = this.getMaximumLevel(true);

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

      const gcStratum:
        | WebMapServiceCapabilitiesStratum
        | undefined = this.strata.get(
        GetCapabilitiesMixin.getCapabilitiesStratumName
      ) as WebMapServiceCapabilitiesStratum;

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
        parameters,
        getFeatureInfoParameters: {
          ...this.parameters,
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
        maximumLevel,
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
      return this.updateRequestImage(imageryProvider);
    }
  );

  @computed
  get styleSelectableDimensions(): SelectableDimensionSelect[] {
    return this.availableStyles.map((layer, layerIndex) => {
      let name = "Styles";

      // If multiple layers -> prepend layer name to name
      if (this.availableStyles.length > 1) {
        // Attempt to get layer title from GetCapabilitiesStratum
        const layerTitle =
          layer.layerName &&
          (this.strata.get(
            GetCapabilitiesMixin.getCapabilitiesStratumName
          ) as WebMapServiceCapabilitiesStratum).capabilitiesLayers.get(
            layer.layerName
          )?.Title;

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
        // There is no way of finding out default style if no style has been selected :(
        // To use the default style, we just send empty "styles" to WMS server
        // But if the server doesn't support GetLegendGraphic, then we can't request the default legend
        // Therefore - we only add the "Default style" / undefined option if supportsGetLegendGraphic is true
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

export default WebMapServiceCatalogItem;
