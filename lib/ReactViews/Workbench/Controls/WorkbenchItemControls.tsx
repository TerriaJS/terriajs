import { observer } from "mobx-react";
import React from "react";
import hasTraits from "../../../Models/Definition/hasTraits";
import { BaseModel } from "../../../Models/Definition/Model";
import { DEFAULT_PLACEMENT } from "../../../Models/SelectableDimensions/SelectableDimensions";
import WebMapServiceCatalogItemTraits from "../../../Traits/TraitsClasses/WebMapServiceCatalogItemTraits";
import ChartItemSelector from "./ChartItemSelector";
import ColorScaleRangeSection from "./ColorScaleRangeSection";
import ViewingControls from "./ViewingControls";
import DateTimeSelectorSection from "./DateTimeSelectorSection";
import DimensionSelectorSection from "./DimensionSelectorSection";
import FilterSection from "./FilterSection";
import Legend from "./Legend";
import OpacitySection from "./OpacitySection";
import SatelliteImageryTimeFilterSection from "./SatelliteImageryTimeFilterSection";
import { ScaleWorkbenchInfo } from "./ScaleWorkbenchInfo";
import ShortReport from "./ShortReport";
import TimerSection from "./TimerSection";
import ViewState from "../../../ReactViewModels/ViewState";

type WorkbenchItemControlsProps = {
  item: BaseModel;
  viewState: ViewState;
};

const WorkbenchItemControls: React.FC<WorkbenchItemControlsProps> = observer(
  ({ item, viewState }) => {
    return (
      <>
        <ViewingControls item={item} viewState={viewState} />
        <OpacitySection item={item} />
        <ScaleWorkbenchInfo item={item} />
        <TimerSection item={item} />
        <ChartItemSelector item={item} />
        <FilterSection item={item} />
        <DateTimeSelectorSection item={item} />
        <SatelliteImageryTimeFilterSection item={item} />
        <DimensionSelectorSection item={item} placement={DEFAULT_PLACEMENT} />
        {/* TODO: remove min max props and move the checks to
      ColorScaleRangeSection to keep this component simple. */}
        {hasTraits(item, WebMapServiceCatalogItemTraits, "colorScaleMinimum") &&
          hasTraits(
            item,
            WebMapServiceCatalogItemTraits,
            "colorScaleMaximum"
          ) && (
            <ColorScaleRangeSection
              item={item}
              minValue={item.colorScaleMinimum}
              maxValue={item.colorScaleMaximum}
            />
          )}
        <ShortReport item={item} />
        <Legend item={item} />
        <DimensionSelectorSection item={item} placement={"belowLegend"} />
      </>
    );
  }
);

export default WorkbenchItemControls;
