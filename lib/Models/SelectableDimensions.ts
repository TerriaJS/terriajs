import isDefined from "../Core/isDefined";

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
  | "checkbox-group"
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

export type option<A> = {
  readonly id?: A;
  readonly name?: string;
};

// The default type for SelectableDimension is Select (dropdown menu)
export interface SelectableDimensionSelect extends Base {
  type?: undefined | "select";
  readonly options?: readonly option<string>[];
}
export interface SelectableDimensionCheckbox extends Base {
  readonly selectedId?: "true" | "false";
  readonly options?: readonly option<"true" | "false">[];
  type: "checkbox";
}

export interface SelectableDimensionCheckboxGroup extends Base {
  readonly selectedId?: "true" | "false";
  readonly options?: readonly option<"true" | "false">[];
  type: "checkbox-group";

  // We don't allow nested groups for now to keep the UI simple
  readonly selectableDimensions: Exclude<
    SelectableDimension,
    SelectableDimensionGroup | SelectableDimensionCheckboxGroup
  >[];
}

export interface SelectableDimensionGroup
  extends Omit<Base, "setDimensionValue"> {
  type: "group";

  // We don't allow nested groups for now to keep the UI simple
  readonly selectableDimensions: Exclude<
    SelectableDimension,
    SelectableDimensionGroup | SelectableDimensionCheckboxGroup
  >[];
}

export type SelectableDimension =
  | SelectableDimensionSelect
  | SelectableDimensionCheckbox
  | SelectableDimensionCheckboxGroup
  | SelectableDimensionGroup;

interface SelectableDimensions {
  selectableDimensions: SelectableDimension[];
}

namespace SelectableDimensions {
  export function is(model: any): model is SelectableDimensions {
    return "selectableDimensions" in model;
  }
}

const isCheckbox = (
  dim: SelectableDimension
): dim is SelectableDimensionCheckbox => dim.type === "checkbox";
const isSelect = (dim: SelectableDimension): dim is SelectableDimensionSelect =>
  dim.type === "select" || dim.type === undefined;

const isCorrectPlacement = (placement?: Placement) => (
  dim: SelectableDimension
) =>
  dim.placement ? dim.placement === placement : placement === DEFAULT_PLACEMENT;
const isEnabled = (dim: SelectableDimension) => !dim.disable;
const hasValidOptions = (dim: SelectableDimension) => {
  const minLength = dim.allowUndefined ? 1 : 2; // Filter out dimensions with only 1 option (unless they have 1 option and allow undefined - which is 2 total options)
  return (
    isDefined(dim.options) &&
    dim.options.length >= minLength &&
    dim.options.length < MAX_SELECTABLE_DIMENSION_OPTIONS
  );
};
const isGroup = (dim: SelectableDimension): dim is SelectableDimensionGroup =>
  dim.type === "group";

// Filter out dimensions with only 1 option (unless they have 1 option and allow undefined - which is 2 total options)
export const filterSelectableDimensions = (placement: Placement) => (
  selectableDimensions: SelectableDimension[] = []
) =>
  selectableDimensions.filter(
    dim =>
      // Filter by placement if defined, otherwise use default placement
      isCorrectPlacement(placement)(dim) &&
      isEnabled(dim) &&
      (hasValidOptions(dim) || isGroup(dim)) // Groups do not have options
  );

export const findSelectedValueName = (
  dim: SelectableDimension
): string | undefined => {
  const name = dim.options?.find(opt => opt.id === dim.selectedId)?.name;
  if (isSelect(dim)) {
    return name;
  } else if (isCheckbox(dim)) {
    return dim.selectedId === "true" ? "Enabled" : "Disabled";
  }
};

export default SelectableDimensions;
