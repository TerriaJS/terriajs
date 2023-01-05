import { ReactNode } from "react";
import isDefined from "../../Core/isDefined";
import { IconGlyph } from "../../Styled/Icon";

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
  /** If true, then the user can set the value to arbitrary text */
  readonly allowCustomInput?: boolean;
  readonly undefinedLabel?: string;
}

/** Similar to EnumDimension, but supports multiple selected values */
export interface MultiEnumDimension<T = string> extends Dimension {
  readonly options?: readonly EnumDimensionOption<T>[];
  readonly selectedIds?: T[];
  readonly allowUndefined?: boolean;
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
  readonly allowUndefined?: boolean;
}

export interface ButtonDimension extends Dimension {
  readonly value?: string;
  readonly icon?: IconGlyph;
}

export type SelectableDimensionType =
  | undefined
  | "select"
  | "select-multi"
  | "numeric"
  | "text"
  | "checkbox"
  | "checkbox-group"
  | "group"
  | "button"
  | "color";

export type Placement = "default" | "belowLegend";
export const DEFAULT_PLACEMENT: Placement = "default";

/** Base SelectableDimension interface. Each following SelectableDimension will extend this and the Dimension interface above */
export interface SelectableDimensionBase<T = string> {
  setDimensionValue(stratumId: string, value: T | undefined): void;
  disable?: boolean;
  /** Placement of dimension in Workbench:
   * - default (above legend and short-report sections)
   * - belowLegend
   * This is only relevant to top level SelectableDimensions (not nested in groups)
   */
  placement?: Placement;
  type?: SelectableDimensionType;
}

export type OptionRenderer = (option: {
  value: string | undefined;
}) => ReactNode;

export interface SelectableDimensionEnum
  extends SelectableDimensionBase<string>,
    EnumDimension {
  type?: undefined | "select";
  /** Render ReactNodes for each option - instead of plain label */
  optionRenderer?: OptionRenderer;
}

/** Similar to SelectableDimensionEnum, but supports multiple selected values */
export interface SelectableDimensionMultiEnum
  extends SelectableDimensionBase<string[]>,
    MultiEnumDimension {
  type?: undefined | "select-multi";
  /** Render ReactNodes for each option - instead of plain label */
  optionRenderer?: OptionRenderer;
}

export interface SelectableDimensionCheckbox
  extends SelectableDimensionBase<"true" | "false">,
    EnumDimension<"true" | "false"> {
  type: "checkbox";
}

export interface SelectableDimensionCheckboxGroup
  extends SelectableDimensionBase<"true" | "false">,
    Omit<SelectableDimensionGroup, "type">,
    EnumDimension<"true" | "false"> {
  type: "checkbox-group";

  // We don't allow nested groups for now to keep the UI simple
  readonly selectableDimensions: Exclude<
    SelectableDimension,
    SelectableDimensionGroup | SelectableDimensionCheckboxGroup
  >[];
}

export interface SelectableDimensionButton
  extends SelectableDimensionBase<true>,
    ButtonDimension {
  type: "button";
}

export interface SelectableDimensionNumeric
  extends SelectableDimensionBase<number>,
    NumericalDimension {
  type: "numeric";
}

export interface SelectableDimensionText
  extends SelectableDimensionBase<string>,
    TextDimension {
  type: "text";
}

export interface SelectableDimensionColor
  extends SelectableDimensionBase<string>,
    ColorDimension {
  type: "color";
}

export interface SelectableDimensionGroup
  extends Omit<SelectableDimensionBase, "setDimensionValue">,
    Dimension {
  type: "group";

  /** Group is **closed** by default */
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

export type FlatSelectableDimension = Exclude<
  SelectableDimension,
  SelectableDimensionGroup
>;

export type SelectableDimension =
  | SelectableDimensionEnum
  | SelectableDimensionMultiEnum
  | SelectableDimensionCheckbox
  | SelectableDimensionCheckboxGroup
  | SelectableDimensionGroup
  | SelectableDimensionNumeric
  | SelectableDimensionText
  | SelectableDimensionButton
  | SelectableDimensionColor;

export const isEnum = (
  dim: SelectableDimension
): dim is SelectableDimensionEnum =>
  dim.type === "select" || dim.type === undefined;

export const isMultiEnum = (
  dim: SelectableDimension
): dim is SelectableDimensionMultiEnum => dim.type === "select-multi";

/** Return only SelectableDimensionSelect from array of SelectableDimension */
export const filterEnums = (
  dims: SelectableDimension[]
): SelectableDimensionEnum[] => dims.filter(isEnum);

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

export const isCheckbox = (
  dim: SelectableDimension
): dim is SelectableDimensionCheckbox => dim.type === "checkbox";

export const isCheckboxGroup = (
  dim: SelectableDimension
): dim is SelectableDimensionCheckboxGroup => dim.type === "checkbox-group";

export const isColor = (
  dim: SelectableDimension
): dim is SelectableDimensionColor => dim.type === "color";

const isCorrectPlacement =
  (placement?: Placement) => (dim: SelectableDimension) =>
    dim.placement
      ? dim.placement === placement
      : placement === DEFAULT_PLACEMENT;

const isEnabled = (dim: SelectableDimension) => !dim.disable;

/** Filter out dimensions with only 1 option (unless they have 1 option and allow undefined - which is 2 total options) */
const enumHasValidOptions = (dim: EnumDimension) => {
  const minLength = dim.allowUndefined ? 1 : 2;
  return isDefined(dim.options) && dim.options.length >= minLength;
};

/** Multi enums just need one option (they don't have `allowUndefined`) */
const multiEnumHasValidOptions = (dim: MultiEnumDimension) => {
  return isDefined(dim.options) && dim.options.length > 0;
};

/** Filter with SelectableDimension should be shown for a given placement.
 * This will take into account whether SelectableDimension is valid, not disabled, etc...
 */
export const filterSelectableDimensions =
  (placement?: Placement) =>
  (selectableDimensions: SelectableDimension[] = []) =>
    selectableDimensions.filter(
      (dim) =>
        // Filter by placement if defined, otherwise use default placement
        (!isDefined(placement) || isCorrectPlacement(placement)(dim)) &&
        isEnabled(dim) &&
        // Check enum (select and checkbox) dimensions for valid options
        ((!isEnum(dim) && !isCheckbox(dim)) || enumHasValidOptions(dim)) &&
        // Check multi-enum
        (!isMultiEnum(dim) || multiEnumHasValidOptions(dim)) &&
        // Only show groups if they have at least one SelectableDimension
        (!isGroup(dim) || dim.selectableDimensions.length > 0)
    );

/** Find human readable name for the current value for a SelectableDimension */
export const findSelectedValueName = (
  dim: Exclude<SelectableDimension, SelectableDimensionGroup>
): string | undefined => {
  if (isCheckbox(dim)) {
    return dim.selectedId === "true" ? "Enabled" : "Disabled";
  }

  if (isEnum(dim)) {
    return dim.options?.find((opt) => opt.id === dim.selectedId)?.name;
  }

  if (isMultiEnum(dim)) {
    // return names as CSV
    return dim.options
      ?.filter((opt) => dim.selectedIds?.some((id) => opt.id === id))
      ?.map((option) => option.name)
      ?.join(", ");
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
