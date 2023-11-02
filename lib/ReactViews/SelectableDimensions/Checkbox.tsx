import { runInAction } from "mobx";
import React from "react";
import CommonStrata from "../../Models/Definition/CommonStrata";
import { SelectableDimensionCheckbox as SelectableDimensionCheckboxModel } from "../../Models/SelectableDimensions/SelectableDimensions";
import Checkbox from "../../Styled/Checkbox";
import Text from "../../Styled/Text";

export const SelectableDimensionCheckbox: React.FC<{
  id: string;
  dim: SelectableDimensionCheckboxModel;
}> = ({ id, dim }) => {
  return (
    <Checkbox
      name={id}
      isChecked={dim.selectedId === "true"}
      onChange={(evt) =>
        runInAction(() =>
          dim.setDimensionValue(
            CommonStrata.user,
            evt.target.checked ? "true" : "false"
          )
        )
      }
    >
      <Text>
        {dim.options?.find((opt) => opt.id === dim.selectedId)?.name ??
          (dim.selectedId === "true" ? "Enabled" : "Disabled")}
      </Text>
    </Checkbox>
  );
};
