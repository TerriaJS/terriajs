import { computed, makeObservable, observable, runInAction } from "mobx";
import RegionProvider from "../../Map/Region/RegionProvider";
import RegionProviderList from "../../Map/Region/RegionProviderList";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameter";

interface Options extends FunctionParameterOptions {
  /**
   * Use only the sepecified region types. If not specified, all available region types are used.
   */
  validRegionTypes?: string[];
}

type RegionType = string;

export default class RegionTypeParameter extends FunctionParameter<RegionType> {
  static readonly type = "regionType";
  readonly type = "regionType";

  readonly validRegionTypes: string[] | undefined;

  /**
   * Save usable region providers from the call to getUsableRegionProviders() for reuse.
   */
  private loadPromise: Promise<void> | undefined;

  @observable
  regionProviders: RegionProvider[] | undefined;

  constructor(
    catalogFunction: CatalogFunctionMixin.Instance,
    options: Options
  ) {
    super(catalogFunction, options);
    makeObservable(this);

    this.validRegionTypes = options.validRegionTypes;
  }

  @computed
  get regionProvider(): RegionProvider | undefined {
    return this.regionProviders?.find((r) => r.regionType === this.value);
  }

  /**
   * Loads usable region providers
   */
  load(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    const validRegionTypes = this.validRegionTypes
      ? new Set(this.validRegionTypes)
      : undefined;

    const filterRegionProviders = (rs: RegionProvider[]) =>
      rs.filter(
        (r) =>
          r.analyticsWmsServer &&
          r.analyticsWmsLayerName &&
          validRegionTypes?.has(r.regionType) !== false
      );

    this.loadPromise = this.fetchAllRegionProviders()
      .then(filterRegionProviders)
      .then((regionProviders) =>
        runInAction(() => {
          this.regionProviders = regionProviders;
        })
      );

    return this.loadPromise;
  }

  private async fetchAllRegionProviders(): Promise<RegionProvider[]> {
    const terria = this.catalogFunction.terria;
    const urls = terria.configParameters.regionMappingDefinitionsUrl
      ? [terria.configParameters.regionMappingDefinitionsUrl]
      : terria.configParameters.regionMappingDefinitionsUrls;

    const regionProviders = (
      await Promise.all(
        urls.map((url) => RegionProviderList.fromUrl(url, terria.corsProxy))
      )
    )
      .map((list) => list.regionProviders)
      .flat(2);

    return regionProviders;
  }
}
