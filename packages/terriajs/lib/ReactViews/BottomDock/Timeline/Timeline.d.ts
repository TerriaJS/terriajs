import type { Component } from "react";
import IElementConfig from "../../../Models/IElementConfig";
import Terria from "../../../Models/Terria";

interface PropsType {
  terria: Terria;
  locale?: unknown;
  elementConfig?: IElementConfig;
}

declare class Timeline extends Component<PropsType> {}

export default Timeline;
