import LatLonHeightTraits from "./LatLonHeightTraits";
import ModelTraits from "../ModelTraits";
import objectTrait from "../Decorators/objectTrait";

export default class ChartPointOnMapTraits extends ModelTraits {
  @objectTrait({
    name: "Chart expand point on map",
    description:
      "The point on map where the current chart for the item was generated from. A marker will be shown at this point if the chart is active.",
    type: LatLonHeightTraits
  })
  chartPointOnMap?: LatLonHeightTraits;
}
