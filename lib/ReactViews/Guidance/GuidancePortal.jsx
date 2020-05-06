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
import { withTheme } from "styled-components";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { autorun } from "mobx";
import { observer } from "mobx-react";

import Caret from "../Generic/Caret";
import Box from "../../Styled/Box";
import Spacing from "../../Styled/Spacing";
import Button, { RawButton } from "../../Styled/Button";
import Text from "../../Styled/Text";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";

import {
  getOffsetsFromTourPoint,
  calculateLeftPosition,
  calculateTopPosition
} from "./guidance-helpers.ts";
import GuidanceOverlay from "./GuidanceOverlay.jsx";
import ProgressDot from "./ProgressDot.jsx";
import TourIndicator from "./TourIndicator.jsx";
import TourExplanationBox, {
  TourExplanationBoxZIndex
} from "./TourExplanationBox.jsx";

/**
 * Indicator bar/"dots" on progress of tour.
 * Fill in indicator dot depending on progress determined from count & max count
 */
const GuidanceProgress = ({ max, step, setTourIndex }) => {
  const countArray = Array.from(Array(max).keys()).map(e => e++);
  const countStep = step;
  return (
    <Box centered>
      {countArray.map(count => {
        return (
          <ProgressDot
            onClick={() => setTourIndex(count)}
            key={count}
            active={count < countStep}
          />
        );
      })}
    </Box>
  );
};
GuidanceProgress.propTypes = {
  setTourIndex: PropTypes.func.isRequired,
  max: PropTypes.number.isRequired,
  step: PropTypes.number.isRequired
};

const TourExplanation = ({
  topStyle,
  leftStyle,
  caretOffsetTop,
  caretOffsetLeft,
  indicatorOffsetTop,
  indicatorOffsetLeft,
  setTourIndex,
  onTourIndicatorClick,
  onNext,
  onSkip,
  currentStep,
  maxSteps,
  active,
  isLastTourPoint,
  children
}) => {
  const { t } = useTranslation();
  if (!active) {
    // Tour explanation requires the various positioning even if only just
    // showing the "tour indicator" button, as it is offset against the caret
    // which is offset against the original box
    return (
      <Box
        positionAbsolute
        style={{
          zIndex: TourExplanationBoxZIndex - 1,
          top: topStyle,
          left: leftStyle
        }}
      >
        <Box
          positionAbsolute
          style={{
            top: `${caretOffsetTop}px`,
            left: `${caretOffsetLeft}px`
          }}
        >
          <TourIndicator
            onClick={onTourIndicatorClick}
            style={{
              top: `${indicatorOffsetTop}px`,
              left: `${indicatorOffsetLeft}px`
            }}
          />
        </Box>
      </Box>
    );
  }
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
          <GuidanceProgress
            setTourIndex={setTourIndex}
            step={currentStep}
            max={maxSteps}
          />
          <Box centered>
            {isLastTourPoint ? (
              <Button onClick={() => onSkip?.()} primary>
                {t("tour.finish")}
              </Button>
            ) : (
              <>
                <RawButton onClick={() => onSkip?.()}>
                  {t("tour.end")}
                </RawButton>
                <Spacing right={2} />
                <Button onClick={() => onNext?.()} primary>
                  {t("general.next")}
                </Button>
              </>
            )}
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
  indicatorOffsetTop: PropTypes.number,
  indicatorOffsetLeft: PropTypes.number,
  setTourIndex: PropTypes.func,
  onTourIndicatorClick: PropTypes.func,
  onNext: PropTypes.func,
  onSkip: PropTypes.func,
  topStyle: PropTypes.string,
  leftStyle: PropTypes.string,
  isLastTourPoint: PropTypes.bool,
  active: PropTypes.bool
};

export const TourGrouping = observer(({ viewState }) =>
  viewState.tourPoints.map((tourPoint, index) => {
    const tourPointRef = viewState.appRefs.get(tourPoint?.appRefName);

    const currentRectangle = tourPointRef?.current?.getBoundingClientRect?.();
    const {
      offsetTop,
      offsetLeft,
      caretOffsetTop,
      caretOffsetLeft,
      indicatorOffsetTop,
      indicatorOffsetLeft
    } = getOffsetsFromTourPoint(tourPoint);

    // To match old HelpScreenWindow / HelpOverlay API
    const currentScreen = {
      rectangle: currentRectangle,
      positionTop:
        tourPoint?.positionTop || viewState.relativePosition.RECT_BOTTOM,
      positionLeft:
        tourPoint?.positionLeft || viewState.relativePosition.RECT_LEFT,
      offsetTop: offsetTop,
      offsetLeft: offsetLeft
    };

    const positionLeft = calculateLeftPosition(currentScreen);
    const positionTop = calculateTopPosition(currentScreen);

    const currentTourIndex = viewState.currentTourIndex;
    const maxSteps = viewState.tourPoints.length;

    if (!tourPoint) return null;
    return (
      <TourExplanation
        key={tourPoint.appRefName}
        active={currentTourIndex === index}
        currentStep={currentTourIndex + 1}
        maxSteps={maxSteps}
        setTourIndex={idx => viewState.setTourIndex(idx)}
        onTourIndicatorClick={() => viewState.setTourIndex(index)}
        onNext={() => viewState.nextTourPoint()}
        onSkip={() => viewState.setTourIndex(-1)}
        isLastTourPoint={index === viewState.tourPoints.length - 1}
        topStyle={`${positionTop}px`}
        leftStyle={`${positionLeft}px`}
        caretOffsetTop={caretOffsetTop}
        caretOffsetLeft={caretOffsetLeft}
        indicatorOffsetTop={indicatorOffsetTop}
        indicatorOffsetLeft={indicatorOffsetLeft}
      >
        {parseCustomMarkdownToReact(tourPoint?.content)}
      </TourExplanation>
    );
  })
);

export const GuidancePortalDisplayName = "GuidancePortal";
// TODO: process tourpoints and take out nonexistent refs?
export const GuidancePortal = observer(({ viewState }) => {
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
  if (!currentRectangle && showPortal) {
    console.log(
      "Tried to show guidance portal with no rectangle available from ref"
    );
  }

  return (
    <>
      {currentRectangle && (
        <GuidanceOverlay
          rectangle={currentRectangle}
          onCancel={() => viewState.nextTourPoint()}
        />
      )}
      {showPortal && <TourGrouping viewState={viewState} />}
    </>
  );
});

GuidancePortal.propTypes = {
  children: PropTypes.node.isRequired,
  viewState: PropTypes.object.isRequired
};

export default withTheme(GuidancePortal);
