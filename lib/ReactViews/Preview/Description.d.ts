import React from "react";
import { BaseModel } from "terriajs-plugin-api";

interface PropsType {
  item: BaseModel;
  printView?: boolean;
}

declare class Description extends React.Component<PropsType> {}

export default Description;
