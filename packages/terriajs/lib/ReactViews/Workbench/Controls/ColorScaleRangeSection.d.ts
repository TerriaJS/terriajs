import type { Component } from "react";
import { BaseModel } from "../../../Models/Definition/Model";

interface PropsType {
  item: BaseModel;
  minValue: number;
  maxValue: number;
}

declare class ColorScaleRangeSection extends Component<PropsType> {}
export default ColorScaleRangeSection;
