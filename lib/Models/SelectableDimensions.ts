import isDefined from "../Core/isDefined";

/** Maximum number of options for a `SelectableDimension` */
export const MAX_SELECTABLE_DIMENSION_OPTIONS = 1000;

export interface DimensionOption<T = string> {
  readonly id?: T;
  readonly name?: string;
}

interface Dimension {
  /** Machine readable ID */
  readonly id?: string;
  /** Human readable name */
  readonly name?: string;
}

export interface EnumDimension<T = string> extends Dimension {
  readonly options?: readonly DimensionOption<T>[];
  readonly selectedId?: string;
  readonly allowUndefined?: boolean;
  readonly undefinedLabel?: string;
}

export interface NumericalDimension extends Dimension {
  readonly value?: number;
  readonly min?: number;
  readonly max?: number;
  readonly allowUndefined?: boolean;
}

export const isEnumDimension = (
  dim: Dimension
): dim is EnumDimension<unknown> => {
  return "options" in dim;
};

export type SelectableDimensionType =
  | undefined
  | "select"
  | "numeric"
  | "checkbox"
  | "group";

export type Placement = "default" | "belowLegend";
export const DEFAULT_PLACEMENT: Placement = "default";

interface Base<T = string> {
  setDimensionValue(stratumId: string, selectedId: T): void;
  disable?: boolean;
  /** Placement of dimension in Workbench:
   * - default (above legend and short-report sections)
   * - belowLegend
   * This is only relevant to top level SelectableDimensions (not nested in groups)
   */
  placement?: Placement;
  type?: SelectableDimensionType;
}

// The default type for SelectableDimension is Select (dropdown menu)
export interface SelectableDimensionSelect extends Base<string>, EnumDimension {
  type?: undefined | "select";
}

export interface SelectableDimensionCheckbox
  extends Base<"true" | "false">,
    EnumDimension {
  type: "checkbox";
}

export interface SelectableDimensionNumeric
  extends Base<number>,
    NumericalDimension {
  type: "numeric";
}

export interface SelectableDimensionGroup
  extends Omit<Base, "setDimensionValue">,
    Dimension {
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
  | SelectableDimensionGroup
  | SelectableDimensionNumeric;

export const isCheckbox = (
  dim: SelectableDimension
): dim is SelectableDimensionCheckbox => dim.type === "checkbox";

export const isSelect = (
  dim: SelectableDimension
): dim is SelectableDimensionSelect =>
  dim.type === "select" || dim.type === undefined;

/** Return only SelectableDimensionSelect from array of SelectableDimension */
export const filterSelects = (
  dims: SelectableDimension[]
): SelectableDimensionSelect[] => dims.filter(isSelect);

export const isGroup = (
  dim: SelectableDimension
): dim is SelectableDimensionGroup => dim.type === "group";

export const isNumeric = (
  dim: SelectableDimension
): dim is SelectableDimensionNumeric => dim.type === "numeric";

const isCorrectPlacement = (placement?: Placement) => (
  dim: SelectableDimension
) =>
  dim.placement ? dim.placement === placement : placement === DEFAULT_PLACEMENT;

const isEnabled = (dim: SelectableDimension) => !dim.disable;

/** Filter out dimensions with only 1 option (unless they have 1 option and allow undefined - which is 2 total options) */
const enumHasValidOptions = (dim: EnumDimension) => {
  const minLength = dim.allowUndefined ? 1 : 2;
  return (
    isDefined(dim.options) &&
    dim.options.length >= minLength &&
    dim.options.length < MAX_SELECTABLE_DIMENSION_OPTIONS
  );
};

/** Filter with SelectableDimension should be shown for a given placement.
 * This will take into account whether SelectableDimension is valid, not disabled, etc...
 */
export const filterSelectableDimensions = (placement?: Placement) => (
  selectableDimensions: SelectableDimension[] = []
) =>
  selectableDimensions.filter(
    dim =>
      // Filter by placement if defined, otherwise use default placement
      (!isDefined(placement) || isCorrectPlacement(placement)(dim)) &&
      isEnabled(dim) &&
      // Check enum dimensions for valid options
      (!isEnumDimension(dim) || enumHasValidOptions(dim))
  );

/** Find human readable name for the current value for a SelectableDimension */
export const findSelectedValueName = (
  dim: Exclude<SelectableDimension, SelectableDimensionGroup>
): string | undefined => {
  if (isCheckbox(dim)) {
    return dim.selectedId === "true" ? "Enabled" : "Disabled";
  }

  if (isSelect(dim)) {
    return dim.options?.find(opt => opt.id === dim.selectedId)?.name;
  }

  if (isNumeric(dim)) {
    return dim.value?.toString();
  }
};

interface SelectableDimensions {
  selectableDimensions: SelectableDimension[];
}

namespace SelectableDimensions {
  export function is(model: any): model is SelectableDimensions {
    return "selectableDimensions" in model;
  }
}

export default SelectableDimensions;
