import i18next from "i18next";
import uniqWith from "lodash-es/uniqWith";
import { computed, makeObservable, override, runInAction } from "mobx";
import GeographicTilingScheme from "terriajs-cesium/Source/Core/GeographicTilingScheme";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import { SelectableDimensionEnum } from "terriajs-plugin-api";
import URI from "urijs";
import AsyncLoader from "../../../Core/AsyncLoader";
import { JsonObject, isJsonObject } from "../../../Core/Json";
import TerriaError, { networkRequestError } from "../../../Core/TerriaError";
import createDiscreteTimesFromIsoSegments from "../../../Core/createDiscreteTimes";
import createTransformerAllowUndefined from "../../../Core/createTransformerAllowUndefined";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import loadJson from "../../../Core/loadJson";
import replaceUnderscores from "../../../Core/replaceUnderscores";
import { scaleDenominatorToLevel } from "../../../Core/scaleToDenominator";
import ArcGisImageServerImageryProvider from "../../../Map/ImageryProvider/ArcGisImageServerImageryProvider";
import Reproject from "../../../Map/Vector/Reproject";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import DiscretelyTimeVaryingMixin from "../../../ModelMixins/DiscretelyTimeVaryingMixin";
import MappableMixin, {
  ImageryParts
} from "../../../ModelMixins/MappableMixin";
import MinMaxLevelMixin from "../../../ModelMixins/MinMaxLevelMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import ArcGisImageServerCatalogItemTraits, {
  ArcGisImageServerAvailableBandTraits,
  ArcGisImageServerAvailableRasterFunctionTraits,
  ArcGisImageServerAvailableVariableTraits,
  ArcGisImageServerRenderingRule
} from "../../../Traits/TraitsClasses/ArcGisImageServerCatalogItemTraits";
import DiscreteTimeTraits from "../../../Traits/TraitsClasses/DiscreteTimeTraits";
import LegendTraits, {
  LegendItemTraits
} from "../../../Traits/TraitsClasses/LegendTraits";
import CreateModel from "../../Definition/CreateModel";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel, ModelConstructorParameters } from "../../Definition/Model";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import StratumOrder from "../../Definition/StratumOrder";
import createStratumInstance from "../../Definition/createStratumInstance";
import { RectangleCoordinates } from "../../FunctionParameters/RectangleParameter";
import { SelectableDimensionMultiEnum } from "../../SelectableDimensions/SelectableDimensions";
import getToken from "../../getToken";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import {
  ImageServer,
  ImageServerBuiltInColorRamps,
  ImageServerMultidimensionInfo,
  ImageServerWellKnownRasterFunctions,
  Legends
} from "./ArcGisInterfaces";
import { getRectangleFromLayer } from "./ArcGisMapServerCatalogItem";

class ImageServerStratum extends LoadableStratum(
  ArcGisImageServerCatalogItemTraits
) {
  static stratumName = "ImageServer";

  constructor(
    private readonly _item: ArcGisImageServerCatalogItem,
    readonly imageServer: ImageServer,
    readonly multidimensionalInfo: ImageServerMultidimensionInfo | undefined,
    private readonly _token: string | undefined
  ) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new ImageServerStratum(
      newModel as ArcGisImageServerCatalogItem,
      this.imageServer,
      this.multidimensionalInfo,
      this._token
    ) as this;
  }

  static async load(item: ArcGisImageServerCatalogItem) {
    if (!isDefined(item.uri)) {
      throw new TerriaError({
        title: i18next.t("models.arcGisImageServerCatalogItem.invalidUrlTitle"),
        message: i18next.t(
          "models.arcGisImageServerCatalogItem.invalidUrlMessage"
        )
      });
    }

    let token: string | undefined;
    if (isDefined(item.tokenUrl)) {
      token = await getToken(item.terria, item.tokenUrl, item.url);
    }

    let serviceUri = getBaseURI(item);
    let multidimensionalInfoUri = getBaseURI(item).segment(
      "multidimensionalInfo"
    );

    if (isDefined(token)) {
      serviceUri = serviceUri.addQuery("token", token);
      multidimensionalInfoUri = multidimensionalInfoUri.addQuery(
        "token",
        item.token
      );
    }

    const serviceMetadata: ImageServer | undefined = await getJson(
      item,
      serviceUri
    );

    if (!isDefined(serviceMetadata)) {
      throw networkRequestError({
        title: i18next.t("models.arcGisService.invalidServerTitle"),
        message: i18next.t("models.arcGisService.invalidServerMessage")
      });
    }

    if (!serviceMetadata.capabilities?.includes("Image"))
      throw new TerriaError({
        title: i18next.t(
          "models.arcGisImageServerCatalogItem.invalidServiceTitle"
        ),
        message: i18next.t(
          "models.arcGisImageServerCatalogItem.invalidServiceMessage"
        )
      });

    let multidimensionalInfo: ImageServerMultidimensionInfo | undefined =
      undefined;
    if (
      serviceMetadata.hasMultidimensions &&
      item.hasMultidimensions !== false
    ) {
      multidimensionalInfo = await getJson(item, multidimensionalInfoUri);
    }

    // Add any Proj4 definitions if necessary
    if (item.terria.configParameters.proj4ServiceBaseUrl) {
      await Reproject.checkProjection(
        item.terria.configParameters.proj4ServiceBaseUrl,
        "EPSG:" + serviceMetadata.fullExtent.spatialReference?.latestWkid ??
          serviceMetadata.fullExtent.spatialReference?.wkid
      );
    }

    const stratum = new ImageServerStratum(
      item,
      serviceMetadata,
      multidimensionalInfo,
      token
    );

    return stratum;
  }

  get maximumScale() {
    return this.imageServer.maxScale;
  }

  get name() {
    return replaceUnderscores(this.imageServer.name);
  }

  get rectangle() {
    const rectangle: RectangleCoordinates = {
      west: Infinity,
      south: Infinity,
      east: -Infinity,
      north: -Infinity
    };

    getRectangleFromLayer(this.imageServer.fullExtent, rectangle);

    return rectangle;
  }

  get description() {
    return this.imageServer.description;
  }

  get attribution() {
    return this.imageServer.copyrightText;
  }

  get token() {
    return this._token;
  }

  @computed get usePreCachedTiles() {
    if (this._item.parameters || this._item.currentDiscreteJulianDate)
      return false;

    return isDefined(this.imageServer.tileInfo);
  }

  get wkid() {
    if (this._item.usePreCachedTiles) {
      const wkid = this.imageServer.tileInfo?.spatialReference.wkid;
      if (wkid === 102100 || wkid === 102113) return wkid;
    }
  }

  get tileHeight() {
    if (this._item.usePreCachedTiles) return this.imageServer.tileInfo?.rows;
  }

  get tileWidth() {
    if (this._item.usePreCachedTiles) return this.imageServer.tileInfo?.cols;
  }

  get maximumLevel() {
    const maximumLevelFromScale = scaleDenominatorToLevel(
      this._item.maximumScale,
      true,
      false
    );

    // Make sure the maximum level is not higher than the maximum level of the server tiles
    if (this._item.usePreCachedTiles && this.imageServer.tileInfo?.lods)
      return Math.min(
        this.imageServer.tileInfo.lods[
          this.imageServer.tileInfo.lods.length - 1
        ].level,
        maximumLevelFromScale ?? Infinity
      );

    return maximumLevelFromScale;
  }

  get minimumLevel() {
    if (this._item.usePreCachedTiles && this.imageServer.tileInfo?.lods)
      return this.imageServer.tileInfo.lods[0].level;
  }

  get availableBands() {
    if (!this.imageServer.bandCount) return undefined;
    const bandNames = this.imageServer.bandNames ?? [];
    return new Array(this.imageServer.bandCount).fill(undefined).map((_, i) => {
      return createStratumInstance(ArcGisImageServerAvailableBandTraits, {
        id: i,
        name: bandNames[i] ?? `Band ${i}`
      });
    });
  }

  get disableBandsSelector() {
    return this._item.availableBands.length <= 1;
  }

  get allowRasterFunction() {
    return this.imageServer.allowRasterFunction;
  }

  get availableRasterFunctions() {
    if (!this._item.allowRasterFunction) return [];
    const builtInRasterFunctions = [
      createStratumInstance(ArcGisImageServerAvailableRasterFunctionTraits, {
        name: "Colormap",
        description:
          "The Colormap function transforms the pixel values to display the raster data as a red, green, blue (RGB) color image, based on specific colors in a color map or a color range defined in a color ramp"
      })
    ];
    return [
      ...(this.imageServer?.rasterFunctionInfos
        .filter((rasterFn) => rasterFn.name && rasterFn.name !== "None")
        .map((rasterFn) => {
          return createStratumInstance(
            ArcGisImageServerAvailableRasterFunctionTraits,
            {
              name: rasterFn.name,
              description:
                rasterFn.description !== "A raster function template."
                  ? rasterFn.description
                  : undefined,
              help: rasterFn.help
            }
          );
        }) ?? []),
      ...builtInRasterFunctions
    ];
  }

  get disableRasterFunctionSelectors() {
    return !this._item.allowRasterFunction;
  }

  get disableColorMapSelector() {
    return (
      !this._item.renderingRule ||
      this._item.renderingRule.rasterFunction !== "Colormap" ||
      // Also disable color map selector if Colormap manually set (Note the ColormapName property is used instead for pre-defined colormaps, ColorMap is used for custom colormaps)
      !!this._item.renderingRule.rasterFunctionArguments?.Colormap
    );
  }

  get hasMultidimensions() {
    return this.imageServer.hasMultidimensions;
  }

  get availableVariables() {
    return this.multidimensionalInfo?.multidimensionalInfo.variables.map(
      (variable) => {
        return createStratumInstance(ArcGisImageServerAvailableVariableTraits, {
          name: variable.name,
          description: variable.description,
          unit: variable.unit
        });
      }
    );
  }

  get disableVariableSelectors() {
    return (
      !this._item.hasMultidimensions ||
      // Only show variable selector for well known raster raster functions
      !this._item.renderingRule.rasterFunction ||
      !ImageServerWellKnownRasterFunctions.includes(
        this._item.renderingRule.rasterFunction
      )
    );
  }
}

StratumOrder.addLoadStratum(ImageServerStratum.stratumName);

class ImageServerLegendStratum extends LoadableStratum(
  ArcGisImageServerCatalogItemTraits
) {
  static stratumName = "ImageServerLegend";

  constructor(
    private readonly _item: ArcGisImageServerCatalogItem,
    private readonly _legends: Legends | undefined
  ) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new ImageServerLegendStratum(
      newModel as ArcGisImageServerCatalogItem,
      this._legends
    ) as this;
  }

  static async load(item: ArcGisImageServerCatalogItem) {
    if (!isDefined(item.uri)) {
      throw new TerriaError({
        title: i18next.t("models.arcGisImageServerCatalogItem.invalidUrlTitle"),
        message: i18next.t(
          "models.arcGisImageServerCatalogItem.invalidUrlMessage"
        )
      });
    }

    let legendUri = getBaseURI(item).segment("legend");

    legendUri.addQuery(item.flattenedParameters);

    if (isDefined(item.token)) {
      legendUri = legendUri.addQuery("token", item.token);
    }

    const legendMetadata: Legends | undefined = await getJson(item, legendUri);

    const stratum = new ImageServerLegendStratum(item, legendMetadata);

    return stratum;
  }

  @computed get legends() {
    const noDataRegex = /^No[\s_-]?Data$/i;
    const labelsRegex = /_Labels$/;

    let items: StratumFromTraits<LegendItemTraits>[] = [];

    (this._legends?.layers || []).forEach((l) => {
      if (noDataRegex.test(l.layerName) || labelsRegex.test(l.layerName)) {
        return;
      }

      l.legend?.forEach((leg) => {
        const title = replaceUnderscores(
          leg.label !== "" ? leg.label : l.layerName
        );
        const dataUrl = "data:" + leg.contentType + ";base64," + leg.imageData;
        items.push(
          createStratumInstance(LegendItemTraits, {
            title,
            imageUrl: dataUrl,
            imageWidth: leg.width,
            imageHeight: leg.height
          })
        );
      });
    });

    items = uniqWith(items, (a, b) => a.imageUrl === b.imageUrl);

    return [createStratumInstance(LegendTraits, { items })];
  }
}

StratumOrder.addLoadStratum(ImageServerLegendStratum.stratumName);

export default class ArcGisImageServerCatalogItem extends UrlMixin(
  DiscretelyTimeVaryingMixin(
    MinMaxLevelMixin(
      CatalogMemberMixin(
        MappableMixin(CreateModel(ArcGisImageServerCatalogItemTraits))
      )
    )
  )
) {
  static readonly type = "esri-imageServer";

  private _legendStratumLoader = new AsyncLoader(
    this.forceLoadLegends.bind(this)
  );

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get typeName() {
    return i18next.t("models.arcGisImageServerCatalogItem.name");
  }

  get type() {
    return ArcGisImageServerCatalogItem.type;
  }

  protected async forceLoadMetadata(): Promise<void> {
    const stratum = await ImageServerStratum.load(this);
    runInAction(() => {
      this.strata.set(ImageServerStratum.stratumName, stratum);
    });
    await this._legendStratumLoader.load();
  }

  protected async forceLoadLegends(): Promise<void> {
    const stratum = await ImageServerLegendStratum.load(this);
    runInAction(() => {
      this.strata.set(ImageServerLegendStratum.stratumName, stratum);
    });
  }

  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  @override
  get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "1d";
  }

  @computed
  get discreteTimes() {
    const imageServerStratum: ImageServerStratum | undefined = this.strata.get(
      ImageServerStratum.stratumName
    ) as ImageServerStratum | undefined;

    if (imageServerStratum?.imageServer.timeInfo === undefined)
      return undefined;

    const result: (StratumFromTraits<DiscreteTimeTraits> & {
      time: string;
    })[] = [];

    createDiscreteTimesFromIsoSegments(
      result,
      new Date(
        imageServerStratum.imageServer.timeInfo.timeExtent[0]
      ).toISOString(),
      new Date(
        imageServerStratum.imageServer.timeInfo.timeExtent[1]
      ).toISOString(),
      undefined,
      this.maxRefreshIntervals
    );
    return result;
  }

  private get _currentImageryParts(): ImageryParts | undefined {
    // Make sure legend stays up to date
    this._legendStratumLoader.load();

    const imageryProvider = this._createImageryProvider(
      this.currentDiscreteJulianDate
    );

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
  }

  @computed
  get _nextImageryParts(): ImageryParts | undefined {
    if (
      this.terria.timelineStack.contains(this) &&
      !this.isPaused &&
      this.nextDiscreteTimeTag
    ) {
      const imageryProvider = this._createImageryProvider(
        this.nextDiscreteJulianDate
      );

      if (imageryProvider) {
        imageryProvider.enablePickFeatures = false;
        return {
          imageryProvider,
          alpha: 0.0,
          show: true,
          clippingRectangle: this.clipToRectangle
            ? this.cesiumRectangle
            : undefined
        };
      }
    } else {
      return undefined;
    }
  }

  /** Flatten nested JSON parameters (stringify them). These are applied onto ArcGisImageServerImageryProvider requests.
   * This will include renderingRule and bandIds if they are set.
   */
  @computed
  get flattenedParameters() {
    const params = Object.entries(this.parameters ?? {}).reduce<JsonObject>(
      (acc, [key, value]) => {
        if (isJsonObject(value)) acc[key] = JSON.stringify(value);
        else acc[key] = value;
        return acc;
      },
      {}
    );

    if (this.renderingRule)
      params.renderingRule = JSON.stringify(
        this.traits["renderingRule"].toJson(this.renderingRule)
      );

    if (this.bandIds) params.bandIds = this.bandIds.join(",");

    return params;
  }

  private _createImageryProvider = createTransformerAllowUndefined(
    (
      time: JulianDate | undefined
    ): ArcGisImageServerImageryProvider | undefined => {
      if (!isDefined(this.url)) {
        return undefined;
      }

      const params = { ...this.flattenedParameters };
      if (time) params.time = JulianDate.toDate(time).getTime();

      let tilingScheme: WebMercatorTilingScheme | GeographicTilingScheme;

      if (this.wkid === 102100 || this.wkid === 102113) {
        tilingScheme = new WebMercatorTilingScheme();
      } else if (this.wkid === 4326) {
        tilingScheme = new GeographicTilingScheme();
      } else {
        throw TerriaError.from(
          `Tile spatial reference WKID ${this.wkid} is not supported.`
        );
      }

      return new ArcGisImageServerImageryProvider({
        url: cleanAndProxyUrl(this, this.url),
        tilingScheme: tilingScheme,
        maximumLevel: this.maximumLevel,
        minimumLevel: this.minimumLevel,
        tileHeight: this.tileHeight,
        tileWidth: this.tileWidth,
        parameters: params,
        enablePickFeatures: this.allowFeaturePicking,
        usePreCachedTiles: this.usePreCachedTiles,
        token: this.token,
        credit: this.attribution ?? ""
      });
    }
  );

  @computed
  get mapItems() {
    if (this.isLoadingMetadata) return [];
    return [this._currentImageryParts, this._nextImageryParts].filter(
      isDefined
    );
  }

  @override
  get selectableDimensions() {
    return filterOutUndefined([
      ...super.selectableDimensions,
      this.bandsSelectableDimensions,
      this.rasterFunctionSelectableDimensions,
      this.colorMapSelectableDimensions,
      this.variableSelectableDimensions
    ]);
  }

  @computed
  get rasterFunctionSelectableDimensions():
    | SelectableDimensionEnum
    | undefined {
    if (this.disableRasterFunctionSelectors) return undefined;
    return {
      id: "raster-functions",
      name: i18next.t(
        "models.arcGisImageServerCatalogItem.selectableDimensions.rasterFunction"
      ),
      options: this.availableRasterFunctions.map((rasterFn) => ({
        id: rasterFn.name,
        name: rasterFn.name,
        description: rasterFn.description
      })),
      selectedId: this.renderingRule.rasterFunction,
      allowUndefined: true,
      undefinedLabel: "Default",
      setDimensionValue: (strata, rasterFunction) => {
        if (!this.renderingRule) {
          this.setTrait(
            strata,
            "renderingRule",
            createStratumInstance(ArcGisImageServerRenderingRule, {
              rasterFunction
            })
          );
        } else {
          this.renderingRule.setTrait(strata, "rasterFunction", rasterFunction);
        }
      }
    };
  }

  @computed
  get variableSelectableDimensions(): SelectableDimensionEnum | undefined {
    if (this.disableVariableSelectors) return undefined;
    return {
      id: "variable-selector",
      name: i18next.t(
        "models.arcGisImageServerCatalogItem.selectableDimensions.variable"
      ),
      options: this.availableVariables.map((variable) => ({
        id: variable.name,
        name: variable.name,
        description: variable.description
      })),
      selectedId: this.renderingRule.variableName,
      allowUndefined: true,
      undefinedLabel: "Default",
      setDimensionValue: (strata, variableName) => {
        if (!this.renderingRule) {
          this.setTrait(
            strata,
            "renderingRule",
            createStratumInstance(ArcGisImageServerRenderingRule, {
              variableName
            })
          );
        } else {
          this.renderingRule.setTrait(strata, "variableName", variableName);
        }
      }
    };
  }

  @computed get colorMapSelectableDimensions():
    | SelectableDimensionEnum
    | undefined {
    if (this.disableColorMapSelector) return undefined;
    return {
      id: "colormap-selector",
      name: i18next.t(
        "models.arcGisImageServerCatalogItem.selectableDimensions.variable"
      ),
      options: ImageServerBuiltInColorRamps.map((ramp) => ({
        id: ramp
      })),
      selectedId:
        this.renderingRule.rasterFunctionArguments?.ColormapName?.toString(),
      allowUndefined: true,
      undefinedLabel: "Default",
      setDimensionValue: (strata, ColormapName) => {
        this.renderingRule.setTrait(strata, "rasterFunctionArguments", {
          ...(this.renderingRule.rasterFunctionArguments ?? {}),
          ColormapName
        });
      }
    };
  }

  @computed get bandsSelectableDimensions():
    | SelectableDimensionMultiEnum
    | undefined {
    if (this.disableBandsSelector) return undefined;
    return {
      id: "bands-selector",
      name: i18next.t(
        "models.arcGisImageServerCatalogItem.selectableDimensions.bands"
      ),
      options: this.availableBands.map((band) => ({
        id: band.id?.toString(),
        name: band.name
      })),
      type: "select-multi",
      selectedIds: this.bandIds?.map((id) => id.toString()),
      allowUndefined: true,
      setDimensionValue: (strata, bands) => {
        if (!bands || bands.length === 0) {
          this.setTrait(strata, "bandIds", undefined);
        } else {
          this.setTrait(
            strata,
            "bandIds",
            bands.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n))
          );
        }
      }
    };
  }
}

function getBaseURI(item: ArcGisImageServerCatalogItem) {
  const uri = new URI(item.url);
  const lastSegment = uri.segment(-1);
  if (lastSegment && lastSegment.match(/\d+/)) {
    uri.segment(-1, "");
  }
  return uri;
}

async function getJson(item: ArcGisImageServerCatalogItem, uri: any) {
  try {
    const response = await loadJson(
      proxyCatalogItemUrl(item, uri.addQuery("f", "json").toString())
    );
    return response;
  } catch (err) {
    console.log(err);
    return undefined;
  }
}

function cleanAndProxyUrl(
  catalogItem: ArcGisImageServerCatalogItem,
  url: string
) {
  return proxyCatalogItemUrl(catalogItem, cleanUrl(url));
}

function cleanUrl(url: string) {
  // Strip off the search portion of the URL
  const uri = new URI(url);
  uri.search("");
  return uri.toString();
}
