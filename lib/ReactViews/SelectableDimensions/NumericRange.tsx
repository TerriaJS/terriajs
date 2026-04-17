import { runInAction } from "mobx";
import { observer } from "mobx-react";
import _Slider from "rc-slider";
import { FC } from "react";
import CommonStrata from "../../Models/Definition/CommonStrata";
import { SelectableDimensionNumericRange as SelectableDimensionNumericRangeModel } from "../../Models/SelectableDimensions/SelectableDimensions";

const Slider = _Slider.createSliderWithTooltip(_Slider);

export const SelectableDimensionNumericRange: FC<{
  id: string;
  dim: SelectableDimensionNumericRangeModel;
}> = observer(({ dim }) => {
  return (
    <div
      css={`
        width: 99%;
        margin: auto;
      `}
    >
      <Slider
        min={dim.min}
        max={dim.max}
        step={dim.step}
        value={dim.value}
        marks={dim.marks}
        tipFormatter={(value) => dim.marks?.[value] ?? value}
        onChange={(number) => {
          runInAction(() => dim.setDimensionValue(CommonStrata.user, number));
        }}
      />
    </div>
  );
});
