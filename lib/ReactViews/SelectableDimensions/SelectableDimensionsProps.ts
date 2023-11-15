import { SelectableDimension as SelectableDimensionModel } from "../../Models/SelectableDimensions/SelectableDimensions";

export interface SelectableDimensionsProps<T extends SelectableDimensionModel> {
  id: string;
  dim: T;
}
