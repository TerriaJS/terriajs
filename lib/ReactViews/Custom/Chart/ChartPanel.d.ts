import React from "react";
import Terria from "../../../Models/Terria";
import { ViewState } from "terriajs-plugin-api";

interface PropsType {
  viewState: ViewState;
  terria: Terria;
}

declare class ChartPanel extends React.Component<PropsType> {}

export default ChartPanel;
