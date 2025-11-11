import styled from "styled-components";
import ViewState from "../../ReactViewModels/ViewState";
import { withViewState } from "../Context";
import { Rnd } from "react-rnd";
import React from "react";

type PropsType = {
  viewState: ViewState;
  show: boolean;
  children?: React.ReactNode;
};

const MIN_PANEL_HEIGHT = 370;
const DEFAULT_PANEL_HEIGHT = 600;

const StyledPanel = styled.div<PropsType>`
  display: flex;
  flex-direction: column;
  background: ${(p) => p.theme.darkTranslucent};
  backdrop-filter: blur(5px);
  font-family: ${(p) => p.theme.fontPop}px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border-radius: 8px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: ${(p) => (p.show ? 1 : 0)};
`;

const SidePanelContainer: React.FC<PropsType> = (props) => {
  if (!props.show) return null;

  const defaultPanelHeight =
    props.viewState.terria.configParameters.workbenchPanelDefaultHeight ??
    DEFAULT_PANEL_HEIGHT;
  const initialHeight = Math.max(defaultPanelHeight, MIN_PANEL_HEIGHT);

  return (
    <Rnd
      default={{
        x: 15,
        y: 5,
        width: 355,
        height: initialHeight
      }}
      minWidth={300}
      minHeight={MIN_PANEL_HEIGHT}
      bounds="parent"
      disableDragging={!props.show}
      dragHandleClassName="drag-handle"
      enableResizing={{
        top: true,
        bottom: true
      }}
      style={{ zIndex: 1 }}
      cancel=".no-drag"
    >
      <StyledPanel {...props}>{props.children}</StyledPanel>
    </Rnd>
  );
};

export default withViewState(SidePanelContainer);
