import { observable } from "mobx";
import GeographicTilingScheme from "terriajs-cesium/Source/Core/GeographicTilingScheme";
import TilingScheme from "terriajs-cesium/Source/Core/TilingScheme";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import {
  SUPPORTED_CRS_3857,
  SUPPORTED_CRS_4326
} from "../../Traits/TraitsClasses/CrsTraits";

export interface TerriaTilingScheme extends TilingScheme {
  // Custom tiling implementations can specify its CRS
  customCrs?: string;
}

export type TilingSchemeGeneratorFunction = (
  crs: string | undefined
) => TerriaTilingScheme | undefined;

/**
 * The default tiling scheme generator
 */
const defaultTilingSchemeGenerator = (crs: string | undefined) => {
  if (crs) {
    if (SUPPORTED_CRS_3857.includes(crs)) return new WebMercatorTilingScheme();
    if (SUPPORTED_CRS_4326.includes(crs)) return new GeographicTilingScheme();
  }

  return new WebMercatorTilingScheme();
};

export default class TilingSchemeGenerator {
  private static readonly _generators = observable.map<
    string,
    TilingSchemeGeneratorFunction
  >();

  static readonly default = defaultTilingSchemeGenerator;

  /**
   * Register a custom tiling scheme generator
   */
  static register(
    generatorName: string,
    generator: TilingSchemeGeneratorFunction
  ) {
    this._generators.set(generatorName, generator);
  }

  /**
   * Get a custom tiling scheme generator by its registered name
   */
  static get(generatorName: string): TilingSchemeGeneratorFunction | undefined {
    return this._generators.get(generatorName);
  }

  /**
   * Return the CRS of the tiling scheme if it is known
   */
  static getCustomCrs(tilingScheme: TerriaTilingScheme): string | undefined {
    return tilingScheme?.customCrs;
  }

  /**
   * Returns true if the tiling scheme is custom
   */
  static isCustomTilingScheme(tilingScheme: TilingScheme): boolean {
    return !(
      tilingScheme instanceof WebMercatorTilingScheme ||
      tilingScheme instanceof GeographicTilingScheme
    );
  }
}
