import React, { ChangeEvent, useState } from "react";
import { observer } from "mobx-react";
import CommonStrata from "../../Models/Definition/CommonStrata";
import NumberParameter from "../../Models/FunctionParameters/NumberParameter";

import Styles from "./parameter-editors.scss";

const NumberParameterEditor: React.FC<{ parameter: NumberParameter }> = ({
  parameter
}) => {
  const [value, setValue] = useState<number | undefined>(
    parameter.defaultValue
  );

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(parseFloat(e.target.value));
    parameter.setValue(CommonStrata.user, e.target.value);
  };

  const min = (parameter.minimum || "") as string;
  const max = (parameter.maximum || "") as string;

  return (
    <input
      className={Styles.field}
      type="number"
      onChange={onChange}
      value={value}
      min={min}
      max={max}
    />
  );
};

export default observer(NumberParameterEditor);
