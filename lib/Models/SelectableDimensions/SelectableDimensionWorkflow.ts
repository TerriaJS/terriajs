import { SelectableDimensionWorkflowGroup } from "./SelectableDimensions";
import { BaseModel } from "../Definition/Model";
import { IconProps } from "../../Styled/Icon";

export default interface SelectableDimensionWorkflow {
  readonly type: string;
  name: string;
  icon: IconProps["glyph"];
  item: BaseModel;
  onClose?: () => void;
  footer?: { onClick: () => void; buttonText: string };

  /** This allows up to two levels of SelectableDimensionGroup */
  selectableDimensions: SelectableDimensionWorkflowGroup[];
}
