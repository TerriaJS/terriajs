import CesiumEvent from "terriajs-cesium/Source/Core/Event";

export default class LeafletScene {
  readonly map: L.Map;
  readonly featureClicked = new CesiumEvent();
  readonly featureMousedown = new CesiumEvent();
  constructor(map: L.Map) {
    this.map = map;
  }
}
