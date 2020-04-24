/**
 * GuidancePortal.jsx
 * Framework for tour
 *
 * Not a real "portal" in the sense of a react portal, even though it
 * started out as wanting to be that. Our not-yet-invented "new modal system"
 * will probably utilise a react portal, though.
 *
 */
import React, { useState, useEffect } from "react";
// import styled from "styled-components";
import styled, { withTheme } from "styled-components";
// import styled, { css } from "styled-components";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { autorun } from "mobx";
import { observer } from "mobx-react";

import Box from "../../Styled/Box";
import Button, { RawButton } from "../../Styled/Button";
import Text from "../../Styled/Text";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";

import GuidanceDot from "./GuidanceDot.jsx";
import GuidanceOverlay from "./GuidanceOverlay.jsx";
// import { buildShareLink } from "../Map/Panels/SharePanel/BuildShareLink";

const GuidanceProgress = props => {
  const countArray = Array.from(Array(props.max).keys()).map(e => e++);
  const countStep = props.step;
  return (
    <div
      css={`
        float: right;
        margin-right: -8px;
      `}
    >
      {countArray.map(count => {
        return (
          <div
            key={count}
            css={`
              display: inline-block;
              box-sizing: border-box;
              // height: 1px;
              height: 2px;
              width: 8px;
              // border: 2px solid #519ac2;
              background-color: ${p => p.theme.colorPrimary};
              opacity: ${count < countStep ? 0.35 : 1};
              // margin-left: 8px;

              margin-left: 6px;
              border-radius: 4px;
            `}
            // className={classNames(Styles.indicator, {
            //   [Styles.indicatorEnabled]: count < countStep
            // })}
          />
        );
      })}
    </div>
  );
};
GuidanceProgress.propTypes = {
  max: PropTypes.number.isRequired,
  step: PropTypes.number.isRequired,
  children: PropTypes.node.isRequired
};

const GuidanceContextBox = styled(Box)`
  position: absolute;
  box-sizing: border-box;
  width: 256px;
  // background-color: $modal-bg;
  z-index: 10000;
  background: white;

  padding: 16px;
  color: $text-darker;

  min-height: 136px;
  border-radius: 4px;

  box-shadow: 0 6px 6px 0 rgba(0, 0, 0, 0.12), 0 10px 20px 0 rgba(0, 0, 0, 0.05);
`;

const GuidanceContextModal = ({
  topStyle,
  leftStyle,
  onNext,
  onSkip,
  children
}) => {
  const { t } = useTranslation();
  return (
    <GuidanceContextBox
      style={{
        top: topStyle,
        left: leftStyle
      }}
    >
      <Text tallerHeight>{children}</Text>
      <Button onClick={() => onNext?.()} primary>
        {t("general.next")}
      </Button>
      <RawButton onClick={() => onSkip?.()}>{t("general.skip")}</RawButton>
      {/* ? */}
      <GuidanceProgress step={2} max={4} />
    </GuidanceContextBox>
  );
};

GuidanceContextModal.propTypes = {
  children: PropTypes.node.isRequired,
  onNext: PropTypes.func,
  onSkip: PropTypes.func,
  topStyle: PropTypes.string,
  leftStyle: PropTypes.string
};
const GuidancePortalOverlay = styled(Box)`
  position: fixed;
  width: 100%;
  height: 100%;
  background: black;
  z-index: 1000;
  opacity: 0.45;

  display: none;
`;

const GuidancePortalDisplayName = "GuidancePortal";
export const GuidancePortal = observer(({ children, viewState }) => {
  const [showGuidance, setShowGuidance] = useState(false);
  const showPortal = viewState.currentTourIndex !== -1;

  useEffect(() =>
    autorun(() => {
      if (showPortal && viewState.topElement !== GuidancePortalDisplayName) {
        viewState.setTopElement(GuidancePortalDisplayName);
      }
    })
  );

  const currentTourPoint = viewState.currentTourPoint;
  const currentTourPointRef = viewState.appRefs.get(
    currentTourPoint?.appRefName
  );

  const currentRectangle = currentTourPointRef?.current?.getBoundingClientRect?.();

  const currentScreen = {
    // rectangle: currentScreenComponent?.current?.getBoundingClientRect?.()
    rectangle: currentRectangle
  };

  if (!showPortal) return null;
  return (
    <>
      <GuidanceOverlay
        screen={currentScreen}
        // onCancel={() => viewState.setTourIndex(-1)}
        onCancel={() => viewState.nextTourPoint()}
      />
      <GuidanceContextModal
        onNext={() => viewState.nextTourPoint()}
        // onClose={() => viewState.nextTourPoint()}
        onSkip={() => viewState.setTourIndex(-1)}
        topStyle={`${currentRectangle?.bottom}px`}
        leftStyle={`${currentRectangle?.left}px`}
      >
        {parseCustomMarkdownToReact(currentTourPoint?.content)}
      </GuidanceContextModal>
      <GuidancePortalOverlay
      // className={
      //   viewState.topElement === GuidancePortalDisplayName && "top-element"
      // }
      >
        <GuidanceDot onClick={() => setShowGuidance(!showGuidance)} />
        {showGuidance && (
          <GuidanceContextModal>{children}</GuidanceContextModal>
        )}

        <Button onClick={() => viewState.setTourIndex(-1)}>Exit tour</Button>
      </GuidancePortalOverlay>
    </>
  );
});

GuidancePortal.propTypes = {
  children: PropTypes.node.isRequired,
  viewState: PropTypes.object.isRequired
};

export default withTheme(GuidancePortal);
