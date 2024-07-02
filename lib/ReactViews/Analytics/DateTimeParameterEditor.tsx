import { observer } from "mobx-react";
import React, { useCallback } from "react";
import CommonStrata from "../../Models/Definition/CommonStrata";
import DateTimeParameter from "../../Models/FunctionParameters/DateTimeParameter";
import Styles from "./parameter-editors.scss";

interface DateTimeParameterEditorProps {
  parameter: DateTimeParameter;
}

const DateTimeParameterEditor: React.FC<DateTimeParameterEditorProps> =
  observer(({ parameter }) => {
    const style =
      parameter?.value !== undefined
        ? Styles.field
        : Styles.fieldDatePlaceholder;

    const onDateTimeChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) =>
        parameter.setValue(CommonStrata.user, e.target.value),
      [parameter]
    );

    return (
      <div>
        <input
          className={style}
          type="datetime-local"
          value={parameter.value ?? ""}
          onChange={onDateTimeChange}
        />
      </div>
    );
  });

export default DateTimeParameterEditor;
