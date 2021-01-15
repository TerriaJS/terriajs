import BoundingSphere from "terriajs-cesium/Source/Core/BoundingSphere";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import CameraView from "./CameraView";

export type ItemSearchParameter =
  | NumericItemSearchParameter
  | EnumItemSearchParameter
  | TextItemSearchParameter;

export type BaseParameter = {
  id: string;
  name: string;
};

export interface NumericItemSearchParameter extends BaseParameter {
  type: "numeric";
  range: { min: number; max: number };
}

export interface EnumItemSearchParameter extends BaseParameter {
  type: "enum";
  values: { id: string; count: number }[];
}

export interface TextItemSearchParameter extends BaseParameter {
  type: "text";
}

export type ItemSearchResult = {
  id: string | number;
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

  /**
   * An optional hook to receive a hint that the user might search the parameter with `parameterId`.
   *
   * If indexes for parameters takes too long to load, implementing this method can
   * improve search time by pre-emptively loading the index. This hook is called
   * while the user is inputing value for the parameter. It can be called
   * multiple times, so the implementation must take care not to make
   * duplicate requests.
   */
  loadParameterHint?: (parameterId: string, valueHint: any) => void;
}
