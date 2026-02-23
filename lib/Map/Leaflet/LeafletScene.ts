import { Event as CesiumEvent } from "terriajs-cesium";
import L from "leaflet";

export default class LeafletScene {
  readonly map: L.Map;
  readonly featureClicked = new CesiumEvent();
  readonly featureMousedown = new CesiumEvent();
  constructor(map: L.Map) {
    this.map = map;
  }
}
