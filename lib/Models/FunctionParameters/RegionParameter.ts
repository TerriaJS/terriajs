import RegionProvider from "../../Map/Region/RegionProvider";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameter";
import RegionTypeParameter from "./RegionTypeParameter";

interface Options extends FunctionParameterOptions {
  regionProvider: RegionTypeParameter;
}

type RegionValue = string | number;

export default class RegionParameter extends FunctionParameter<RegionValue> {
  static readonly type = "region";
  readonly type = "region";
  readonly _regionProviderOrParam: RegionProvider | RegionTypeParameter;

  constructor(
    catalogFunction: CatalogFunctionMixin.Instance,
    options: Options
  ) {
    super(catalogFunction, options);
    this._regionProviderOrParam = options.regionProvider;
  }

  get regionProvider(): RegionProvider | undefined {
    return this._regionProviderOrParam instanceof RegionTypeParameter
      ? this._regionProviderOrParam.regionProvider
      : this._regionProviderOrParam;
  }

  get regionTypeParameter(): RegionTypeParameter | undefined {
    return this._regionProviderOrParam instanceof RegionTypeParameter
      ? this._regionProviderOrParam
      : undefined;
  }

  static formatValueForUrl(region: RegionValue) {
    return JSON.stringify(region);
  }
}
