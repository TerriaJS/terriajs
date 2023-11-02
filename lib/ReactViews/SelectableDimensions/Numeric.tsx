import { runInAction } from "mobx";
import React from "react";
import CommonStrata from "../../Models/Definition/CommonStrata";
import { SelectableDimensionNumeric as SelectableDimensionNumericModel } from "../../Models/SelectableDimensions/SelectableDimensions";
import Input from "../../Styled/Input";

export const SelectableDimensionNumeric: React.FC<{
  id: string;
  dim: SelectableDimensionNumericModel;
}> = ({ id, dim }) => {
  return (
    <Input
      styledHeight={"34px"}
      light
      border
      type="number"
      name={id}
      value={dim.value}
      min={dim.min}
      max={dim.max}
      onChange={(evt) => {
        runInAction(() =>
          dim.setDimensionValue(CommonStrata.user, parseFloat(evt.target.value))
        );
      }}
    />
  );
};
