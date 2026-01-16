import type { Component } from "react";
import { BaseModel } from "../../Models/Definition/Model";

interface PropsType {
  item: BaseModel;
  printView?: boolean;
}

declare class Description extends Component<PropsType> {}

export default Description;
