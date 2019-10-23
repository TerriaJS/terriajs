import React, { useState } from "react";
// import React from "react";
import classNames from "classnames";

import Styles from "./guide.scss";

import Icon from "../Icon.jsx";

import Spacing from "../../Styled/Spacing";
import Text from "../../Styled/Text";

const GuidanceProgress = props => {
  const countArray = Array.from(Array(props.max).keys()).map(e => e++);
  const countStep = props.step;
  return (
    <div className={Styles.indicatorWrapper}>
      {countArray.map(count => {
        return (
          <div
            key={count}
            className={classNames(Styles.indicator, {
              [Styles.indicatorEnabled]: count < countStep
            })}
          />
        );
      })}
    </div>
  );
};

// const GuidanceContextModal = ({ children }) => {
//   return (
//     <div className={Styles.context}>
//       <Text>{children}</Text>
//       <button className={Styles.btn}>Next</button>
//       Skip{/* ? */}
//       <GuidanceProgress step={2} max={4} />
//     </div>
//   );
// };

const guideData = [
  {
    imageSrc: require("../../../wwwroot/images/guides/satellite-feature.jpg"),
    title: "Satellite Imagery: How do I…?",
    body:
      "A super-quick guide to getting the most out of historical satellite imagery.",
    prevText: "No thanks",
    nextText: "View guide"
  },
  {
    imageSrc: require("../../../wwwroot/images/guides/satellite-zoom.jpg"),
    title: "Where is my satellite imagery?",
    body:
      "You may need to adjust your zoom level to locate near real-time satellite imagery on the map.",
    hidePrev: true
  },
  {
    imageSrc: require("../../../wwwroot/images/guides/satellite-time.jpg"),
    title: "Loading historical imagery",
    body:
      "In your data workbench, click on the capture date dropdown and select from available times to load historical imagery."
  },
  {
    imageSrc: require("../../../wwwroot/images/guides/satellite-location.jpg"),
    title: "Filtering imagery by location",
    body:
      "Satellite imagery may not always be available at your preferred time and location. If you only want to view imagery for a particular location, click ‘filter by location’ in your data workbench."
  },
  {
    imageSrc: require("../../../wwwroot/images/guides/satellite-styles.jpg"),
    title: "How do I view false-colour imagery?",
    body:
      "You can apply a range of false-colour styles to satellite imagery by clicking on the styles dropdown in your data workbench.",
    nextText: "Got it, Thanks!"
  }
];

export const Guide = ({ children }) => {
  const [showGuide, setShowGuide] = useState(true);
  const [currentGuideIndex, setcurrentGuideIndex] = useState(0);

  if (!showGuide) {
    return null;
  }
  // const [showGuidance, setShowGuidance] = useState(false);
  // const [showGuidance, setShowGuidance] = useState(false);

  // const currentGuideIndex = [0]

  const handlePrev = () => {
    if (currentGuideIndex === 0) {
      setShowGuide(false);
    } else {
      setcurrentGuideIndex(currentGuideIndex - 1);
    }
  };
  const handleNext = () => {
    const newIndex = currentGuideIndex + 1;
    // const newIndex =
    //   currentGuideIndex + 1 > guideData.length ? null : currentGuideIndex + 1;
    if (guideData[newIndex]) {
      setcurrentGuideIndex(newIndex);
    } else {
      setShowGuide(false);
    }
  };

  const currentGuide = guideData[currentGuideIndex] || {};
  const isLastSlide = currentGuideIndex === guideData.length;
  const hidePrev = currentGuide.hidePrev || false;
  const prevButtonText = currentGuide.prevText || "Prev";
  const nextButtonText = currentGuide.nextText || "Next";

  // const prevButtonText =
  //   currentGuideIndex === 0
  //     ? "No thanks"
  //     : currentGuideIndex === 1
  //     ? null
  //     : "Prev";
  // const nextButtonText =
  //   currentGuideIndex === 0
  //     ? "View guide"
  //     : isLastSlide
  //     ? "Got it, Thanks!"
  //     : "Next";

  return (
    <div className={Styles.guidance}>
      <div className={Styles.image}>
        <img src={currentGuide.imageSrc} />
      </div>
      <button
        type="button"
        className={classNames(Styles.innerCloseBtn, {})}
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
          {/* <Text>{children}</Text> */}
          <Text>{currentGuide.body}</Text>
        </div>
        <div className={Styles.bodyFooter}>
          <div className={Styles.bodyProgress}>
            <GuidanceProgress step={currentGuideIndex} max={4} />
          </div>
          {!hidePrev && (
            <button
              onClick={handlePrev}
              // className={classNames(Styles.btn, Styles.btnGrey)}
              className={classNames(Styles.btnTertiary)}
            >
              {prevButtonText}
            </button>
          )}
          <button
            onClick={handleNext}
            // className={classNames(Styles.btn, Styles.btnNext)}
            className={classNames(Styles.btn, Styles.btnNext)}
          >
            {nextButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Guide;
