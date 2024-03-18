import React, { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { runInAction } from "mobx";
import defined from "terriajs-cesium/Source/Core/defined";
import Styles from "./parameter-editors.scss";
import CommonStrata from "../../Models/Definition/CommonStrata";
import PropTypes from "prop-types";

const DateTimeParameterEditor = ({ parameter, previewed, terria }) => {
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("00:00");

  const style =
    defined(parameter) && defined(parameter.value)
      ? Styles.field
      : Styles.fieldDatePlaceholder;

  const currentTime = useRef();
  currentTime.current = terria.timelineStack.clock.currentTime;

  useEffect(() => {
    if (!defined(parameter.value)) {
      const date = new Date(currentTime.current);
      const formattedDate = `${date.toISOString().slice(0, 10)}T${date
        .toTimeString()
        .slice(0, 5)}`;
      if (parameter.value !== formattedDate) {
        setDateValue(date.toISOString().slice(0, 10));
        setTimeValue(date.toTimeString().slice(0, 5));
      }
    } else {
      const date = new Date(parameter.value);
      setDateValue(date.toISOString().slice(0, 10));
      setTimeValue(date.toTimeString().slice(0, 5));
    }
  }, [parameter]);

  const handleTimeChange = (e) => {
    setTimeValue(e.target.value);
    runInAction(() => {
      parameter.setValue(CommonStrata.user, `${dateValue}T${e.target.value}`);
    });
  };

  const handleDateChange = (e) => {
    setDateValue(e.target.value);
    runInAction(() => {
      parameter.setValue(CommonStrata.user, `${e.target.value}T${timeValue}`);
    });
  };

  return (
    <div>
      <input
        className={style}
        type="date"
        value={dateValue}
        onChange={handleDateChange}
      />
      <input
        className={style}
        type="time"
        value={timeValue}
        onChange={handleTimeChange}
      />
    </div>
  );
};

DateTimeParameterEditor.propTypes = {
  parameter: PropTypes.object,
  previewed: PropTypes.object,
  terria: PropTypes.object
};

export default observer(DateTimeParameterEditor);
