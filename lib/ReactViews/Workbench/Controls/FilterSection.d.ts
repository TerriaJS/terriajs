import type { Component } from "react";
import { BaseModel } from "../../../Models/Definition/Model";

interface PropsType {
  item: BaseModel;
}

declare class FilterSection extends Component<PropsType> {}
export default FilterSection;
