import React from "react";
import IElementConfig from "../../../Models/IElementConfig";
import Terria from "../../../Models/Terria";

interface PropsType {
  terria: Terria;
  locale?: unknown;
  elementConfig?: IElementConfig;
}

declare class Timeline extends React.Component<PropsType> {}

export default Timeline;
