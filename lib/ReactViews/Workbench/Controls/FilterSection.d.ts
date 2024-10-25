import React from "react";
import { BaseModel } from "../../../Models/Definition/Model";

interface PropsType {
  item: BaseModel;
}

declare class FilterSection extends React.Component<PropsType> {}
export default FilterSection;
