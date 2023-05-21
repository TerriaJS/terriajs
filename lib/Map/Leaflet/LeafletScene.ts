import { Event as CesiumEvent } from "cesium";

export default class LeafletScene {
  readonly map: L.Map;
  readonly featureClicked = new CesiumEvent();
  readonly featureMousedown = new CesiumEvent();
  constructor(map: L.Map) {
    this.map = map;
  }
}
