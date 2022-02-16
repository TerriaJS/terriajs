import isDefined from "../../Core/isDefined";

/** `Dimension` (and child interfaces - eg `EnumDimension`, `NumericalDimension`, ...) are Trait/JSON friendly interfaces. They are used as base to the `SelectableDimension` interfaces.
 *
 * This is useful because it means we can directly use Traits to create SelectableDimensions - for example see `EnumDimensionTraits` in `lib/Traits/TraitsClasses/DimensionTraits.ts`
 */
interface Dimension {
  /** Machine readable ID */
  readonly id?: string;
  /** Human readable name */
  readonly name?: string;
}

export interface EnumDimensionOption<T = string> {
  readonly id?: T;
  readonly name?: string;
}

export interface EnumDimension<T = string> extends Dimension {
  readonly options?: readonly EnumDimensionOption<T>[];
  readonly selectedId?: T;
  readonly allowUndefined?: boolean;
  readonly undefinedLabel?: string;
}

export interface NumericalDimension extends Dimension {
  readonly value?: number;
  readonly min?: number;
  readonly max?: number;
  readonly allowUndefined?: boolean;
}

export interface TextDimension extends Dimension {
  readonly value?: string;
  readonly allowUndefined?: boolean;
}

export interface ColorDimension extends Dimension {
  readonly value?: string;
}

export interface ButtonDimension extends Dimension {
  readonly value?: string;
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
  | "text"
  | "checkbox"
  | "group"
  | "button"
  | "color";

export type Placement = "default" | "belowLegend";
export const DEFAULT_PLACEMENT: Placement = "default";

/** Base SelectableDimension interface. Each following SelectableDimension will extend this and the Dimension interface above */
interface Base<T = string> {
  setDimensionValue(stratumId: string, value: T): void;
  disable?: boolean;
  /** Placement of dimension in Workbench:
   * - default (above legend and short-report sections)
   * - belowLegend
   * This is only relevant to top level SelectableDimensions (not nested in groups)
   */
  placement?: Placement;
  type?: SelectableDimensionType;
}

export interface SelectableDimensionEnum extends Base<string>, EnumDimension {
  type?: undefined | "select";
}

/** Maximum number of options for a `SelectableDimension` */
export const MAX_SELECTABLE_DIMENSION_OPTIONS = 1000;

export interface SelectableDimensionCheckbox
  extends Base<"true" | "false">,
    EnumDimension {
  type: "checkbox";
}

export interface SelectableDimensionButton extends Base<true>, ButtonDimension {
  type: "button";
}

export interface SelectableDimensionNumeric
  extends Base<number>,
    NumericalDimension {
  type: "numeric";
}

export interface SelectableDimensionText extends Base<string>, TextDimension {
  type: "text";
}

export interface SelectableDimensionColor extends Base<string>, ColorDimension {
  type: "color";
}

export interface SelectableDimensionGroup
  extends Omit<Base, "setDimensionValue">,
    Dimension {
  type: "group";

  isOpen?: boolean;
  /** Function is called whenever SelectableDimensionGroup is toggled (closed or opened).
   * Return value is `true` if the listener has consumed the event, `false` otherwise.
   * This means you can manage group open state separately if desired
   */
  onToggle?: (isOpen: boolean) => boolean | undefined;

  // We don't allow nested groups for now to keep the UI simple
  readonly selectableDimensions: Exclude<
    SelectableDimension,
    SelectableDimensionGroup
  >[];
}

/** This is essentially the same as `SelectableDimensionGroup`, but allows two levels of nested `SelectableDimensionGroup`, instead of one */
export interface SelectableDimensionWorkflowGroup
  extends Omit<Base, "setDimensionValue">,
    Dimension {
  type: "group";

  // Here we allow two levels of nested groups
  readonly selectableDimensions: SelectableDimension[];
}

export type SelectableDimension =
  | SelectableDimensionEnum
  | SelectableDimensionCheckbox
  | SelectableDimensionGroup
  | SelectableDimensionNumeric
  | SelectableDimensionText
  | SelectableDimensionButton
  | SelectableDimensionColor;

export const isCheckbox = (
  dim: SelectableDimension
): dim is SelectableDimensionCheckbox => dim.type === "checkbox";

export const isSelect = (
  dim: SelectableDimension
): dim is SelectableDimensionEnum =>
  dim.type === "select" || dim.type === undefined;

/** Return only SelectableDimensionSelect from array of SelectableDimension */
export const filterSelects = (
  dims: SelectableDimension[]
): SelectableDimensionEnum[] => dims.filter(isSelect);

export const isGroup = (
  dim: SelectableDimension
): dim is SelectableDimensionGroup => dim.type === "group";

export const isNumeric = (
  dim: SelectableDimension
): dim is SelectableDimensionNumeric => dim.type === "numeric";

export const isText = (
  dim: SelectableDimension
): dim is SelectableDimensionText => dim.type === "text";

export const isButton = (
  dim: SelectableDimension
): dim is SelectableDimensionButton => dim.type === "button";

export const isColor = (
  dim: SelectableDimension
): dim is SelectableDimensionColor => dim.type === "color";

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

  if (isText(dim)) return dim.value;
};

/** Interface to be implemented by BaseModels (eg CatalogMembers) to add selectableDimensions */
interface SelectableDimensions {
  selectableDimensions: SelectableDimension[];
}

namespace SelectableDimensions {
  export function is(model: any): model is SelectableDimensions {
    return "selectableDimensions" in model;
  }
}

export default SelectableDimensions;
