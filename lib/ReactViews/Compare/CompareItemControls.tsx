import React from "react";
import { BaseModel } from "../../Models/Definition/Model";
import SelectableDimensions, {
  DEFAULT_PLACEMENT
} from "../../Models/SelectableDimensions/SelectableDimensions";
import DimensionSelectorSection from "../Workbench/Controls/DimensionSelectorSection";
import Legend from "../Workbench/Controls/Legend";
import OpacitySection from "../Workbench/Controls/OpacitySection";

const CompareItemControls: React.FC<{ item: BaseModel }> = ({ item }) => {
  return (
    <>
      <OpacitySection item={item} />
      {SelectableDimensions.is(item) && (
        <DimensionSelectorSection item={item} placement={DEFAULT_PLACEMENT} />
      )}
      <Legend item={item} />
      {SelectableDimensions.is(item) && (
        <DimensionSelectorSection item={item} placement={"belowLegend"} />
      )}
    </>
  );
};

export default CompareItemControls;
