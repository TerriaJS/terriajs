import { computed, observable, runInAction } from "mobx";
import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import ModelTraits from "../Traits/ModelTraits";


export interface DimensionOption {
  readonly id: string;
  readonly name: string;
}

export interface SelectableDimension {
  readonly id: string;
  readonly name: string;
  readonly options: readonly DimensionOption[];
  readonly selectedId: string | undefined;
  setDimensionValue(stratumId: string, selectedId: string): void;
}

interface SelectableDimensions {
  selectableDimensions: SelectableDimension[]
}


namespace SelectableDimensions {
  export function is(model: SelectableDimensions): model is SelectableDimensions {
    return "selectableDimensions" in model;
  }
}

export default SelectableDimensions;
