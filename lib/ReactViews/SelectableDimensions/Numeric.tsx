import { runInAction } from "mobx";
import { observer } from "mobx-react";
import { useState } from "react";
import CommonStrata from "../../Models/Definition/CommonStrata";
import { SelectableDimensionNumeric as SelectableDimensionNumericModel } from "../../Models/SelectableDimensions/SelectableDimensions";
import Input from "../../Styled/Input";
import { SelectableDimensionsProps as Dimension } from "./SelectableDimensionsProps";

export const SelectableDimensionNumeric = observer(
  function SelectableDimensionNumeric({
    id,
    dim
  }: Dimension<SelectableDimensionNumericModel>) {
    const [value, setValue] = useState(dim.value?.toString());

    return (
      <Input
        styledHeight={"34px"}
        light
        border
        type="number"
        name={id}
        value={value}
        min={dim.min}
        max={dim.max}
        invalidValue={Number.isNaN(parseFloat(value ?? ""))}
        onChange={(evt) => {
          setValue(evt.target.value);
          const number = parseFloat(evt.target.value);
          if (!Number.isNaN(number)) {
            runInAction(() => dim.setDimensionValue(CommonStrata.user, number));
          }
        }}
      />
    );
  }
);
