import { runInAction } from "mobx";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import ViewState from "../ReactViewModels/ViewState";
import Button from "./Button";
import { GLYPHS, IconProps, StyledIcon } from "./Icon";
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
  width: ${p => p.theme.workbenchWidth}px;
  max-width: ${p => p.theme.workbenchWidth}px;
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

const Content = styled.div``;

const CloseButton = styled(Button).attrs({
  secondary: true
})`
  border: 0px;
  border-radius: 3px;
  min-height: 0;
  padding: 3px 12px;
`;

export type BoxProps = {
  title?: string;
  icon?: IconProps["glyph"];
  collapsible?: boolean;
  isCollapsed?: boolean;
  children?: React.ReactNode;
  className?: string;
};

export const Box: React.FC<BoxProps> = props => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(
    props.isCollapsed ?? false
  );
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  return (
    <BoxWrap className={props.className}>
      {props.title !== undefined && props.icon !== undefined && (
        <BoxTitleBar>
          <BoxIcon glyph={props.icon} styledWidth="16px" styledHeight="16px" />
          <BoxTitle>{props.title}</BoxTitle>
          {props.collapsible && (
            <CollapseToggle
              onClick={toggleCollapse}
              isCollapsed={isCollapsed}
            />
          )}
        </BoxTitleBar>
      )}
      {!isCollapsed && <BoxContent>{props.children}</BoxContent>}
    </BoxWrap>
  );
};

const CollapseToggle = styled(Button).attrs(props => ({
  renderIcon: () => (
    <StyledIcon
      light
      glyph={props.isCollapsed ? GLYPHS.closed : GLYPHS.opened}
      styledWidth="10px"
      styledHeight="10px"
    />
  )
}))<{ isCollapsed: boolean }>`
  min-height: 0px;
  padding: 0.7em;
  background: transparent;
  border: 0px;
`;

const BoxWrap = styled.div`
  background-color: ${p => p.theme.darkWithOverlay};
  margin: 10px;
  border-radius: 5px;
`;

const BoxTitleBar = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${p => p.theme.darkLighter};
  padding-left: 0.4em;
`;

const BoxTitle = styled(Text).attrs({
  textLight: true,
  bold: true
})`
  flex-grow: 1;
  padding: 0.7em 0.4em;
`;

const BoxIcon = styled(StyledIcon).attrs({
  styledWidth: "18px",
  styledHeight: "18px",
  light: true
})``;

const BoxContent = styled.div`
  padding: 0.4em;
  color: ${p => p.theme.textLight};
`;

export default WorkflowPanel;
