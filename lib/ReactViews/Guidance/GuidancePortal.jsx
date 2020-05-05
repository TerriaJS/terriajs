/**
 * GuidancePortal.jsx
 * Framework for tour
 *
 * Not a real "portal" in the sense of a react portal, even though it
 * started out as wanting to be that. Our not-yet-invented "new modal system"
 * will probably utilise a react portal, though.
 *
 */
import React, { useEffect } from "react";
// import styled from "styled-components";
import styled, { withTheme } from "styled-components";
// import styled, { css } from "styled-components";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { autorun } from "mobx";
import { observer } from "mobx-react";
// import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";

import Caret from "../Generic/Caret";
import isDefined from "../../Core/isDefined";
import Box from "../../Styled/Box";
import Spacing from "../../Styled/Spacing";
import Button, { RawButton } from "../../Styled/Button";
import Text from "../../Styled/Text";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";

import {
  TOUR_WIDTH,
  calculateLeftPosition,
  calculateTopPosition
} from "./guidance-helpers.ts";
// import GuidanceDot from "./GuidanceDot.jsx";
import GuidanceOverlay from "./GuidanceOverlay.jsx";
// import { buildShareLink } from "../Map/Panels/SharePanel/BuildShareLink";

const ProgressDot = styled.div`
  display: inline-block;
  box-sizing: border-box;
  height: 7px;
  width: 7px;
  border: 1px solid ${p => p.theme.colorPrimary};

  background-color: ${p =>
    p.count < p.countStep ? p.theme.colorPrimary : "transparent"};

  margin-left: 8px;
  border-radius: 50%;
`;

/**
 * Indicator bar/"dots" on progress of tour.
 * Fill in indicator dot depending on progress determined from count & max count
 */
const GuidanceProgress = props => {
  const countArray = Array.from(Array(props.max).keys()).map(e => e++);
  const countStep = props.step;
  return (
    <Box centered>
      {countArray.map(count => {
        return <ProgressDot key={count} count={count} countStep={countStep} />;
      })}
    </Box>
  );
};
GuidanceProgress.propTypes = {
  max: PropTypes.number.isRequired,
  step: PropTypes.number.isRequired
};

const TourExplanationBox = styled(Box)`
  position: absolute;
  width: ${TOUR_WIDTH}px;
  // background-color: $modal-bg;
  z-index: 10000;
  background: white;
  color: $text-darker;

  min-height: 136px;
  border-radius: 4px;

  box-shadow: 0 6px 6px 0 rgba(0, 0, 0, 0.12), 0 10px 20px 0 rgba(0, 0, 0, 0.05);

  // extend parseCustomMarkdownToReact() to inject our <Text /> with relevant props to cut down on # of styles?
  // Force styling from markdown?
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 0;
    padding: 0;
  }
  h1,
  h2,
  h3 {
    margin-bottom: ${p => p.theme.spacing * 3}px;
    font-size: 16px;
    font-weight: bold;
  }
  h4,
  h5,
  h6 {
    font-size: 15px;
  }

  p {
    margin: 0;
    margin-bottom: ${p => p.theme.spacing}px;
  }
  p:last-child {
    margin-bottom: 0;
  }
`;

// const TourSpot = styled.div`
//   width: 14px;
//   height: 14px;
// `;

const TourExplanation = ({
  topStyle,
  leftStyle,
  caretOffsetTop,
  caretOffsetLeft,
  onNext,
  onSkip,
  currentStep,
  maxSteps,
  children
}) => {
  const { t } = useTranslation();
  return (
    <TourExplanationBox
      paddedRatio={3}
      column
      style={{
        top: topStyle,
        left: leftStyle
      }}
    >
      <Caret
        style={{
          top: `${caretOffsetTop}px`,
          left: `${caretOffsetLeft}px`
        }}
      />
      <Text light medium textDarker>
        <Text light medium noFontSize textDarker>
          {children}
        </Text>
        <Spacing bottom={3} />
        <Box centered justifySpaceBetween>
          {/* <GuidanceProgress step={2} max={4} /> */}
          <GuidanceProgress step={currentStep} max={maxSteps} />
          <Box centered>
            <RawButton onClick={() => onSkip?.()}>{t("tour.end")}</RawButton>
            <Spacing right={2} />
            <Button onClick={() => onNext?.()} primary>
              {t("general.next")}
            </Button>
          </Box>
        </Box>
      </Text>
    </TourExplanationBox>
  );
};
TourExplanation.propTypes = {
  children: PropTypes.node.isRequired,
  currentStep: PropTypes.number.isRequired,
  maxSteps: PropTypes.number.isRequired,
  caretOffsetTop: PropTypes.number,
  caretOffsetLeft: PropTypes.number,
  onNext: PropTypes.func,
  onSkip: PropTypes.func,
  topStyle: PropTypes.string,
  leftStyle: PropTypes.string
};
export const TourGrouping = observer(({ viewState }) => {
  // const [showGuidance, setShowGuidance] = useState(false);
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
  if (!currentRectangle) {
    if (showPortal) {
      console.log(
        "Tried to show guidance portal with no rectangle available from ref"
      );
    }
    return null;
  }

  // To match old HelpScreenWindow / HelpOverlay API
  const currentScreen = {
    // rectangle: currentScreenComponent?.current?.getBoundingClientRect?.()
    rectangle: currentRectangle,
    positionTop:
      currentTourPoint?.positionTop || viewState.relativePosition.RECT_BOTTOM,
    positionLeft:
      currentTourPoint?.positionLeft || viewState.relativePosition.RECT_LEFT,
    offsetTop: isDefined(currentTourPoint?.offsetTop)
      ? currentTourPoint.offsetTop
      : 15,
    offsetLeft: isDefined(currentTourPoint?.offsetLeft)
      ? currentTourPoint.offsetLeft
      : 0
  };

  const positionLeft = calculateLeftPosition(currentScreen);
  const positionTop = calculateTopPosition(currentScreen);

  // TODO(wing): caret could easily be smarter than manually positioning it,
  // take the rectangle from the highlighted component and set the base offset
  // around that. manually position it for now
  const caretOffsetTop = isDefined(currentTourPoint?.caretOffsetTop)
    ? currentTourPoint.caretOffsetTop
    : -3;
  const caretOffsetLeft = isDefined(currentTourPoint?.caretOffsetLeft)
    ? currentTourPoint.caretOffsetLeft
    : 20;

  const currentTourIndex = viewState.currentTourIndex;
  const maxSteps = viewState.tourPoints.length;

  if (!showPortal || !currentTourPoint) return null;
  return (
    <>
      <TourExplanation
        currentStep={currentTourIndex + 1}
        maxSteps={maxSteps}
        onNext={() => viewState.nextTourPoint()}
        onSkip={() => viewState.setTourIndex(-1)}
        topStyle={`${positionTop}px`}
        leftStyle={`${positionLeft}px`}
        caretOffsetTop={caretOffsetTop}
        caretOffsetLeft={caretOffsetLeft}
      >
        {parseCustomMarkdownToReact(currentTourPoint?.content)}
      </TourExplanation>
    </>
  );
});

export const GuidancePortalDisplayName = "GuidancePortal";
// TODO: process tourpoints and take out nonexistent refs?
export const GuidancePortal = observer(({ viewState }) => {
  const currentTourPoint = viewState.currentTourPoint;
  const currentTourPointRef = viewState.appRefs.get(
    currentTourPoint?.appRefName
  );
  const currentRectangle = currentTourPointRef?.current?.getBoundingClientRect?.();

  return (
    <>
      {currentRectangle && (
        <GuidanceOverlay
          rectangle={currentRectangle}
          // onCancel={() => viewState.setTourIndex(-1)}
          onCancel={() => viewState.nextTourPoint()}
        />
      )}
      <TourGrouping viewState={viewState} />
    </>
  );
});

GuidancePortal.propTypes = {
  children: PropTypes.node.isRequired,
  viewState: PropTypes.object.isRequired
};

export default withTheme(GuidancePortal);

// const GuidancePortalOverlay = styled(Box)`
//   position: fixed;
//   width: 100%;
//   height: 100%;
//   background: black;
//   z-index: 1000;
//   opacity: 0.45;

//   display: none;
// `;
// <GuidancePortalOverlay
// // className={
// //   viewState.topElement === GuidancePortalDisplayName && "top-element"
// // }
// >
//   <GuidanceDot onClick={() => setShowGuidance(!showGuidance)} />
//   {showGuidance && <TourBox>{children}</TourBox>}

//   <Button onClick={() => viewState.setTourIndex(-1)}>Exit tour</Button>
// </GuidancePortalOverlay>
