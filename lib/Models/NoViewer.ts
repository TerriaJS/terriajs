'use strict';

import GlobeOrMap, { CameraView } from "./GlobeOrMap";
import Terria from "./Terria";
import "terriajs-cesium/Source/Core/Rectangle";
import Mappable from "./Mappable";

/*global require*/
var inherit = require('../Core/inherit');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var when = require('terriajs-cesium/Source/ThirdParty/when');

class NoViewer implements GlobeOrMap {
    private readonly terria: Terria;

    constructor(terria: Terria) {
        this.terria = terria;
    }

    destroy() {
    }

    zoomTo(v: CameraView | Cesium.Rectangle | Mappable, t: any) {
        // Set initial view?
    }

    notifyRepaintRequired() {
    }
}

export default NoViewer;
