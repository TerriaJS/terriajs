/*
 *   A collection of additional viewer functionality independent
 *   of datasets
 */

//"use strict";

var BingMapsApi = Cesium.BingMapsApi;
var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var Cartographic = Cesium.Cartographic;
var CesiumTerrainProvider = Cesium.CesiumTerrainProvider;
var ClockRange = Cesium.ClockRange;
var Color = Cesium.Color;
var combine = Cesium.combine;
var defined = Cesium.defined;
var Ellipsoid = Cesium.Ellipsoid;
var EllipsoidTerrainProvider = Cesium.EllipsoidTerrainProvider;
var Fullscreen = Cesium.Fullscreen;
var KeyboardEventModifier = Cesium.KeyboardEventModifier;
var loadJson = Cesium.loadJson;
var CesiumMath = Cesium.Math;
var Rectangle = Cesium.Rectangle;
var sampleTerrain = Cesium.sampleTerrain;
var ScreenSpaceEventHandler = Cesium.ScreenSpaceEventHandler;
var ScreenSpaceEventType = Cesium.ScreenSpaceEventType;
var BingMapsImageryProvider = Cesium.BingMapsImageryProvider;
var BingMapsStyle = Cesium.BingMapsStyle;
var CameraFlightPath = Cesium.CameraFlightPath;
var PolylineCollection = Cesium.PolylineCollection;
var RectanglePrimitive = Cesium.RectanglePrimitive;
var SceneMode = Cesium.SceneMode;
var Material = Cesium.Material;
var when = Cesium.when;
var Viewer = Cesium.Viewer;
var defaultValue = Cesium.defaultValue;
var Tween = Cesium.Tween;
var Transforms = Cesium.Transforms;
var Matrix3 = Cesium.Matrix3;
var Matrix4 = Cesium.Matrix4;

var knockout = require('knockout');
var komapping = require('knockout.mapping');
var knockoutES5 = require('../../public/third_party/knockout-es5.js');

var GeoDataBrowser = require('./GeoDataBrowser');
var GeoDataWidget = require('./GeoDataWidget');
var TitleWidget = require('./TitleWidget');
var NavigationWidget = require('./NavigationWidget');
var SearchWidget = require('./SearchWidget');

//use our own bing maps key
BingMapsApi.defaultKey = 'Aowa32_DmAxInFM948JlflrBYsiqRIm-SqH1-zp8Btp4Bk-9K6gMKkpUNbPnrSsk';

//Initialize the selected viewer - Cesium or Leaflet
var AusGlobeViewer = function(geoDataManager) {

    this.geoDataManager = geoDataManager;

    var that = this;

    var titleWidget = new TitleWidget({
        container : document.body,
        menuItems : [
            {
                label : 'Map Information',
                uri : 'http://www.nicta.com.au',
                target : '_blank'
            },
            {
                label : 'Help',
                uri : 'http://www.nicta.com.au'
            },
            {
                label : 'Fullscreen',
                callback : function() {
                    Fullscreen.requestFullscreen(document.body);
                }
            },
            {
                label : 'Share',
                uri : 'http://www.nicta.com.au',
                callback : function() {
                    if (that.scene) {
                        that.geoDataManager.shareRequest = true;
                    }
                    else {
                        that.geoDataManager.setShareRequest({});
                    }
                }
            }
        ]
    });

    this._titleWidget = titleWidget;

    this._navigationWidget = new NavigationWidget(this, document.body);

    this._searchWidget = new SearchWidget({
        container : document.body,
        viewer : this
    });

//    var div = document.createElement('div');
//    div.id = 'controls';
//    div.innerHTML = '\
//            <span id="zoom_in" class="control_button" title="Zoom in"></span> \
//            <span id="zoom_out" class="control_button" title="Zoom out"></span>';
//    document.body.appendChild(div);

//    div = document.createElement('div');
//    div.id = 'settings';
//    div.innerHTML = '<span id="settings" class="settings_button" title="Display Settings"></span>';
//    document.body.appendChild(div);

//    div = document.createElement('div');
//    div.id = 'dialogSettings';
//    div.class = "dialog";
//    div.innerHTML = '<div id="list4" class="list"></div>';
//    document.body.appendChild(div);

    var div = document.createElement('div');
    div.id = 'position';
    document.body.appendChild(div);

    div = document.createElement('div');
    div.id = 'legend';
    div.style.visibility = "hidden";
    div.innerHTML += '\
            <table> \
                <td><canvas id="legendCanvas" width="32" height="128"></canvas></td> \
                <td> <table> \
                    <tr height="64"><td id="lgd_max_val" valign="top"></td></tr> \
                    <tr height="64"><td id="lgd_min_val" valign="bottom"></td></tr> \
                    </table> \
                </td> \
            </table>';
    document.body.appendChild(div);

    var leftArea = document.createElement('div');
    leftArea.className = 'ausglobe-left-area';
    document.body.appendChild(leftArea);

//    $("#zoom_in").button({
//        text: true,
//        icons: { primary: "ui-icon-plus" }
//    });
//    $("#zoom_out").button({
//        text: true,
//        icons: { primary: "ui-icon-minus" }
//    });
//    $("settings_button").button({
//        text: true,
//        icons: { primary: "ui-icon-gear" }
//    }).css(css);

    var that = this;
//    $("#settings").click(function () {
//        that._showSettingsDialog();
//    });
//    $("#zoom_in").click(function () {
//        zoomIn(that.scene);
//    });
//    $("#zoom_out").click(function () {
//        zoomOut(that.scene);
//    });

    //TODO: perf test to set environment

    var that = this;
    this.geoDataWidget = new GeoDataWidget(geoDataManager, function (layer) { setCurrentDataset(layer, that); });
    this.scene = undefined;
    this.viewer = undefined;
    this.map = undefined;

    var categoryMapping = {
        Layer : {
            create : function(options) {
                var parent = komapping.toJS(options.parent);
                var data = combine(options.data, parent);

                var layerViewModel = komapping.fromJS(data, categoryMapping);
                layerViewModel.isEnabled = knockout.observable(false);

                return layerViewModel;
            }
        }
    };

    var browserContentMapping = {
        Layer : {
            create : function(options) {
                var layerViewModel = komapping.fromJS(options.data, categoryMapping);
                layerViewModel.isOpen = knockout.observable(false);
                layerViewModel.isLoading = knockout.observable(false);

                if (!defined(layerViewModel.Layer)) {
                    var layer = undefined;
                    var layerRequested = false;
                    var version = knockout.observable(0);

                    layerViewModel.Layer = knockout.computed(function() {
                        version();

                        if (layerRequested) {
                            return layer;
                        }

                        if (!defined(layer)) {
                            layer = [];
                        }

                        // Don't request capabilities until the layer is opened.
                        if (layerViewModel.isOpen()) {
                            layerViewModel.isLoading(true);
                            that.geoDataManager.getCapabilities(options.data, function(description) {
                                var remapped = komapping.fromJS(description, categoryMapping);

                                var layers = remapped.Layer();
                                for (var i = 0; i < layers.length; ++i) {
                                    // TODO: handle hierarchy better
                                    if (defined(layers[i].Layer)) {
                                        var subLayers = layers[i].Layer();
                                        for (var j = 0; j < subLayers.length; ++j) {
                                            layer.push(subLayers[j]);
                                        }
                                    } else {
                                        layer.push(layers[i]);
                                    }
                                }

                                version(version() + 1);
                                layerViewModel.isLoading(false);
                            });

                            layerRequested = true;
                        }

                        return layer;
                    });
                }

                return layerViewModel;
            }
        }
    };

    var browserContentViewModel = komapping.fromJS([], browserContentMapping);

    var dataCollectionsPromise = loadJson('./data_collection.json');
    var otherSourcesPromise = loadJson('./data_sources.json');

    when.all([dataCollectionsPromise, otherSourcesPromise], function(sources) {
        var browserContent = [];
        browserContent.push(sources[0]);

        var otherSources = sources[1].Layer;
        for (var i = 0; i < otherSources.length; ++i) {
            browserContent.push(otherSources[i]);
        }

        komapping.fromJS(browserContent, browserContentMapping, browserContentViewModel);
    });

    this.geoDataBrowser = new GeoDataBrowser({
        viewer : this,
        container : leftArea,
        content : browserContentViewModel,
        dataManager : geoDataManager
    });

    this.webGlSupported = supportsWebgl();

    this.selectViewer(this.webGlSupported);

    // simple way to capture most ux redraw needs - catch all canvas clicks
    $(document).click(function() {
        if (that.frameChecker !== undefined) {
            that.frameChecker.forceFrameUpdate();
        }
    });

}

// -------------------------------------------
// Text Formatting
// -------------------------------------------
function cartographicToDegreeString(scene, cartographic) {
    var strNS = cartographic.latitude < 0 ? 'S' : 'N';
    var strWE = cartographic.longitude < 0 ? 'W' : 'E';
    var text = 'Lat: ' + Math.abs(CesiumMath.toDegrees(cartographic.latitude)).toFixed(3) + '&deg; ' + strNS +
        ' | Lon: ' + Math.abs(CesiumMath.toDegrees(cartographic.longitude)).toFixed(3) + '&deg; ' + strWE;
    return text;
}

function cartesianToDegreeString(scene, cartesian) {
    var globe = scene.globe;
    var ellipsoid = globe.ellipsoid;
    var cartographic = ellipsoid.cartesianToCartographic(cartesian);
    return cartographicToDegreeString(scene, cartographic);
}

function rectangleToDegreeString(scene, rect) {
    var nw = new Cartographic(rect.west, rect.north);
    var se = new Cartographic(rect.east, rect.south);
    var text = 'NW: ' + cartographicToDegreeString(scene, nw);
    text += ', SE: ' + cartographicToDegreeString(scene, se);
    return text;
}

// -------------------------------------------
// Camera management
// -------------------------------------------
function getCameraPos(scene) {
    var ellipsoid = Ellipsoid.WGS84;
    var cam_pos = scene.camera.position;
    return ellipsoid.cartesianToCartographic(cam_pos);
}

//determine the distance from the camera to a point
function getCameraDistance(scene, pos) {
    var tx_pos = Ellipsoid.WGS84.cartographicToCartesian(
        Cartographic.fromDegrees(pos[0], pos[1], pos[2]));
    return Cartesian3.magnitude(Cartesian3.subtract(tx_pos, scene.camera.position));
};


function getCameraSeaLevel(scene) {
    var ellipsoid = Ellipsoid.WGS84;
    var cam_pos = scene.camera.position;
    return ellipsoid.cartesianToCartographic(ellipsoid.scaleToGeodeticSurface(cam_pos));
}


function getCameraHeight(scene) {
    var ellipsoid = Ellipsoid.WGS84;
    var cam_pos = scene.camera.position;
    var camPos = getCameraPos(scene);
    var seaLevel = getCameraSeaLevel(scene);
    return camPos.height - seaLevel.height;
}

//Camera extent approx for 2D viewer
function getCameraFocus(scene) {
    //HACK to get current camera focus
    var pos = Cartesian2.fromArray([$(document).width()/2,$(document).height()/2]);
    var focus = scene.camera.pickEllipsoid(pos, Ellipsoid.WGS84);
    return focus;
}
//Approximate camera extent approx for 2D viewer
function getCameraRect(scene) {
    var focus = getCameraFocus(scene);
    var focus_cart = Ellipsoid.WGS84.cartesianToCartographic(focus);
    var lat = CesiumMath.toDegrees(focus_cart.latitude);
    var lon = CesiumMath.toDegrees(focus_cart.longitude);

    var dist = Cartesian3.magnitude(Cartesian3.subtract(focus, scene.camera.position));
    var offset = dist * 5e-6;

    var rect = Rectangle.fromDegrees(lon-offset, lat-offset, lon+offset, lat+offset);
    return rect;
}

//A very simple camera height checker.
//TODO: need to create a new camera controller to do this properly
function checkCameraHeight(scene) {
    //check camera below 6000 m start checking against surface
    if (getCameraHeight(scene) >= 6000) {
        return;
    }
    var terrainPos = [getCameraPos(scene)];
    when(sampleTerrain(scene.globe.terrainProvider, 5, terrainPos), function() {
        terrainPos[0].height += 100;
        if (getCameraHeight(scene) < terrainPos[0].height) {
            var curCamPos = getCameraPos(scene);
            curCamPos.height = terrainPos[0].height;
            scene.camera.position = Ellipsoid.WGS84.cartographicToCartesian(curCamPos);
        }
    });
}

//TODO: need to make this animate
function zoomCamera(scene, distFactor, pos) {
    var camera = scene.camera;
    //for now
    if (scene.mode === SceneMode.SCENE3D) {
        var cartesian;
        if (pos === undefined) {
            cartesian = getCameraFocus(scene);
            if (cartesian) {
                var direction = Cartesian3.subtract(cartesian, camera.position);
                var movementVector = Cartesian3.multiplyByScalar(direction, distFactor);
                var endPosition = Cartesian3.add(camera.position, movementVector);

                flyToPosition(scene, endPosition);
            }
        }
        else {
            cartesian = camera.pickEllipsoid(pos, Ellipsoid.WGS84);
            if (cartesian) {
                // Zoom to the picked latitude/longitude, at a distFactor multiple
                // of the height.
                var targetCartographic = Ellipsoid.WGS84.cartesianToCartographic(cartesian);
                var cameraCartographic = Ellipsoid.WGS84.cartesianToCartographic(camera.position);
                targetCartographic.height = cameraCartographic.height - (cameraCartographic.height - targetCartographic.height) * distFactor;
                cartesian = Ellipsoid.WGS84.cartographicToCartesian(targetCartographic);
                flyToPosition(scene, cartesian);
            }
        }
    }
    else {
        camera.moveForward(camera.getMagnitude() * distFactor);
    }
}

function zoomIn(scene, pos) { zoomCamera(scene, 2.0/3.0, pos); };
function zoomOut(scene, pos) { zoomCamera(scene, -2.0, pos); };

function flyToPosition(scene, position, durationMilliseconds) {
    var camera = scene.camera;
    var startPosition = camera.position;
    var endPosition = position;
    var heading = camera.heading;
    var tilt = camera.tilt;

    durationMilliseconds = defaultValue(durationMilliseconds, 200);

    var initialEnuToFixed = Transforms.eastNorthUpToFixedFrame(startPosition, Ellipsoid.WGS84);
    var initialEnuToFixedRotation = Matrix4.getRotation(initialEnuToFixed);
    var initialFixedToEnuRotation = Matrix3.transpose(initialEnuToFixedRotation);

    var initialEnuUp = Matrix3.multiplyByVector(initialFixedToEnuRotation, camera.up);
    var initialEnuRight = Matrix3.multiplyByVector(initialFixedToEnuRotation, camera.right);
    var initialEnuDirection = Matrix3.multiplyByVector(initialFixedToEnuRotation, camera.direction);

    var controller = scene.screenSpaceCameraController;
    controller.enableInputs = false;

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

            var enuToFixed = Transforms.eastNorthUpToFixedFrame(camera.position, Ellipsoid.WGS84);
            var enuToFixedRotation = Matrix4.getRotation(enuToFixed);

            camera.up = Matrix3.multiplyByVector(enuToFixedRotation, initialEnuUp, camera.up);
            camera.right = Matrix3.multiplyByVector(enuToFixedRotation, initialEnuRight, camera.right);
            camera.direction = Matrix3.multiplyByVector(enuToFixedRotation, initialEnuDirection, camera.direction);
        },
        onComplete : function() {
            controller.enableInputs = true;
        },
        onCancel: function() {
            controller.enableInputs = true;
        }
    });
}

// Move camera to Rectangle
AusGlobeViewer.prototype.updateCameraFromRect = function(rect_in, flightTimeMilliseconds) {
    if (rect_in === undefined) {
        return;
    }

    var scene = this.scene;
    var map = this.map;

    //check that we're not too close
    var epsilon = CesiumMath.EPSILON3;
    var rect = rect_in.clone();
    if ((rect.east - rect.west) < epsilon) {
        rect.east += epsilon/2.0;
        rect.west -= epsilon/2.0;
    }
    if ((rect.north - rect.south) < epsilon) {
        rect.north += epsilon/2.0;
        rect.south -= epsilon/2.0;
    }
    if (scene !== undefined && !scene.isDestroyed()) {
        var flight = CameraFlightPath.createAnimationRectangle(scene, {
            destination : rect,
            duration: flightTimeMilliseconds
        });
        scene.animations.add(flight);
    }
    else if (map !== undefined) {
        var bnds = [[CesiumMath.toDegrees(rect.south), CesiumMath.toDegrees(rect.west)],
            [CesiumMath.toDegrees(rect.north), CesiumMath.toDegrees(rect.east)]];
        map.fitBounds(bnds);
    }
};


// -------------------------------------------
// PERF: skip frames where reasonable - global vars for now
// -------------------------------------------
var FrameChecker = function () {
    this._lastDate;
    this._lastCam;
    this._showFrame = true;
    this._maxFPS = 40.0;
    this.setFrameRate();
    this._skipCnt = 0;
    this._skipCntLim = 10.0; //start skip after 10 seconds
    this._skipCntMax = 15.0; //redraw every few seconds regardless
};

// Set the max frame rate
FrameChecker.prototype.setFrameRate = function (maxFPS) {
    if (maxFPS !== undefined) {
        this._maxFPS = maxFPS;
    }
    var that = this;
    setInterval(function() { that._showFrame = true; }, 1000/that._maxFPS);
}

// call to force draw - usually after long downloads/processes
FrameChecker.prototype.forceFrameUpdate = function() {
    this._skipCnt = 0;
}

// see if we can skip the draw on this frame
FrameChecker.prototype.skipFrame = function(scene, date) {
    //check if can show based on maxFPS
    if (this._showFrame === false) {
        return true;
    }
    this._showFrame = false;

    //check if anything actually changed
    if (this._lastDate) {
        var bDateSame = this._lastDate.equals(date);
        var bCamSame = this._lastCam.equalsEpsilon(scene.camera.viewMatrix, CesiumMath.EPSILON5);
        if (bDateSame && bCamSame) {
            this._skipCnt++;
        }
        else {
            this._skipCnt = 0;
            if (!bCamSame) {
                checkCameraHeight(scene);
            }
        }
    }

    if (this._skipCnt > (this._maxFPS * this._skipCntLim)) {
        this._skipCntLim = 5.0; //then skip after every 5 seconds
        if (this._skipCnt < (this._maxFPS * this._skipCntMax)) {
            return true;
        }
        this._skipCnt = (this._maxFPS * this._skipCntLim);
    }

    this._lastDate = date.clone();
    this._lastCam = scene.camera.viewMatrix.clone();
    return false;
}

// -------------------------------------------
// DrawExtentHelper from the cesium sample code
//  modified to always be available on shift-click
// -------------------------------------------
var DrawExtentHelper = function (scene, handler) {
    this._canvas = scene.canvas;
    this._scene = scene;
    this._ellipsoid = scene.globe.ellipsoid;
    this._finishHandler = handler;
    this._mouseHandler = new ScreenSpaceEventHandler(this._canvas);
    this._extentPrimitive = new RectanglePrimitive();
    this._extentPrimitive.asynchronous = false;
    this._scene.primitives.add(this._extentPrimitive);
    this.active = false;
};

DrawExtentHelper.prototype.enableInput = function () {
    var controller = this._scene.screenSpaceCameraController;
    controller.enableInputs = true;
};

DrawExtentHelper.prototype.disableInput = function () {
    var controller = this._scene.screenSpaceCameraController;
    controller.enableInputs = false;
};

DrawExtentHelper.prototype.getExtent = function (mn, mx) {
    var e = new Rectangle();

    // Re-order so west < east and south < north
    e.west = Math.min(mn.longitude, mx.longitude);
    e.east = Math.max(mn.longitude, mx.longitude);
    e.south = Math.min(mn.latitude, mx.latitude);
    e.north = Math.max(mn.latitude, mx.latitude);

    // Check for approx equal (shouldn't require abs due to re-order)
    var epsilon = CesiumMath.EPSILON6;

    if (Math.abs(e.east - e.west) < epsilon) {
        e.east += epsilon * 2.0;
        return;
    }

    if (Math.abs(e.north - e.south) < epsilon) {
        e.north += epsilon * 2.0;
        return;
    }
    return e;
};

DrawExtentHelper.prototype.setPolyPts = function (mn, mx) {
    var e = this.getExtent(mn, mx);
    if (e) {
        this._extentPrimitive.rectangle = e;
    }
};

DrawExtentHelper.prototype.setToDegrees = function (w, s, e, n) {
    var toRad = CesiumMath.toRadians;
    var mn = new Cartographic(toRad(w), toRad(s));
    var mx = new Cartographic(toRad(e), toRad(n));
    this.setPolyPts(mn, mx);
};

DrawExtentHelper.prototype.handleRegionStop = function (movement) {
    this.enableInput();
    var ext;
    if (movement) {
        var cartesian = this._scene.camera.pickEllipsoid(movement.position,
            this._ellipsoid);
        if (cartesian) {
            this._click2 = this._ellipsoid.cartesianToCartographic(cartesian);
        }
        ext = this.getExtent(this._click1, this._click2);
    }
    this._extentPrimitive.show = false;
    this.active = false;
    this._finishHandler(ext);
};

DrawExtentHelper.prototype.handleRegionInter = function (movement) {
    var cartesian = this._scene.camera.pickEllipsoid(movement.endPosition,
        this._ellipsoid);
    if (cartesian) {
        var cartographic = this._ellipsoid.cartesianToCartographic(cartesian);
        this.setPolyPts(this._click1, cartographic);
    }
};

DrawExtentHelper.prototype.handleRegionStart = function (movement) {
    var cartesian = this._scene.camera.pickEllipsoid(movement.position,
        this._ellipsoid);
    if (cartesian) {
        this.disableInput();
        this.active = true;
        this._extentPrimitive.show = true;
        var that = this;
        this._click1 = this._ellipsoid.cartesianToCartographic(cartesian);
        this._mouseHandler.setInputAction(function (movement) {
            that.handleRegionStop(movement);
        }, ScreenSpaceEventType.LEFT_UP, KeyboardEventModifier.SHIFT);
        this._mouseHandler.setInputAction(function (movement) {
            that.handleRegionInter(movement);
        }, ScreenSpaceEventType.MOUSE_MOVE, KeyboardEventModifier.SHIFT);
    }
};


DrawExtentHelper.prototype.start = function () {

    var that = this;

    // Now wait for start
    this._mouseHandler.setInputAction(function (movement) {
        that.handleRegionStart(movement);
    }, ScreenSpaceEventType.LEFT_DOWN, KeyboardEventModifier.SHIFT);
};

DrawExtentHelper.prototype.destroy = function () {
    this._scene.primitives.remove(this._extentPrimitive);
}


// -------------------------------------------
// Region Selection
// -------------------------------------------
AusGlobeViewer.prototype._enableSelectExtent = function(bActive) {
    if (bActive) {
        this.regionPolylines = new PolylineCollection();
        this.scene.primitives.add(this.regionPolylines);
        var that = this;
        this.regionSelect = new DrawExtentHelper(this.scene, function (ext) {
            if (that.regionPolylines.get(0)) {
                that.regionPolylines.remove(that.regionPolylines.get(0));
            }
            that.geoDataWidget.setExtent(ext);
            if (ext) {
                that.updateCameraFromRect(ext, 1000);
                // Display polyline based on ext
                var east = ext.east, west = ext.west, north = ext.north, south = ext.south;
                var ellipsoid = Ellipsoid.WGS84;
                that.regionPolylines.add({
                    positions : ellipsoid.cartographicArrayToCartesianArray(
                        [
                            new Cartographic(west, south),
                            new Cartographic(west, north),
                            new Cartographic(east, north),
                            new Cartographic(east, south),
                            new Cartographic(west, south)
                        ]),
                    width: 3.0,
                    material : Material.fromType('Color', {
                        color : new Color(0.8, 0.8, 0.0, 0.5)
                    })
                });
            }
        });
        this.regionSelect.start();
    }
    else {
        this.scene.primitives.remove(this.regionPolylines);
        this.regionSelect.destroy();
    }
}

// -------------------------------------------
// Update the data legend
// -------------------------------------------
var updateLegend = function(datavis) {
    if (datavis === undefined) {
        document.getElementById('legend').style.visibility = 'hidden';
        return;
    }

    document.getElementById('legend').style.visibility = 'visible';
    var legend_canvas = $('#legendCanvas')[0];
    var ctx = legend_canvas.getContext('2d');
    ctx.translate(ctx.canvas.width, ctx.canvas.height);
    ctx.rotate(180 * Math.PI / 180);
    datavis.createGradient(ctx);
    ctx.restore();

    var val;
    var min_text = (val = datavis.dataset.getMinVal()) === undefined ? 'undefined' : val.toString();
    var max_text = (val = datavis.dataset.getMaxVal()) === undefined ? 'undefined' : val.toString();
    document.getElementById('lgd_min_val').innerHTML = min_text;
    document.getElementById('lgd_max_val').innerHTML = max_text;
}


//------------------------------------
// Timeline display on selection
//------------------------------------
function showTimeline(viewer) {
    viewer.timeline.show = true;
    viewer.animation.show = true;
}

function hideTimeline(viewer) {
    if (defined(viewer)) {
        viewer.timeline.show = false;
        viewer.animation.show = false;
    }
}

function stopTimeline(viewer) {
    if (defined(viewer)) {
        hideTimeline(viewer);
        viewer.clock.clockRange = ClockRange.UNBOUNDED;
        viewer.clock.shouldAnimate = false;
    }
}

//update the timeline
function updateTimeline(viewer, start, finish) {
    if (start === undefined || finish === undefined) {
        stopTimeline(viewer);
        return;
    }
    showTimeline(viewer);
    //update clock
    if (viewer !== undefined) {
        var clock = viewer.clock;
        clock.startTime = start;
        clock.currentTime = start;
        clock.stopTime = finish;
        clock.multiplier = start.getSecondsDifference(finish) / 60.0;
        clock.clockRange = ClockRange.LOOP_STOP;
        clock.shouldAnimate = true;
        viewer.timeline.zoomTo(clock.startTime, clock.stopTime);
    }
}

//update menu and camera
var setCurrentDataset = function(layer, that) {
    //remove case
    if (layer === undefined) {
        updateTimeline(that.viewer);
        updateLegend();
        return;
    }
    //table info
    var tableData, start, finish;
    if (layer.dataSource !== undefined && layer.dataSource.dataset !== undefined) {
        tableData = layer.dataSource;
        if (that._cesiumViewerActive()) {
            start = tableData.dataset.getMinTime();
            finish = tableData.dataset.getMaxTime();
        }
    }
    updateTimeline(that.viewer, start, finish);
    updateLegend(tableData);
}


// Settings dialog
AusGlobeViewer.prototype._showSettingsDialog = function() {

    $("#dialogSettings").dialog({
        title: 'Settings',
        width: 250,
        height: 250,
        modal: false
    });

    var list = $('#list4');
    list.selectable({
        selected: function (event, ui) {
            var item = $('#list4 .ui-selected');
        }
    });
    list.html('');

    var that = this;

    var settings = [
        {
            text: '3D',
            getState: function() { return that._cesiumViewerActive(); },
            setState: function(val) { that.selectViewer(val); }
        },
        {
            text: 'Water Mask',
            getState: function() { return true; },
            setState: function(val) { alert('NYI'); }
        }

    ];
    for (var i = 0; i < settings.length; i++) {
        var state = settings[i].getState() ? 'checked' : 'unchecked';
        list.append('<input type="checkbox" name="' + settings[i].text + '" id=' + i + ' '+ state +'><label for=' + i + ' id=' + i + '>' + settings[i].text + '</label><br>');
    }
    //set state when clicked
    $('#dialogSettings :checkbox').click(function() {
        var $this = $(this);
        var id = $this[0].id;
        settings[id].setState($this.is(':checked'));
    });
}

AusGlobeViewer.prototype._cesiumViewerActive = function() { return (this.viewer !== undefined); };

AusGlobeViewer.prototype._createCesiumViewer = function(container) {

    var options = {
        homeButton: false,
        sceneModePicker: false,
        navigationInstructionsInitiallyVisible: false,
        geocoder: false,
        baseLayerPicker: false,
        navigationHelpButton: false,
        fullscreenButton : false,
        imageryProvider : new BingMapsImageryProvider({
            url : '//dev.virtualearth.net',
            mapStyle : BingMapsStyle.AERIAL_WITH_LABELS
        }),
        terrainProvider : new CesiumTerrainProvider({
            url : '//cesiumjs.org/stk-terrain/tilesets/world/tiles'
        })
    };

    //create CesiumViewer
    var viewer = new Viewer(container, options);

    var scene = viewer.scene;
    var canvas = scene.canvas;
    var globe = scene.globe;
    var ellipsoid = globe.ellipsoid;
    var camera = scene.camera;

    globe.depthTestAgainstTerrain = false


    //TODO: replace cesium & bing icon with hightlighted text like leaflet to reduce footprint
//        var creditDisplay = scene.frameState.creditDisplay;
//        var cesiumCredit = new Credit('Cesium', '', 'http://cesiumjs.org/');
//        creditDisplay.addDefaultCredit(cesiumCredit);

    //TODO: set based on platform
//        globe.tileCacheSize *= 2;

    // Add double click zoom
    var that = this;
    this.mouseZoomHandler = new ScreenSpaceEventHandler(canvas);
    this.mouseZoomHandler.setInputAction(
        function (movement) {
            zoomIn(that.scene, movement.position);
        },
        ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    this.mouseZoomHandler.setInputAction(
        function (movement) {
            zoomOut(that.scene, movement.position);
        },
        ScreenSpaceEventType.LEFT_DOUBLE_CLICK, KeyboardEventModifier.SHIFT);


    // Show mouse position and height if terrain on
    this.mouseOverPosHandler = new ScreenSpaceEventHandler(canvas);
    this.mouseOverPosHandler.setInputAction( function (movement) {
        var terrainProvider = scene.globe.terrainProvider;
        var cartesian = camera.pickEllipsoid(movement.endPosition, ellipsoid);
        if (cartesian) {
            if (terrainProvider instanceof EllipsoidTerrainProvider) {
                //flat earth
                document.getElementById('position').innerHTML = cartesianToDegreeString(scene, cartesian);
            }
            else {
                var cartographic = ellipsoid.cartesianToCartographic(cartesian);
                var terrainPos = [cartographic];
                function sampleTerrainSuccess() {
                    var text = cartesianToDegreeString(scene, cartesian);
                    text += ' | Elev: ' + terrainPos[0].height.toFixed(1) + ' m';
                    document.getElementById('position').innerHTML = text;
                }
                //TODO: vary tile level based based on camera height
                var tileLevel = 5;
                try {
                    when(sampleTerrain(terrainProvider, tileLevel, terrainPos), sampleTerrainSuccess);
                } catch (e) {};
            }
        }
        else {
            document.getElementById('position').innerHTML = "";
        }
    }, ScreenSpaceEventType.MOUSE_MOVE);


    //Opening scene
    //TODO: based on perf test to see if we can do some animation at startup
    var e = new Cartesian3(-5696178.715241763, 5664619.403367736, -4108462.746194852);
    var v = new Cartesian3(0.6306011721197975, -0.6271116358860636, 0.45724518352430904);
    var u = new Cartesian3(-0.3415299812150222, 0.3048158142378301, 0.8890695080602443);
    camera.lookAt(e, Cartesian3.add(e,v), u);

    return viewer;
}


//Check for webgl support
function supportsWebgl() {
    //Check for webgl support and if not, then fall back to leaflet
    if (!window.WebGLRenderingContext) {
        // Browser has no idea what WebGL is. Suggest they
        // get a new browser by presenting the user with link to
        // http://get.webgl.org
        console.log('!!No WebGL support.');
        return false;
    }
    var canvas = document.createElement( 'canvas' );
    var gl = canvas.getContext("webgl");
    if (!gl) {
        // Browser could not initialize WebGL. User probably needs to
        // update their drivers or get a new browser. Present a link to
        // http://get.webgl.org/troubleshooting
        console.log('!!Unable to successfully create Webgl context.');
        return false;
    }
    return true;
}

AusGlobeViewer.prototype.isCesium = function() {
    return defined(this.viewer);
};

AusGlobeViewer.prototype.selectViewer = function(bCesium) {

    if (!bCesium) {

        //create leaflet viewer
        map = L.map('cesiumContainer', { zoomControl: false }).setView([-28.5, 135], 5);
        new L.Control.Zoom({ position: 'topright' }).addTo(map);

        map.on("boxzoomend", function(e) {
            console.log(e.boxZoomBounds);
        });

        if (this.viewer !== undefined) {
            var rect = getCameraRect(this.scene);
            var bnds = [[CesiumMath.toDegrees(rect.south), CesiumMath.toDegrees(rect.west)],
                [CesiumMath.toDegrees(rect.north), CesiumMath.toDegrees(rect.east)]];
            map.fitBounds(bnds);
        }

        //Bing Maps Layer by default
        var layer = new L.BingLayer('Aowa32_DmAxInFM948JlflrBYsiqRIm-SqH1-zp8Btp4Bk-9K6gMKkpUNbPnrSsk');
//            var layer = new L.esri.TiledMapLayer('http://www.ga.gov.au/gis/rest/services/topography/Australian_Topography_WM/MapServer');
        map.addLayer(layer);

        //document.getElementById('controls').style.visibility = 'hidden';
        this._navigationWidget.show = false;
        document.getElementById('position').style.visibility = 'hidden';

        //redisplay data
        this.map = map;
        this.geoDataManager.setViewer({scene: undefined, map: map});
        this.geoDataBrowser.viewModel.map = map;

        //shut down existing cesium
        if (this.viewer !== undefined) {
            this._enableSelectExtent(false);
            stopTimeline();

            this.mouseOverPosHandler.removeInputAction( ScreenSpaceEventType.MOUSE_MOVE );
            this.mouseZoomHandler.removeInputAction( ScreenSpaceEventType.LEFT_DOUBLE_CLICK );
            this.mouseZoomHandler.removeInputAction( ScreenSpaceEventType.LEFT_DOUBLE_CLICK, KeyboardEventModifier.SHIFT );

            this.scene.primitives.removeAll();
            this.viewer.destroy();
            this.viewer = undefined;
        }
        //TODO: set visualizer functions for GeoDataCollection

    }
    else {
        //create Cesium viewer
        this.viewer = this._createCesiumViewer('cesiumContainer');
        this.scene = this.viewer.scene;
        this.frameChecker = new FrameChecker();
        var that = this;

        // override the default render loop
        this.scene.base_render = this.scene.render;
        this.scene.render = function(date) {
            if (that.frameChecker.skipFrame(that.scene, date)) {
                return;
            }
            //render layers
            if (that.geoDataManager) {
                that.geoDataManager.update(date);
            }
            that.scene.base_render(date);

            //capture the scene image right after the render and make
            //call to the GeoDataManager which saves scene data, which sets an event
            // which is picked up by the GeoDataWidget to launch the share dialog
            //TODO: need leaflet version - use extent for camera and placeholder image
            if (that.geoDataManager.shareRequest === true) {
                var dataUrl = that.scene.canvas.toDataURL("image/jpeg");
                that.geoDataManager.setShareRequest({
                    image: dataUrl,
                    camera: that.scene.camera
                });
            }
        };


        if (this.map !== undefined) {
            var bnds = this.map.getBounds()
            var rect = Rectangle.fromDegrees(bnds.getWest(), bnds.getSouth(), bnds.getEast(), bnds.getNorth());

            //remove existing map viewer
            this.map.remove();
            this.map = undefined;

            this.updateCameraFromRect(rect, 0);
        }

        this.geoDataManager.setViewer({scene: this.scene, map: undefined});
        this.geoDataBrowser.viewModel.map = undefined;

        this._enableSelectExtent(true);
        stopTimeline(this.viewer);

        this._navigationWidget.show = true;
        document.getElementById('position').style.visibility = 'visible';
        /*
         var esri = new ArcGisMapServerImageryProvider({
         url: 'http://www.ga.gov.au/gis/rest/services/topography/Australian_Topography/MapServer',
         proxy: new DefaultProxy('/proxy/')
         });
         this.scene.globe.imageryLayers.addImageryProvider(esri);
         */
    }
};

module.exports = AusGlobeViewer;
