import React from "react";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";

interface PropsType {
  terria: Terria;
  viewState: ViewState;
  tabs?: unknown[];
}

declare class Tabs extends React.Component<PropsType> {}

export default Tabs;
