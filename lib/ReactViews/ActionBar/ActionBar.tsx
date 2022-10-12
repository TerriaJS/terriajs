import React, { useEffect } from "react";
import styled from "styled-components";
import Box from "../../Styled/Box";
import Portal from "../StandardUserInterface/Portal";
import { ActionBarPortalId } from "../StandardUserInterface/Portals/ActionBarPortal";
import { useViewState } from "../StandardUserInterface/ViewStateContext";

const ActionBar: React.FC<{}> = (props) => {
  const viewState = useViewState();

  useEffect(function setVisibility() {
    viewState.setActionBarVisible(true);
    return () => {
      viewState.setActionBarVisible(false);
    };
  });

  return viewState.useSmallScreenInterface ? null : (
    <Portal id={ActionBarPortalId}>
      <ActionBarInner>{props.children}</ActionBarInner>
    </Portal>
  );
};

const ActionBarInner = styled(Box).attrs({
  centered: true,
  fullHeight: true
})`
  margin: auto;
  background-color: ${(props) => props.theme.dark};
  border-radius: 6px;
`;

export default ActionBar;
