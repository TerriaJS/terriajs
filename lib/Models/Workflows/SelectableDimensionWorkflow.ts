import { PanelMenuProps } from "../../ReactViews/Workflow/PanelMenu";
import { IconProps } from "../../Styled/Icon";
import { BaseModel } from "../Definition/Model";
import {
  SelectableDimensionGroup,
  SelectableDimension
} from "../SelectableDimensions/SelectableDimensions";
import ViewState from "../../ReactViewModels/ViewState";
import Terria from "../Terria";
import { runInAction } from "mobx";

/**
 * Model for SelectableDimensionWorkflow. Basically just includes a bunch of selectableDimensions, name, icon and a catalog member.
 * This can be used to create "workflows" that display SelectableDimensions in a side panel above the Workbench
 *
 * See `lib/ReactViews/Workflow/Workflows/SelectableDimension/SelectableDimensionWorkflow.tsx` for more info and usage
 */
export default interface SelectableDimensionWorkflow {
  /** Human readable name - used as title */
  name: string;
  icon: IconProps["glyph"];

  /** Item to which this workflow belongs **/
  item: BaseModel;

  onClose?: () => void;
  /** Footer button */
  footer?: { onClick: () => void; buttonText: string };
  menu?: PanelMenuProps;
  /** This allows up to two levels of SelectableDimensionGroup */
  selectableDimensions: SelectableDimensionWorkflowGroup[];
}

/**
 * Runs a selectable dimension workflow which is a workflow for a workbench item.
 *
 * @param viewStateOrTerria - The {@link ViewState} or {@link Terria} instance
 * @param workflow - A {@link SelectableDimensionWorkflow} instance
 */
export function runWorkflow(
  viewStateOrTerria: ViewState | Terria,
  workflow: SelectableDimensionWorkflow
) {
  runInAction(() => {
    const terria =
      viewStateOrTerria instanceof Terria
        ? viewStateOrTerria
        : viewStateOrTerria.terria;
    terria.selectableDimensionWorkflow = workflow;
  });
}

/** This is essentially the same as `SelectableDimensionGroup`, but allows two levels of nested `SelectableDimensionGroup`, instead of one */
export interface SelectableDimensionWorkflowGroup
  extends Omit<SelectableDimensionGroup, "selectableDimensions" | "placement"> {
  /** Group is **open** by default */
  isOpen?: boolean;

  // Here we allow two levels of nested groups
  readonly selectableDimensions: SelectableDimension[];
}
