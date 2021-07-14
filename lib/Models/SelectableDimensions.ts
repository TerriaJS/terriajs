/** Maximum number of options for a `SelectableDimension` */
export const MAX_SELECTABLE_DIMENSION_OPTIONS = 1000;

export interface DimensionOption {
  readonly id?: string;
  readonly name?: string;
}

export interface Dimension {
  readonly id?: string;
  readonly name?: string;
  readonly options?: readonly DimensionOption[];
  readonly selectedId?: string;
  readonly allowUndefined?: boolean;
  readonly undefinedLabel?: string;
}

export interface SelectableDimension extends Dimension {
  setDimensionValue(stratumId: string, selectedId: string): void;
  disable?: boolean;
}

interface SelectableDimensions {
  selectableDimensions: SelectableDimension[];
}

namespace SelectableDimensions {
  export function is(
    model: SelectableDimensions
  ): model is SelectableDimensions {
    return "selectableDimensions" in model;
  }
}

export default SelectableDimensions;
