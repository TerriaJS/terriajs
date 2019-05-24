"use strict";

import GlobeOrMap, { CameraView } from "./GlobeOrMap";
import Terria from "./Terria";
import "terriajs-cesium/Source/Core/Rectangle";
import Mappable from "./Mappable";

/*global require*/
var inherit = require("../Core/inherit");
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle");
var when = require("terriajs-cesium/Source/ThirdParty/when");

class NoViewer extends GlobeOrMap {
  readonly terria: Terria;

  constructor(terria: Terria) {
    super();
    this.terria = terria;
  }

  destroy() {}

  zoomTo(v: CameraView | Cesium.Rectangle | Mappable, t: any) {
    // Set initial view?
  }

  notifyRepaintRequired() {}

  getCurrentExtent() {
    return Rectangle.fromDegrees(120, -45, 155, -15); // This is just a random rectangle. Replace it when there's a home view available
  }
}

export default NoViewer;
