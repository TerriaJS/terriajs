import React, { useState, useEffect, useRef, useCallback } from "react";
import defined from "terriajs-cesium/Source/Core/defined";
import Styles from "./parameter-editors.scss";
import CommonStrata from "../../Models/Definition/CommonStrata";
import PropTypes from "prop-types";

const DateTimeParameterEditor = ({ parameter, previewed, terria }) => {
  const [dateValue, setDateValue] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [timeValue, setTimeValue] = useState("00:00");

  const style =
    defined(parameter) && defined(parameter.value)
      ? Styles.field
      : Styles.fieldDatePlaceholder;

  const currentTime = useRef();
  currentTime.current = terria.timelineStack.clock.currentTime;

  useEffect(() => {
    const date = new Date(currentTime.current);
    setDateValue(date.toISOString().slice(0, 10));
    setTimeValue(date.toTimeString().slice(0, 5));
  }, []);

  const updateParameter = useCallback(() => {
    parameter.setValue(CommonStrata.user, `${dateValue}T${timeValue}`);
  }, [parameter, dateValue, timeValue]);

  const handleChange = (setter) => (e) => {
    setter(e.target.value);
    updateParameter();
  };

  updateParameter();

  return (
    <div>
      <input
        className={style}
        type="date"
        value={dateValue}
        onChange={handleChange(setDateValue)}
      />
      <input
        className={style}
        type="time"
        value={timeValue}
        onChange={handleChange(setTimeValue)}
      />
    </div>
  );
};

DateTimeParameterEditor.propTypes = {
  parameter: PropTypes.object,
  previewed: PropTypes.object,
  terria: PropTypes.object
};

export default DateTimeParameterEditor;
