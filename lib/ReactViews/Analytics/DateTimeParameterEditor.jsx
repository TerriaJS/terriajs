import React, { useState } from "react";
import defined from "terriajs-cesium/Source/Core/defined";
import Styles from "./parameter-editors.scss";
import CommonStrata from "../../Models/Definition/CommonStrata";
import PropTypes from "prop-types";

const DateTimeParameterEditor = (props) => {
  const [dateValue, setDateValue] = useState(
    defined(props.parameter) && defined(props.parameter.value)
      ? props.parameter.value
      : ""
  );
  const [timeValue, setTimeValue] = useState("00:00");

  const style =
    defined(props.parameter) && defined(props.parameter.value)
      ? Styles.field
      : Styles.fieldDatePlaceholder;

  return (
    <div>
      <div>
        <input
          className={style}
          type="date"
          placeholder="YYYY-MM-DD"
          value={dateValue}
          onChange={(e) => {
            setDateValue(e.target.value);
            if (defined(props.parameter)) {
              props.parameter.setValue(
                CommonStrata.user,
                `${e.target.value}T${timeValue}`
              );
            }
          }}
        />
        <input
          className={style}
          type="time"
          placeholder="HH:mm:ss.sss"
          value={timeValue}
          onChange={(e) => {
            setTimeValue(e.target.value);
            if (defined(props.parameter)) {
              props.parameter.setValue(
                CommonStrata.user,
                `${dateValue}T${e.target.value}`
              );
            }
          }}
        />
      </div>
    </div>
  );
};

DateTimeParameterEditor.propTypes = {
  parameter: PropTypes.object,
  previewed: PropTypes.object
};

export default DateTimeParameterEditor;
