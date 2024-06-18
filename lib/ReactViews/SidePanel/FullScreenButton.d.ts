import React from "react";
import IElementConfig from "../../Models/IElementConfig";

interface PropsType {
  btnText: string;
  minified: boolean;
  animationDuration?: number;
  elementConfig?: IElementConfig;
}

declare class FullScreenButton extends React.Component<PropsType> {}

export default FullScreenButton;
