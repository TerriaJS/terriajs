import { action } from "mobx";
import { observer } from "mobx-react";
import { ChangeEvent } from "react";
import CommonStrata from "../../Models/Definition/CommonStrata";
import FunctionParameter from "../../Models/FunctionParameters/FunctionParameter";
import Styles from "./parameter-editors.scss";

function GenericParameterEditor({
  parameter
}: {
  parameter: FunctionParameter;
}) {
  const onChange = action((e: ChangeEvent<HTMLInputElement>) => {
    parameter.setValue(CommonStrata.user, e.target.value);
  });

  const value = (parameter.value || "") as string;
  return (
    <input
      className={Styles.field}
      type="text"
      onChange={onChange}
      value={value}
    />
  );
}

export default observer(GenericParameterEditor);
