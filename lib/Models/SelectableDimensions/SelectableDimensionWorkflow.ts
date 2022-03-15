import { PanelMenuProps } from "../../ReactViews/Workflow/PanelMenu";
import { IconProps } from "../../Styled/Icon";
import { BaseModel } from "../Definition/Model";
import {
  SelectableDimensionGroup,
  SelectableDimension
} from "./SelectableDimensions";

/**
 * Model for SelectableDimensionWorkflow. Basically just includes a bunch of selectableDimensions, name, icon and a catalog member.
 * This can be used to create "workflows" that display SelectableDimensions in a side panel above the Workbench
 *
 * See `lib/ReactViews/Workflow/Workflows/SelectableDimension/SelectableDimensionWorkflow.tsx` for more info and usage
 */
export default interface SelectableDimensionWorkflow {
  readonly type: string;
  /** Human readable name - used as title */
  name: string;
  icon: IconProps["glyph"];
  item: BaseModel;
  onClose?: () => void;
  /** Footer button */
  footer?: { onClick: () => void; buttonText: string };
  menu?: PanelMenuProps;
  /** This allows up to two levels of SelectableDimensionGroup */
  selectableDimensions: SelectableDimensionWorkflowGroup[];
}

/** This is essentially the same as `SelectableDimensionGroup`, but allows two levels of nested `SelectableDimensionGroup`, instead of one */
export interface SelectableDimensionWorkflowGroup
  extends Omit<SelectableDimensionGroup, "selectableDimensions"> {
  /** Group is **open** by default */
  isOpen?: boolean;

  // Here we allow two levels of nested groups
  readonly selectableDimensions: SelectableDimension[];
}
