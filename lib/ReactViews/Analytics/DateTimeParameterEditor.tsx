import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { runInAction } from "mobx";
import moment from "moment";
import defined from "terriajs-cesium/Source/Core/defined";
import Styles from "./parameter-editors.scss";
import CommonStrata from "../../Models/Definition/CommonStrata";
import DateTimeParameter from "../../Models/FunctionParameters/DateTimeParameter";
import Terria from "../../Models/Terria";

interface DateTimeParameterEditorProps {
  parameter: DateTimeParameter;
  terria: Terria;
}

const DateTimeParameterEditor: React.FC<DateTimeParameterEditorProps> = ({
  parameter,
  terria
}) => {
  const style =
    defined(parameter) && defined(parameter.value)
      ? Styles.field
      : Styles.fieldDatePlaceholder;

  useEffect(() => {
    let newDateValue, newTimeValue;
    if (parameter.value === undefined) {
      const currentTime = defined(parameter.value)
        ? parameter.value
        : terria.timelineStack.clock.currentTime;

      if (currentTime) {
        const ct = new Date(currentTime?.toString());

        newDateValue = moment
          .utc(ct.toISOString())
          .local()
          .format("YYYY-MM-DD");
        newTimeValue = moment.utc(ct.toISOString()).local().format("HH:mm");
      }
    } else {
      const ct = new Date(parameter.value);
      newDateValue = moment.utc(ct.toISOString()).local().format("YYYY-MM-DD");
      newTimeValue = moment.utc(ct.toISOString()).local().format("HH:mm");
    }
    parameter.setValue(CommonStrata.user, `${newDateValue}T${newTimeValue}`);
  }, [parameter, terria.timelineStack.clock.currentTime]);

  const isValidTime = (time: string): boolean => {
    const timeFormat = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeFormat.test(time);
  };

  const isValidDate = (date: string, format = "YYYY-MM-DD"): boolean => {
    return moment(date, format, true).isValid();
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    if (isValidTime(time)) {
      runInAction(() => {
        parameter.setValue(CommonStrata.user, `${dateValue}T${time}`);
      });
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isValidDate(e.target.value)) {
      runInAction(() => {
        parameter.setValue(CommonStrata.user, `${e.target.value}T${timeValue}`);
      });
    }
  };

  const value = parameter.value;
  const dateValue = value ? value.split("T")[0] : "";
  const timeValue = value ? value.split("T")[1] : "";

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

export default observer(DateTimeParameterEditor);
