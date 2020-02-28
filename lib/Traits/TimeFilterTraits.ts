import ModelTraits from "./ModelTraits";
import LatLonHeightTraits from "./LatLonHeightTraits";
import objectTrait from "./objectTrait";
import primitiveTrait from "./primitiveTrait";
import mixTraits from "./mixTraits";

export class TimeFilterCoordinates extends mixTraits(LatLonHeightTraits) {
  @primitiveTrait({
    type: "number",
    name: "x",
    description: "X coordinate of the tile"
  })
  x?: number;

  @primitiveTrait({
    type: "number",
    name: "y",
    description: "Y coordinate of the tile"
  })
  y?: number;

  @primitiveTrait({
    type: "number",
    name: "level",
    description: "Zoom level of the tile"
  })
  level?: number;
}

export default class TimeFilterTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Time filter property",
    description:
      "The name of a property in a feature returned from this layer's feature query service that indicates the times at which this layer covers this position. For example, historical and near-real-time satellite imagery often comes as daily swaths, with a given area on the globe potentially only covered every number of days."
  })
  timeFilterPropertyName?: string;

  @objectTrait({
    type: TimeFilterCoordinates,
    name: "Time filter coordinates",
    description: "The current position picked by the user for filtering"
  })
  timeFilterCoordinates?: TimeFilterCoordinates;
}
