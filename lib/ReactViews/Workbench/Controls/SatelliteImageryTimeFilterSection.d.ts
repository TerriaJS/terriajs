import type { Component } from "react";
import { BaseModel } from "../../../Models/Definition/Model";

interface PropsType {
  item: BaseModel;
}

declare class SatelliteImageryTimeFilterSection extends Component<PropsType> {}
export default SatelliteImageryTimeFilterSection;
