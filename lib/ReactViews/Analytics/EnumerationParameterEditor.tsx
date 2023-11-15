import { action } from "mobx";
import { observer } from "mobx-react";
import { ChangeEvent } from "react";
import isDefined from "../../Core/isDefined";
import CommonStrata from "../../Models/Definition/CommonStrata";
import EnumerationParameter from "../../Models/FunctionParameters/EnumerationParameter";
import Styles from "./parameter-editors.scss";

function EnumerationParameterEditor({
  parameter
}: {
  parameter: EnumerationParameter;
}) {
  const onChange = action((e: ChangeEvent<HTMLSelectElement>) => {
    parameter.setValue(CommonStrata.user, e.target.value);
  });

  const value = parameter.value;
  return (
    <select className={Styles.field} onChange={onChange} value={value}>
      {(!isDefined(value) || !parameter.isRequired) && (
        <option key="__undefined__" value="">
          Not specified
        </option>
      )}
      {/* Create option if value is invalid (not in possibleValues) */}
      {isDefined(value) &&
        !parameter.options.find((option) => option.id === value) && (
          <option key="__invalid__" value={value}>
            Invalid value ({value})
          </option>
        )}
      {parameter.options.map((v, i) => (
        <option value={v.id} key={i}>
          {v.name ?? v.id}
        </option>
      ))}
    </select>
  );
}

export default observer(EnumerationParameterEditor);
