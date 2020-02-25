import ModelTraits from "./ModelTraits";
import LatLonHeightTraits from "./LatLonHeightTraits";
import objectTrait from "./objectTrait";
import primitiveTrait from "./primitiveTrait";

export default class TimeFilterTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Time filter property",
    description:
      "The name of a property in a feature returned from this layer's feature query service that indicates the times at which this layer covers this position. For example, historical and near-real-time satellite imagery often comes as daily swaths, with a given area on the globe potentially only covered every number of days."
  })
  timeFilterProperty?: string;

  @objectTrait({
    type: LatLonHeightTraits,
    name: "Time filter position",
    description: "The currently selected position for interval filtering"
  })
  timeFilterPosition?: LatLonHeightTraits;
}
