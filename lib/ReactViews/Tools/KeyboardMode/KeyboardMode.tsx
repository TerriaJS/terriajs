import { observer } from "mobx-react";
import React from "react";
import styled from "styled-components";
import Cesium from "../../../Models/Cesium";
import ViewState from "../../../ReactViewModels/ViewState";
import PositionRightOfWorkbench from "../../Workbench/PositionRightOfWorkbench";
import MovementControls from "./MovementControls";

type KeyboardModeProps = {
  viewState: ViewState;
};
export const KEYBOARD_MODE_ID = "keyboard-mode";

const KeyboardMode: React.FC<KeyboardModeProps> = observer((props) => {
  const { viewState } = props;

  const cesium = viewState.terria.currentViewer;

  if (!(cesium instanceof Cesium)) {
    viewState.closeTool();
    return null;
  }

  return (
    <ControlsContainer viewState={viewState}>
      <MovementControls cesium={cesium} />
    </ControlsContainer>
  );
});

const ControlsContainer = styled(PositionRightOfWorkbench)`
  width: 140px;
  top: unset;
  left: 0;
  bottom: 300px;
`;

export default KeyboardMode;
