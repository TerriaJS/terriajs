"use strict";
import React, { useState } from "react";
import Styles from "./RCTooltip.scss";

const Tooltip = props => {
  let timeout;
  const [active, setActive] = useState(false);

  const showTip = () => {
    timeout = setTimeout(() => {
      setActive(true);
    }, props.delay || 400);
  };

  const hideTip = () => {
    clearInterval(timeout);
    setActive(false);
  };

  return (
    <div
      className={Styles.TooltipWrapper}
      // When to show the tooltip
      onMouseEnter={showTip}
      onMouseLeave={hideTip}
    >
      {/* Wrapping */}
      {props.children}
      {active && (
        <div
          className={[Styles.TooltipTip, Styles[props.direction || "top"]].join(
            " "
          )}
        >
          {/* Content */}
          {props.content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
