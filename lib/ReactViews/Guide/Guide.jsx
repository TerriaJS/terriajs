/** 
 * A generic Guide component, look at satellite-guidance.js for example data / usage
 * 
 * consume something like:
 
  <Guide
    hasIntroSlide
    guideData={SatelliteGuideData}
    showGuide={this.props.viewState.showSatelliteGuidance}
    setShowGuide={bool => {
      this.props.viewState.showSatelliteGuidance = bool;
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

const GuidanceProgress = props => {
  const countArray = Array.from(Array(props.maxStepCount).keys()).map(e => e++);
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

// const Guide = createReactClass({
//   displayName: "Guide",
//   mixins: [ObserveModelMixin],
//   propTypes: {
//     viewState: PropTypes.object.isRequired,
//     showGuide: PropTypes.bool.isRequired,
//     setShowGuide: PropTypes.func.isRequired,
//     guideData: PropTypes.array.isRequired
//   },
//   render() {
//     const { guideData, showGuide, setShowGuide } = this.props;

//     return (
//       <GuidePure
//         guideData={guideData}
//         showGuide={showGuide}
//         setShowGuide={setShowGuide}
//       />
//     );
//   }
// });

export const GuidePure = ({
  hasIntroSlide = false,
  guideData,
  showGuide,
  setShowGuide
}) => {
  // Handle index locally for now (unless we do a "open guide at X point" in the future?)
  const [currentGuideIndex, setCurrentGuideIndex] = useState(0);

  const handlePrev = () => {
    if (currentGuideIndex === 0) {
      setShowGuide(false);
    } else {
      setCurrentGuideIndex(currentGuideIndex - 1);
    }
  };

  const handleNext = () => {
    const newIndex = currentGuideIndex + 1;

    if (guideData[newIndex]) {
      setCurrentGuideIndex(newIndex);
    } else {
      setShowGuide(false);
    }
  };

  const currentGuide = guideData[currentGuideIndex] || {};
  const hidePrev = currentGuide.hidePrev || false;
  const prevButtonText = currentGuide.prevText || "Prev";
  const nextButtonText = currentGuide.nextText || "Next";
  const maxStepCount = hasIntroSlide ? guideData.length - 1 : guideData.length;
  const currentStepCount = hasIntroSlide
    ? currentGuideIndex
    : currentGuideIndex + 1;

  return (
    <SlideUpFadeIn
      isVisible={showGuide}
      onExited={() => setCurrentGuideIndex(0)}
    >
      <div className={classNames(Styles.guidance, this.props.guideClassName)}>
        <div className={Styles.image}>
          <img src={currentGuide.imageSrc} />
        </div>
        <button
          type="button"
          className={classNames(Styles.innerCloseBtn)}
          onClick={() => setShowGuide(false)}
          title="Close"
          aria-label="Close"
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
              <GuidanceProgress
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
  guideClassName: PropTypes.string,
  hasIntroSlide: PropTypes.bool,
  guideData: PropTypes.array.isRequired,
  showGuide: PropTypes.bool.isRequired,
  setShowGuide: PropTypes.func.isRequired
};

export default GuidePure;
