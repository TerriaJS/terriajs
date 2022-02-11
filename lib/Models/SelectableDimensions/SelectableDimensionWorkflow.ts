import SelectableDimensions from "./SelectableDimensions";
import { BaseModel } from "../Definition/Model";
import { IconProps } from "../../Styled/Icon";

export default interface SelectableDimensionWorkflow
  extends SelectableDimensions {
  name: string;
  icon: IconProps["glyph"];
  item: BaseModel;
  onClose?: () => void;
}
