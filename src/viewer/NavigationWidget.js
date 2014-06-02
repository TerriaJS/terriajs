"use strict";

/*global require,Cesium*/

var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var createCommand = Cesium.createCommand;
var Ellipsoid = Cesium.Ellipsoid;
var getElement = Cesium.getElement;
var SceneMode = Cesium.SceneMode;

var knockout = require('knockout');

var NavigationWidget = function(viewer, container) {
    container = getElement(container);

    this._viewer = viewer;

    var element = document.createElement('div');
    element.className = 'navigation-controls';
    container.appendChild(element);

    element.innerHTML = '\
        <img src="images/plus.svg" class="navigation-control" data-bind="click: zoomIn" title="Zoom In"></div>\
        <img src="images/minus.svg" class="navigation-control" data-bind="click: zoomOut" title="Zoom Out"></div>\
    ';

    var that = this;
    this._viewModel = {
        zoomIn : createCommand(function() {
            zoomIn(that._viewer.scene);
        }),
        zoomOut : createCommand(function() {
            zoomOut(that._viewer.scene);
        })
    };

    knockout.applyBindings(this._viewModel, element);
};

//Camera extent approx for 2D viewer
function getCameraFocus(scene) {
    //HACK to get current camera focus
    var pos = Cartesian2.fromArray([$(document).width()/2,$(document).height()/2]);
    var focus = scene.camera.pickEllipsoid(pos, Ellipsoid.WGS84);
    return focus;
}

//TODO: need to make this animate
function zoomCamera(scene, distFactor, pos) {
    var camera = scene.camera;
    //for now
    if (scene.mode === SceneMode.SCENE3D) {
        var cartesian;
        if (pos === undefined) {
            cartesian = getCameraFocus(scene);
        }
        else {
            cartesian = camera.pickEllipsoid(pos, Ellipsoid.WGS84);
        }
        if (cartesian) {
            //TODO: zoom to point selected by user
//                camera.lookAt(camera.position, cartesian, camera.up);
            var dist = Cartesian3.magnitude(Cartesian3.subtract(cartesian, camera.position));
            camera.moveForward(dist * distFactor);
        }
    }
    else {
        camera.moveForward(camera.getMagnitude() * distFactor);
    }
}

function zoomIn(scene, pos) { zoomCamera(scene, 2.0/3.0, pos); };
function zoomOut(scene, pos) { zoomCamera(scene, -3.0/2.0, pos); };

module.exports = NavigationWidget;
