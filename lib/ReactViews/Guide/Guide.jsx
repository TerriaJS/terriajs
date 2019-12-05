/**
 * A generic Guide component, look at
 * `satellite-guidance.js` && `SatelliteGuide.jsx`
 * for example data / usage
 *
 * consume something like:

  <Guide
    hasIntroSlide
    // Use this as guide won't track viewstate
    isTopElement={viewState.topElement === "Guide"}
    terria={terria}
    guideKey={SATELLITE_GUIDE_KEY}
    guideData={SatelliteGuideData}
    showGuide={viewState.showSatelliteGuidance}
    setShowGuide={bool => {
      viewState.showSatelliteGuidance = bool;
      // If we're closing for any reason, set prompted to true
      if (!bool) {
        viewState.toggleFeaturePrompt("satelliteGuidance", true, true);
      }
    }}
  />

 *
 */
import React, { useState } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import Styles from "./guide.scss";

// import createReactClass from "create-react-class";
// import ObserveModelMixin from "terriajs/lib/ReactViews/ObserveModelMixin";
// import knockout from "terriajs-cesium/Source/ThirdParty/knockout";

import Icon from "../Icon.jsx";
import SlideUpFadeIn from "../Transitions/SlideUpFadeIn/SlideUpFadeIn";

import Spacing from "../../Styled/Spacing";
import Text from "../../Styled/Text";
import { useTranslation } from "react-i18next";
import i18next from "i18next";

const GuideProgress = props => {
  // doesn't work for IE11
  // const countArray = Array.from(Array(props.maxStepCount).keys()).map(e => e++);

  const countArray = [];
  for (let i = 0; i < props.maxStepCount; i++) {
    countArray.push(i);
  }
  const currentStep = props.currentStep;
  return (
    <div className={Styles.indicatorWrapper}>
      {countArray.map(count => {
        return (
          <div
            key={count}
            className={classNames(Styles.indicator, {
              [Styles.indicatorEnabled]: count < currentStep
            })}
          />
        );
      })}
    </div>
  );
};
GuideProgress.propTypes = {
  maxStepCount: PropTypes.number.isRequired,
  currentStep: PropTypes.number.isRequired
};

export const analyticsSetShowGuide = (
  bool,
  index,
  guideKey,
  terria,
  options = {
    setCalledFromInside: false
  }
) => {
  const openOrClose = bool
    ? i18next.t("general.open")
    : i18next.t("general.close");
  const actionSuffix = options.setCalledFromInside ? " from inside modal" : "";

  terria.analytics.logEvent(
    "guide",
    `Guide ${openOrClose}${actionSuffix}`,
    `At index: ${index}, Guide: ${guideKey}`
  );
};

export const GuidePure = ({
  terria,
  guideKey,
  isTopElement,
  handleMakeTopElement,
  hasIntroSlide = false,
  guideData,
  showGuide,
  setShowGuide,
  guideClassName
}) => {
  // Handle index locally for now (unless we do a "open guide at X point" in the future?)
  const [currentGuideIndex, setCurrentGuideIndex] = useState(0);

  const handlePrev = () => {
    const newIndex = currentGuideIndex - 1;
    terria.analytics.logEvent(
      "guide",
      "Navigate Previous",
      `New index: ${newIndex}, Guide: ${guideKey}`
    );
    if (currentGuideIndex === 0) {
      handleSetShowGuide(false);
    } else {
      setCurrentGuideIndex(newIndex);
    }
  };

  const handleNext = () => {
    const newIndex = currentGuideIndex + 1;

    if (guideData[newIndex]) {
      terria.analytics.logEvent(
        "guide",
        "Navigate Next",
        `New index: ${newIndex}, Guide: ${guideKey}`
      );

      setCurrentGuideIndex(newIndex);
    } else {
      handleSetShowGuide(false);
    }
  };

  const { t } = useTranslation();
  const handleSetShowGuide = bool => {
    analyticsSetShowGuide(bool, currentGuideIndex, guideKey, terria, {
      setCalledFromInside: true
    });
    setShowGuide(bool);
  };
  const currentGuide = guideData[currentGuideIndex] || {};
  const hidePrev = currentGuide.hidePrev || false;
  const prevButtonText = currentGuide.prevText || t("general.prev");
  const nextButtonText = currentGuide.nextText || t("general.next");
  const maxStepCount = hasIntroSlide ? guideData.length - 1 : guideData.length;
  const currentStepCount = hasIntroSlide
    ? currentGuideIndex
    : currentGuideIndex + 1;

  return (
    <SlideUpFadeIn
      isVisible={showGuide}
      onExited={() => setCurrentGuideIndex(0)}
    >
      <div
        className={classNames(
          Styles.guide,
          guideClassName,
          isTopElement ? "top-element" : ""
        )}
        onClick={handleMakeTopElement}
      >
        <div className={Styles.image}>
          <div className={Styles.imageWrapper}>
            <img src={currentGuide.imageSrc} />
          </div>
        </div>
        <button
          type="button"
          className={classNames(Styles.innerCloseBtn)}
          onClick={() => handleSetShowGuide(false)}
          title={t("general.close")}
          aria-label={t("general.close")}
        >
          <Icon glyph={Icon.GLYPHS.close} />
        </button>
        <div className={Styles.body}>
          <div>
            <Text bold medium>
              {currentGuide.title}
            </Text>
            <Spacing bottom={4} />
            <Text>{currentGuide.body}</Text>
          </div>
          <div className={Styles.bodyFooter}>
            <div className={Styles.bodyProgress}>
              <GuideProgress
                currentStep={currentStepCount}
                maxStepCount={maxStepCount}
              />
            </div>
            {!hidePrev && (
              <button
                onClick={handlePrev}
                className={classNames(Styles.btnTertiary)}
              >
                {prevButtonText}
              </button>
            )}
            <button
              onClick={handleNext}
              className={classNames(Styles.btn, Styles.btnNext)}
            >
              {nextButtonText}
            </button>
          </div>
        </div>
      </div>
    </SlideUpFadeIn>
  );
};

GuidePure.propTypes = {
  terria: PropTypes.object.isRequired,
  guideKey: PropTypes.string.isRequired,
  isTopElement: PropTypes.bool.isRequired,
  handleMakeTopElement: PropTypes.func.isRequired,
  guideData: PropTypes.array.isRequired,
  showGuide: PropTypes.bool.isRequired,
  setShowGuide: PropTypes.func.isRequired,

  guideClassName: PropTypes.string,
  hasIntroSlide: PropTypes.bool
};

export default GuidePure;
