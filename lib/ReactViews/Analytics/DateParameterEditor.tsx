import { observer } from "mobx-react";
import React, { useCallback } from "react";
import CommonStrata from "../../Models/Definition/CommonStrata";
import DateParameter from "../../Models/FunctionParameters/DateParameter";
import Styles from "./parameter-editors.scss";

interface DateParameterEditorProps {
  parameter: DateParameter;
}

const DateParameterEditor: React.FC<DateParameterEditorProps> = observer(
  ({ parameter }) => {
    const style =
      parameter?.value !== undefined
        ? Styles.field
        : Styles.fieldDatePlaceholder;

    const onChangeDate = useCallback(
      (e) => parameter.setValue(CommonStrata.user, e.target.value),
      [parameter]
    );

    return (
      <div>
        <input
          className={style}
          type="date"
          placeholder="YYYY-MM-DD"
          onChange={onChangeDate}
          value={parameter.value ?? ""}
        />
      </div>
    );
  }
);

export default DateParameterEditor;
