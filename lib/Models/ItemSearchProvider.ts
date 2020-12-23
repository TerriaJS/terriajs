import BoundingSphere from "terriajs-cesium/Source/Core/BoundingSphere";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
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

export default abstract class ItemSearchProvider {
  constructor(options: any) {}

  abstract load(): Promise<void>;
  abstract describeParameters(): Promise<ItemSearchParameter[]>;
  abstract getIdPropertyName(): string;
  abstract search(
    parameterValues: Map<string, any>
  ): Promise<ItemSearchResult[]>;
}
