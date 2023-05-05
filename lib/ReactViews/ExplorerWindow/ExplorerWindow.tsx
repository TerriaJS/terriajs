import { action } from "mobx";
import { observer } from "mobx-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useViewState } from "../StandardUserInterface/ViewStateContext";
import ModalPopup from "./ModalPopup";
import Box from "../../Styled/Box";
import { Tabs } from "./Tabs";
import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

export const ExplorerWindowElementName = "AddData";

const SLIDE_DURATION = 300;

export default observer<React.FC>(function ExplorerWindow() {
  const viewState = useViewState();

  const isVisible =
    !viewState.useSmallScreenInterface &&
    !viewState.hideMapUi &&
    viewState.explorerPanelIsVisible;

  const [visible, setVisible] = useState(
    isVisible || viewState.explorerPanelAnimating
  );
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const onStartAnimating = action(() => {
    viewState.explorerPanelAnimating = true;
  });

  const onDoneAnimating = action(() => {
    viewState.explorerPanelAnimating = false;
  });

  const slideIn = () => {
    setVisible(true);
    onStartAnimating?.();
    animationTimeoutRef.current = setTimeout(() => {
      onDoneAnimating?.();
    }, SLIDE_DURATION);
  };

  const slideOut = () => {
    setVisible(false);
    animationTimeoutRef.current = setTimeout(() => {
      viewState.closeCatalog();
      viewState.switchMobileView("nowViewing");
    }, SLIDE_DURATION);
  };

  useEffect(() => {
    // Clear previous timeout
    if (animationTimeoutRef.current !== null) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    if (isVisible) {
      slideIn();
    } else {
      slideOut();
    }
  }, [isVisible]);

  useEffect(() => {
    const escKeyListener = (e: KeyboardEvent) => {
      // Only explicitly check share modal state, move to levels/"layers of modals" logic if we need to go any deeper
      if (e.key === "Escape" && !viewState.shareModalIsVisible) {
        slideOut();
      }
    };
    window.addEventListener("keydown", escKeyListener, true);
  });

  return (
    <ModalPopup isVisible={isVisible} isTopElement={true} onClose={slideOut}>
      <StyledContainer
        id="explorer-panel"
        aria-labelledby="modalTitle"
        aria-describedby="modalDescription"
        role="dialog"
        styledMaxWidth="1200px"
        flex="1"
        delay={SLIDE_DURATION}
        visible={visible}
      >
        <Tabs viewState={viewState} onClose={slideOut} />
      </StyledContainer>
    </ModalPopup>
  );
});

const StyledContainer = styled(Box)<{ visible: boolean; delay: number }>`
  z-index: 99999;
  opacity: ${(props) => (props.visible ? 1 : 0)};
  visibility: ${(props) => (props.visible ? "visible" : "hidden")};
  animation: ${(props) => (props.visible ? fadeIn : fadeOut)}
    ${(props) => props.delay}ms linear;
  transition: visibility ${(props) => `${props.delay}ms`} linear,
    opacity ${(props) => props.delay}ms linear;
`;
