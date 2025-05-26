import type { Component } from "react";
import type IElementConfig from "../../Models/IElementConfig";

interface PropsType {
  btnText: string;
  minified: boolean;
  animationDuration?: number;
  elementConfig?: IElementConfig;
}

declare class FullScreenButton extends Component<PropsType> {}

export default FullScreenButton;
