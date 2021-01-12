import BoundingSphere from "terriajs-cesium/Source/Core/BoundingSphere";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import Constructor from "../Core/Constructor";
import CameraView from "./CameraView";

export type ItemSearchParameter =
  | NumericItemSearchParameter
  | EnumItemSearchParameter
  | TextItemSearchParameter;

export interface NumericItemSearchParameter {
  type: "numeric";
  id: string;
  name: string;
  range: { min: number; max: number };
}

export interface EnumItemSearchParameter {
  type: "enum";
  id: string;
  name: string;
  values: { id: string; count: number }[];
}

export interface TextItemSearchParameter {
  type: "text";
  id: string;
  name: string;
}

export type ItemSearchResult = {
  id: string;
  idPropertyName: string;
  zoomToTarget:
    | CameraView
    | Rectangle
    | DataSource
    | { boundingSphere: BoundingSphere };
  properties: Record<string, string | number>;
};

/**
 * An ItemSearchProvider provides an API for searching within an item.
 *
 */
export default abstract class ItemSearchProvider {
  constructor(options: any) {}

  /**
   * Called once on start to initialize the item search provider.
   *
   * @return A promise that resolves when the initialization is complete.
   */
  abstract initialize(): Promise<void>;

  /**
   * Returns a list of parameters that can be searched.
   *
   * @return A promise that resolves to an array of ItemSearchParameter.
   */
  abstract describeParameters(): Promise<ItemSearchParameter[]>;

  /**
   * Perform a search.
   *
   * @param parameterValues A map from parameter ID to its value.
   * @return A promise that resolves to an array of ItemSearchResult.
   */
  abstract search(
    parameterValues: Map<string, any>
  ): Promise<ItemSearchResult[]>;
}

export const ItemSearchProviders: Map<
  string,
  Constructor<ItemSearchProvider>
> = new Map();

export function registerItemSearchProvider(
  type: string,
  providerClass: Constructor<ItemSearchProvider>
) {
  ItemSearchProviders.set(type, providerClass);
}
