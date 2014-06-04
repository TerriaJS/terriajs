"use strict";

/*global require,Cesium*/

var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var CesiumMath = Cesium.Math;
var createCommand = Cesium.createCommand;
var Ellipsoid = Cesium.Ellipsoid;
var getElement = Cesium.getElement;
var SceneMode = Cesium.SceneMode;
var Matrix4 = Cesium.Matrix4;
var CameraFlightPath = Cesium.CameraFlightPath;
var Ray = Cesium.Ray;
var IntersectionTests = Cesium.IntersectionTests;
var defined = Cesium.defined;
var Tween = Cesium.Tween;

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
        <img src="images/tilt_none.svg" class="navigation-control" data-bind="click: tilt, visible: isTiltExtreme" title="Tilt"></div>\
        <img src="images/tilt_moderate.svg" class="navigation-control" data-bind="click: tilt, visible: isTiltNone" title="Tilt"></div>\
        <img src="images/tilt_extreme.svg" class="navigation-control" data-bind="click: tilt, visible: isTiltModerate" title="Tilt"></div>\
    ';

    var that = this;
    this._viewModel = {
        zoomIn : createCommand(function() {
            zoomIn(that._viewer.scene);
        }),
        zoomOut : createCommand(function() {
            zoomOut(that._viewer.scene);
        }),
        tilt : createCommand(function() {
            console.log(that._viewer.scene.camera.tilt);
            if (that._viewModel.isTiltNone) {
                that._viewModel.isTiltNone = false;
                that._viewModel.isTiltModerate = true;
                that._viewer.scene.camera.tilt = CesiumMath.toRadians(30.0);
            } else if (that._viewModel.isTiltModerate) {
                that._viewModel.isTiltModerate = false;
                that._viewModel.isTiltExtreme = true;
                that._viewer.scene.camera.tilt = CesiumMath.toRadians(10.0);
            } else if (that._viewModel.isTiltExtreme) {
                that._viewModel.isTiltExtreme = false;
                that._viewModel.isTiltNone = true;
                that._viewer.scene.camera.tilt = CesiumMath.toRadians(90.0);
            }
        }),
        isTiltNone : true,
        isTiltModerate : false,
        isTiltExtreme : false
    };

    knockout.track(this._viewModel, ['isTiltNone', 'isTiltModerate', 'isTiltExtreme']);

    knockout.applyBindings(this._viewModel, element);
};

//Camera extent approx for 2D viewer
function getCameraFocus(scene) {
    //HACK to get current camera focus
    var ray = new Ray(scene.camera.positionWC, scene.camera.directionWC);
    var intersections = IntersectionTests.rayEllipsoid(ray, Ellipsoid.WGS84);
    if (defined(intersections)) {
        return Ray.getPoint(ray, intersections.start);
    } else {
        // Camera direction is not pointing at the globe.
        // So use a multiple of the camera height as the focal distance.
        var cameraPositionCartographic = Ellipsoid.WGS84.cartesianToCartographic(scene.camera.positionWC);
        var height = cameraPositionCartographic.height;
        return Cartesian3.add(scene.camera.positionWC, Cartesian3.multiplyByScalar(scene.camera.directionWC, height * 2.0));
    }
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
            var direction = Cartesian3.subtract(cartesian, camera.position);
            var dist = Cartesian3.magnitude(direction);

            var controller = scene.screenSpaceCameraController;
            controller.enableInputs = false;

            /*var options = {
                destination: Cartesian3.add(camera.position, Cartesian3.multiplyByScalar(Cartesian3.normalize(direction), dist * distFactor)),
                direction: scene.camera.directionWC,
                up: scene.camera.upWC,
                duration: 200,
                endReferenceFrame: Matrix4.IDENTITY,
                convert: false
            };

            var flight = CameraFlightPath.createAnimation(scene, options);*/

            var startPosition = camera.position;
            var endPosition = Cartesian3.add(camera.position, Cartesian3.multiplyByScalar(Cartesian3.normalize(direction), dist * distFactor));
            var durationMilliseconds = 200;

            scene.animations.add({
                duration : durationMilliseconds,
                easingFunction : Tween.Easing.Sinusoidal.InOut,
                startValue : {
                    time: 0.0
                },
                stopValue : {
                    time : 1.0
                },
                onUpdate : function(value) {
                    scene.camera.position.x = CesiumMath.lerp(startPosition.x, endPosition.x, value.time);
                    scene.camera.position.y = CesiumMath.lerp(startPosition.y, endPosition.y, value.time);
                    scene.camera.position.z = CesiumMath.lerp(startPosition.z, endPosition.z, value.time);
                },
                onComplete : function() {
                    controller.enableInputs = true;
                },
                onCancel: function() {
                    controller.enableInputs = true;
                }
            });
        }
    }
    else {
        camera.moveForward(camera.getMagnitude() * distFactor);
    }
}

function zoomIn(scene, pos) { zoomCamera(scene, 2.0/3.0, pos); };
function zoomOut(scene, pos) { zoomCamera(scene, -2.0, pos); };

module.exports = NavigationWidget;
