import { runInAction } from "mobx";
import React, { useEffect } from "react";
import styled from "styled-components";
import ViewState from "../ReactViewModels/ViewState";
import Button from "./Button";
import { IconProps, StyledIcon } from "./Icon";
import { addTerriaScrollbarStyles } from "./mixins";
import Text from "./Text";

type PropsType = {
  viewState: ViewState;
  title: string;
  icon: IconProps["glyph"];
  onClose: () => void;
  closeButtonText: string;
};

const WorkflowPanel: React.FC<PropsType> = props => {
  const viewState = props.viewState;
  useEffect(function hideTerriaSidePanel() {
    runInAction(() => {
      viewState.showTerriaSidePanel = false;
    });
    return () =>
      runInAction(() => {
        viewState.showTerriaSidePanel = true;
      });
  }, []);

  return (
    <Container>
      <TitleBar>
        <Icon glyph={props.icon} />
        <Title>{props.title}</Title>
        <CloseButton onClick={props.onClose}>
          {props.closeButtonText}
        </CloseButton>
      </TitleBar>
      <Content>{props.children}</Content>
    </Container>
  );
};

const Container = styled.div`
  position: absolute;
  top: 0px;
  z-index: 100000;
  font-family: ${p => p.theme.fontPop}px;
  display: flex;
  flex-direction: column;
  width: ${p => p.theme.workflowPanelWidth}px;
  height: 100vh;
  max-width: ${p => p.theme.workflowPanelWidth}px;
  box-sizing: border-box;
`;

const TitleBar = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0.7em;
  border-bottom: 1px solid ${p => p.theme.darkLighter};
`;

const Title = styled(Text).attrs({
  textLight: true,
  bold: true
})`
  flex-grow: 1;
  padding: 0 1em;
`;

const Icon = styled(StyledIcon).attrs({
  styledWidth: "24px",
  styledHeight: "24px",
  light: true
})``;

const Content = styled.div`
  overflow: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  ${addTerriaScrollbarStyles()}
`;

const CloseButton = styled(Button).attrs({
  secondary: true
})`
  border: 0px;
  border-radius: 3px;
  min-height: 0;
  padding: 3px 12px;
`;

export default WorkflowPanel;
