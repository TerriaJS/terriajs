import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ViewState from "../../ReactViewModels/ViewState";
import Box from "../../Styled/Box";
import { PrefaceBox } from "../Generic/PrefaceBox";
import styled from "styled-components";

const SLIDE_DURATION = 300;

interface IProps {
  isVisible?: boolean;
  onClose: () => void;
  viewState: ViewState;
  onStartAnimatingIn?: () => void;
  onDoneAnimatingIn?: () => void;
  children: React.ReactNode;
  isTopElement?: boolean;
}

const ModalPopup: React.FC<IProps> = (props) => {
  const [inTransition, setInTransition] = useState(false);
  const animationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* function slideIn() {
    props.onStartAnimatingIn?.();
    setInTransition(true);
    animationTimeout.current = setTimeout(() => {
      setInTransition(false);
      setTimeout(() => {
        props.onDoneAnimatingIn?.();
      }, SLIDE_DURATION);
    });
  }

  function slideOut() {
    setInTransition(true);
    animationTimeout.current = setTimeout(() => {
      setInTransition(false);
    }, SLIDE_DURATION);
  }

  useEffect(() => {
    // Clear previous timeout
    if (animationTimeout.current !== null) {
      clearTimeout(animationTimeout.current);
      animationTimeout.current = null;
    }
    if (props.isVisible) {
      slideIn();
    } else {
      slideOut();
    }
  }, [props.isVisible]); */

  useEffect(() => {
    const escKeyListener = (e: KeyboardEvent) => {
      // Only explicitly check share modal state, move to levels/"layers of modals" logic if we need to go any deeper
      if (e.key === "Escape" && !props.viewState.shareModalIsVisible) {
        props.onClose();
      }
    };
    window.addEventListener("keydown", escKeyListener, true);
  });

  // Render explorer panel when explorer panel should be visible
  //  or when sliding out (animation)
  const renderUi = props.isVisible || inTransition;

  return renderUi ? (
    <>
      <ModalPopupBox
        className={props.isTopElement ? "top-element" : ""}
        id="explorer-panel-wrapper"
        aria-hidden={!props.isVisible}
      >
        <PrefaceBox
          className={props.isTopElement ? "top-element" : ""}
          onClick={props.onClose}
          role="presentation"
          aria-hidden="true"
          pseudoBg
          css={{ top: 0, left: 0, zIndex: 99989 }}
        ></PrefaceBox>
        {props.children}
      </ModalPopupBox>
    </>
  ) : null;
};

const ModalPopupBox = styled(Box).attrs({
  position: "absolute",
  fullWidth: true,
  paddedHorizontally: 6,
  centered: true
})`
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
`;

export default ModalPopup;
