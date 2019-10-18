import React, { useState } from "react";
import classNames from "classnames";

import Styles from "./guidance.scss";
import Text from "../../Styled/Text";

import GuidanceDot from "./GuidanceDot.jsx";

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

const GuidanceContextModal = ({ children }) => {
  return (
    <div className={Styles.context}>
      <Text>{children}</Text>
      <button className={Styles.btn}>Next</button>
      Skip{/* ? */}
      <GuidanceProgress step={2} max={4} />
    </div>
  );
};

export const Guidance = ({ children }) => {
  const [showGuidance, setShowGuidance] = useState(false);

  return (
    <div className={Styles.guidance}>
      <GuidanceDot onClick={() => setShowGuidance(!showGuidance)} />
      {/* {showGuidance && <div className={Styles.context}>{children}</div>} */}
      {showGuidance && <GuidanceContextModal>{children}</GuidanceContextModal>}
    </div>
  );
};

export default Guidance;
