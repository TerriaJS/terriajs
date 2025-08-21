import { observer } from "mobx-react";
import { FC } from "react";
import { isJsonObject } from "../../../Core/Json";
import TerriaError from "../../../Core/TerriaError";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import DiscretelyTimeVaryingMixin from "../../../ModelMixins/DiscretelyTimeVaryingMixin";
import { BaseModel } from "../../../Models/Definition/Model";
import hasTraits from "../../../Models/Definition/hasTraits";
import {
  DEFAULT_PLACEMENT,
  SelectableDimension
} from "../../../Models/SelectableDimensions/SelectableDimensions";
import ViewState from "../../../ReactViewModels/ViewState";
import WebMapServiceCatalogItemTraits from "../../../Traits/TraitsClasses/WebMapServiceCatalogItemTraits";
import ChartItemSelector from "./ChartItemSelector";
import ColorScaleRangeSection from "./ColorScaleRangeSection";
import DateTimeSelectorSection from "./DateTimeSelectorSection";
import FilterSection from "./FilterSection";
import GeneratedControlSection from "./GeneratedControlSection";
import LeftRightSection from "./LeftRightSection";
import Legend from "./Legend";
import OpacitySection from "./OpacitySection";
import SatelliteImageryTimeFilterSection from "./SatelliteImageryTimeFilterSection";
import { ScaleWorkbenchInfo } from "./ScaleWorkbenchInfo";
import DimensionSelectorSection from "./SelectableDimensionSection";
import ShortReport from "./ShortReport";
import TimerSection from "./TimerSection";
import ViewingControls from "./ViewingControls";
import { WorkbenchControls, buildControlSet } from "./WorkbenchControls";

type WorkbenchItemControlsProps = {
  item: BaseModel;
  viewState: ViewState;
  /** Flag to show each control - defaults to all true */
  controls?: WorkbenchControls;
};

const WorkbenchItemControls: FC<WorkbenchItemControlsProps> = observer(
  ({ item, viewState, controls: controlsProp }) => {
    // Apply controls from props on top of defaultControls
    const itemControls =
      CatalogMemberMixin.isMixedInto(item) &&
      isJsonObject(item.workbenchControls)
        ? (item.workbenchControls as WorkbenchControls)
        : undefined;

    const controls = buildControlSet({
      ...controlsProp,
      ...itemControls
    });
    console.log(
      "**controls**",
      itemControls,
      controls.disableAll,
      controls.aboutData
    );
    const { generatedControls, error } = generateControls(viewState, item);

    if (error) {
      error.log();
    }

    return (
      <>
        {controls.viewingControlsGroup ? (
          <ViewingControls
            item={item}
            viewState={viewState}
            controls={controls}
          />
        ) : null}
        {controls.opacity ? <OpacitySection item={item} /> : null}
        {controls.scaleWorkbench ? <ScaleWorkbenchInfo item={item} /> : null}
        {controls.timer ? <TimerSection item={item} /> : null}
        {controls.splitter ? <LeftRightSection item={item as any} /> : null}
        {controls.chartItems ? <ChartItemSelector item={item} /> : null}
        {controls.filter ? <FilterSection item={item} /> : null}
        {controls.dateTime && DiscretelyTimeVaryingMixin.isMixedInto(item) ? (
          <DateTimeSelectorSection item={item} />
        ) : null}
        {controls.timeFilter ? (
          <SatelliteImageryTimeFilterSection item={item} />
        ) : null}
        {controls.selectableDimensions ? (
          <DimensionSelectorSection item={item} placement={DEFAULT_PLACEMENT} />
        ) : null}
        {
          <GeneratedControlSection
            item={item}
            placement={DEFAULT_PLACEMENT}
            controls={generatedControls}
          />
        }
        {/* TODO: remove min max props and move the checks to
      ColorScaleRangeSection to keep this component simple. */}
        {controls.colorScaleRange &&
          hasTraits(
            item,
            WebMapServiceCatalogItemTraits,
            "colorScaleMinimum"
          ) &&
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
        {controls.shortReport ? <ShortReport item={item} /> : null}
        {controls.legend ? <Legend item={item} /> : null}
        {controls.selectableDimensions ? (
          <DimensionSelectorSection item={item} placement={"belowLegend"} />
        ) : null}
        {
          <GeneratedControlSection
            item={item}
            placement="belowLegend"
            controls={generatedControls}
          />
        }
      </>
    );
  }
);

function generateControls(viewState: ViewState, item: BaseModel) {
  const generatedControls: SelectableDimension[] = [];
  const errors: TerriaError[] = [];
  viewState.workbenchItemInputGenerators.forEach((generator) => {
    try {
      const control = generator(item);
      if (control) {
        generatedControls.push(control);
      }
    } catch (error) {
      errors.push(TerriaError.from(error));
    }
  });

  const error = errors.length > 0 ? TerriaError.combine(errors, {}) : undefined;
  return { generatedControls, error };
}

export default WorkbenchItemControls;
