import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ViewState from "../../ReactViewModels/ViewState";
import Box from "../../Styled/Box";
import { PrefaceBox } from "../Generic/PrefaceBox";
import styled from "styled-components";

interface IProps {
  isVisible?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isTopElement?: boolean;
}

const ModalPopup: React.FC<IProps> = ({
  isVisible,
  isTopElement,
  onClose,
  children
}) => {
  const renderUi = isVisible;

  return renderUi ? (
    <ModalPopupBox
      className={isTopElement ? "top-element" : ""}
      id="explorer-panel-wrapper"
      aria-hidden={!isVisible}
    >
      <PrefaceBox
        className={isTopElement ? "top-element" : ""}
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
        pseudoBg
        css={{ top: 0, left: 0, zIndex: 99989 }}
      ></PrefaceBox>
      {children}
    </ModalPopupBox>
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
