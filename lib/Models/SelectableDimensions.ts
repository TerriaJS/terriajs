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

export type SelectableDimensionType =
  | undefined
  | "select"
  | "checkbox"
  | "group";

export type Placement = "default" | "belowLegend";
export const DEFAULT_PLACEMENT: Placement = "default";

interface Base extends Dimension {
  setDimensionValue(stratumId: string, selectedId: string): void;
  disable?: boolean;
  /** Placement of dimension in Workbench:
   * - default (above legend and short-report sections)
   * - belowLegend
   */
  placement?: Placement;
  type?: SelectableDimensionType;
}

// The default type for SelectableDimension is Select (dropdown menu)
export interface SelectableDimensionSelect extends Base {
  type?: undefined | "select";
}
export interface SelectableDimensionCheckbox extends Base {
  readonly selectedId?: "true" | "false";
  readonly options?: readonly [
    {
      readonly id?: "true";
      readonly name?: string;
    },
    {
      readonly id?: "false";
      readonly name?: string;
    }
  ];
  type: "checkbox";
}

export interface SelectableDimensionGroup
  extends Omit<Base, "setDimensionValue"> {
  type: "group";

  // We don't allow nested groups for now to keep the UI simple
  readonly selectableDimensions: Exclude<
    SelectableDimension,
    SelectableDimensionGroup
  >[];
}

export type SelectableDimension =
  | SelectableDimensionSelect
  | SelectableDimensionCheckbox
  | SelectableDimensionGroup;

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
