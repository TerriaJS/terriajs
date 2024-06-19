import React from "react";
import { BaseModel } from "../../../Models/Definition/Model";

interface PropsType {
  item: BaseModel;
  minValue: number;
  maxValue: number;
}

declare class ColorScaleRangeSection extends React.Component<PropsType> {}
export default ColorScaleRangeSection;
