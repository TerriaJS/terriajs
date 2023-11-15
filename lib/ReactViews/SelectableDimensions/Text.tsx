import { runInAction } from "mobx";
import CommonStrata from "../../Models/Definition/CommonStrata";
import { SelectableDimensionText as SelectableDimensionTextModel } from "../../Models/SelectableDimensions/SelectableDimensions";
import Input from "../../Styled/Input";
import { SelectableDimensionsProps as Dimension } from "./SelectableDimensionsProps";

export function SelectableDimensionText({
  id,
  dim
}: Dimension<SelectableDimensionTextModel>) {
  return (
    <Input
      styledHeight={"34px"}
      light
      border
      name={id}
      value={dim.value}
      onChange={(evt) => {
        runInAction(() =>
          dim.setDimensionValue(CommonStrata.user, evt.target.value)
        );
      }}
    />
  );
}
