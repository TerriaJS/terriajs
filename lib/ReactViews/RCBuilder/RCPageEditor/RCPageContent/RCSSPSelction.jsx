import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import Styles from "./RCPageContent.scss";

const RCSSPSelection = props => {
  const { ssps, scenarios, selectedSSP, onSSPSelected } = props;
  return (
    <div className={Styles.radioContainer}>
      {ssps.map((ssp, id) => {
        return (
          <label
            key={id}
            className={classNames(
              selectedSSP === ssp ? Styles.selected : "undefined",
              scenarios.some(sc => sc.ssp === ssp) && Styles.disabledLabel
            )}
          >
            <input
              type="radio"
              value={ssp}
              checked={selectedSSP === ssp}
              onChange={onSSPSelected}
            />
            {ssp}
          </label>
        );
      })}
    </div>
  );
};
RCSSPSelection.propTypes = {
  ssps: PropTypes.array,
  scenarios: PropTypes.array,
  selectedSSP: PropTypes.string,
  onSSPSelected: PropTypes.func
};
export default RCSSPSelection;
