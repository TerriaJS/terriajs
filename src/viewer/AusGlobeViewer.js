/*
 *   A collection of additional viewer functionality independent
 *   of datasets
 */

"use strict";

/*global require,Cesium,L,$,XMLDocument,html2canvas,alert,console*/
var BingMapsApi = Cesium.BingMapsApi;
var BingMapsImageryProvider = Cesium.BingMapsImageryProvider;
var BingMapsStyle = Cesium.BingMapsStyle;
var CameraFlightPath = Cesium.CameraFlightPath;
var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var Cartographic = Cesium.Cartographic;
var CesiumMath = Cesium.Math;
var CesiumTerrainProvider = Cesium.CesiumTerrainProvider;
var ClockRange = Cesium.ClockRange;
var Color = Cesium.Color;
var combine = Cesium.combine;
var Credit = Cesium.Credit;
var DataSourceCollection = Cesium.DataSourceCollection;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DynamicObject = Cesium.DynamicObject;
var Ellipsoid = Cesium.Ellipsoid;
var EllipsoidTerrainProvider = Cesium.EllipsoidTerrainProvider;
var Fullscreen = Cesium.Fullscreen;
var JulianDate = Cesium.JulianDate;
var KeyboardEventModifier = Cesium.KeyboardEventModifier;
var loadJson = Cesium.loadJson;
var Material = Cesium.Material;
var Matrix3 = Cesium.Matrix3;
var Matrix4 = Cesium.Matrix4;
var PolylineCollection = Cesium.PolylineCollection;
var Rectangle = Cesium.Rectangle;
var Rectangle = Cesium.Rectangle;
var RectanglePrimitive = Cesium.RectanglePrimitive;
var sampleTerrain = Cesium.sampleTerrain;
var SceneMode = Cesium.SceneMode;
var ScreenSpaceEventHandler = Cesium.ScreenSpaceEventHandler;
var ScreenSpaceEventType = Cesium.ScreenSpaceEventType;
var Transforms = Cesium.Transforms;
var Tween = Cesium.Tween;
var Viewer = Cesium.Viewer;
var viewerDynamicObjectMixin = Cesium.viewerDynamicObjectMixin;
var WebMapServiceImageryProvider = Cesium.WebMapServiceImageryProvider;
var when = Cesium.when;

var knockout = require('knockout');
var komapping = require('knockout.mapping');
var knockoutES5 = require('../../public/third_party/knockout-es5.js');

var corsProxy = require('../corsProxy');
var GeoDataBrowser = require('./GeoDataBrowser');
var GeoDataWidget = require('./GeoDataWidget');
var readJson = require('../readJson');
var NavigationWidget = require('./NavigationWidget');
var PopupMessage = require('./PopupMessage');
var SearchWidget = require('./SearchWidget');
var ServicesPanel = require('./ServicesPanel');
var SharePanel = require('./SharePanel');
var TitleWidget = require('./TitleWidget');

//use our own bing maps key
BingMapsApi.defaultKey = 'Aowa32_DmAxInFM948JlflrBYsiqRIm-SqH1-zp8Btp4Bk-9K6gMKkpUNbPnrSsk';

//Initialize the selected viewer - Cesium or Leaflet
var AusGlobeViewer = function(geoDataManager) {

    this.geoDataManager = geoDataManager;

    var that = this;
    
    that.startup = true;
    this.captureCanvas = function() { console.log('capture call unset'); };
    this.captureCanvasCallback = function(dataUrl) { console.log('callback unset'); };

    var titleWidget = new TitleWidget({
        container : document.body,
        menuItems : [
            {
                svg : {
                    path : 'm 23.1253,20.9122 5.475,-6.675 H 25.0699 C 24.2257,9.0502 19.7377,5.0872 14.3125,5.0872 8.2855,5.0872 3.3997,9.973 3.3997,16 c 0,6.027 4.8858,10.9128 10.9128,10.9128 2.7456,0 5.2476,-1.0218 7.1658,-2.6958 l -2.487,-3.0042 c -1.2414,1.1154 -2.8782,1.8 -4.6794,1.8 -3.873,0 -7.0128,-3.1392 -7.0128,-7.0128 0,-3.8736 3.1392,-7.0128 7.0128,-7.0128 3.2628,0 5.9964,2.2314 6.7782,5.25 h -3.2904 l 5.3256,6.675 z',
                    width : 32,
                    height : 32
                },
                callback : function() {
                    window.history.go(0);
                }
            },
            {
                svg : {
                    path : 'M 30.1,5.5 H 1.9 C 1.2376,5.5 0.7,6.0376 0.7,6.7 v 18.6 c 0,0.6624 0.5376,1.2 1.2,1.2 h 28.2 c 0.6624,0 1.2,-0.5376 1.2,-1.2 V 6.7 c 0,-0.6624 -0.537,-1.2 -1.2,-1.2 z m -12,18 c 0,0.6624 -0.5376,1.2 -1.2,1.2 H 3.7 c -0.6624,0 -1.2,-0.5376 -1.2,-1.2 v -7.2 c 0,-0.6624 0.5376,-1.2 1.2,-1.2 h 13.2 c 0.6624,0 1.2,0.5376 1.2,1.2 v 7.2 z',
                    width : 32,
                    height : 32
                },
                callback : function() {
                    if (Fullscreen.fullscreen) {
                        Fullscreen.exitFullscreen();
                    } else {
                        Fullscreen.requestFullscreen(document.body);
                    }
                }
            },
            {  //This currently also houses print, but print could be moved here as well
                svg : {
                    path : 'm 22.6786,19.8535 c -0.8256,0 -1.5918,0.2514 -2.229,0.6822 l -7.1958,-4.1694 c 0.0198,-0.1638 0.0492,-0.3252 0.0492,-0.4944 0,-0.2934 -0.0366,-0.5778 -0.096,-0.8532 l 6.9978,-3.7554 c 0.6816,0.5442 1.5342,0.8844 2.4738,0.8844 2.199,0 3.9822,-1.7832 3.9822,-3.9822 0,-2.199 -1.7832,-3.9816 -3.9822,-3.9816 -2.199,0 -3.9816,1.7826 -3.9816,3.9816 0,0.1434 0.0276,0.279 0.042,0.4188 l -7.2198,3.9702 c -0.6306,-0.4182 -1.3854,-0.6648 -2.1978,-0.6648 -2.1996,0 -3.9822,1.7826 -3.9822,3.9822 0,2.1984 1.7826,3.9816 3.9822,3.9816 0.906,0 1.731,-0.3144 2.4,-0.8238 l 7.0398,4.1628 c -0.0342,0.2106 -0.0642,0.4224 -0.0642,0.642 0,2.199 1.7826,3.9816 3.9816,3.9816 2.199,0 3.9822,-1.7826 3.9822,-3.9816 -6e-4,-2.1984 -1.7832,-3.981 -3.9822,-3.981 z',
                    width : 32,
                    height : 32
                },
                callback : function() {
                    that.captureCanvasCallback = function (dataUrl) {
                        that.geoDataManager.setShareRequest({
                            image: dataUrl,
                            camera: getCameraRect(that.scene, that.map)
                        });
                    };
                    that.captureCanvas();
                }
            },
            {
                svg : {
                    path : 'M26.33,15.836l-3.893-1.545l3.136-7.9c0.28-0.705-0.064-1.505-0.771-1.785c-0.707-0.28-1.506,0.065-1.785,0.771l-3.136,7.9l-4.88-1.937l3.135-7.9c0.281-0.706-0.064-1.506-0.77-1.786c-0.706-0.279-1.506,0.065-1.785,0.771l-3.136,7.9L8.554,8.781l-1.614,4.066l2.15,0.854l-2.537,6.391c-0.61,1.54,0.143,3.283,1.683,3.895l1.626,0.646L8.985,26.84c-0.407,1.025,0.095,2.188,1.122,2.596l0.93,0.369c1.026,0.408,2.188-0.095,2.596-1.121l0.877-2.207l1.858,0.737c1.54,0.611,3.284-0.142,3.896-1.682l2.535-6.391l1.918,0.761L26.33,15.836z',
                    width : 32,
                    height : 32
                },
                callback : function() {
                    that.captureCanvasCallback = function (dataUrl) {
                        var request = that.geoDataManager.getShareRequest({
                            image: dataUrl,
                            camera: getCameraRect(that.scene, that.map)
                        });
                        var servicesPanel = new ServicesPanel({
                            request : request,
                            container : document.body,
                            geoDataManager : that.geoDataManager
                        });
                    };
                    that.captureCanvas();
                }
            },
            {
                svg : {
                    path : 'M 16,5.0002 C 9.925,5.0002 5.0002,9.925 5.0002,16 5.0002,22.075 9.925,26.9998 16,26.9998 22.075,26.9998 26.9998,22.075 26.9998,16 26.9998,9.9256 22.075,5.0002 16,5.0002 z m 1.7994,17.2002 h -3 v -7.8 h 3 v 7.8 z m -1.5996,-9.8496 c -0.897,0 -1.6248,-0.7272 -1.6248,-1.6248 0,-0.8976 0.7278,-1.6248 1.6248,-1.6248 0.8976,0 1.6254,0.7272 1.6254,1.6248 0,0.8976 -0.7278,1.6248 -1.6254,1.6248 z',
                    width : 32,
                    height : 32
                },
                uri : 'http://nicta.github.io/nationalmap/public/home.html',
                target : '_blank'
            },
            {
                svg : {
                    path : 'M 16,5.0002 C 9.925,5.0002 5.0002,9.925 5.0002,16 5.0002,22.075 9.925,26.9998 16,26.9998 22.075,26.9998 26.9998,22.075 26.9998,16 26.9998,9.9256 22.075,5.0002 16,5.0002 z m 0.1572,17.0004 c -0.7452,0 -1.35,-0.6042 -1.35,-1.35 0,-0.7458 0.6048,-1.35 1.35,-1.35 0.7458,0 1.3506,0.6042 1.3506,1.35 0,0.7458 -0.6048,1.35 -1.3506,1.35 z m 3.486,-7.4106 c -0.1302,0.3228 -0.291,0.5982 -0.4836,0.8268 -0.1926,0.2292 -0.4056,0.4242 -0.6396,0.585 -0.234,0.1614 -0.4548,0.3228 -0.6624,0.4836 -0.2088,0.1614 -0.4758,0.3456 -0.6372,0.5538 -0.162,0.2082 -0.3876,0.468 -0.3876,0.78 v 0.7812 h -1.8 V 17.71 c 0,-0.447 0.048,-0.8214 0.1872,-1.1232 0.1404,-0.3012 0.27,-0.5592 0.4572,-0.7722 0.1872,-0.213 0.3678,-0.3978 0.576,-0.5538 0.2082,-0.156 0.3912,-0.312 0.5682,-0.468 0.177,-0.156 0.315,-0.3276 0.4242,-0.5148 0.1092,-0.1872 0.1566,-0.4212 0.1464,-0.702 0,-0.4782 -0.1182,-0.8322 -0.3522,-1.0608 -0.234,-0.2286 -0.5598,-0.3432 -0.9756,-0.3432 -0.2808,0 -0.5232,0.0546 -0.726,0.1638 -0.2028,0.1092 -0.369,0.255 -0.4992,0.4368 -0.1302,0.1818 -0.2262,0.4956 -0.2886,0.7398 -0.0624,0.2442 -0.093,0.288 -0.093,0.888 h -2.2932 c 0.0102,-0.6 0.1068,-1.1766 0.2886,-1.6446 0.1818,-0.468 0.4368,-0.9234 0.7638,-1.2666 0.3276,-0.3432 0.723,-0.636 1.1862,-0.8286 0.4626,-0.192 0.9798,-0.3006 1.5522,-0.3006 0.738,0 1.3542,0.0948 1.8486,0.2976 0.4932,0.2028 0.891,0.4518 1.1928,0.7536 0.3018,0.3018 0.5172,0.6252 0.6474,0.9732 0.1302,0.348 0.195,0.6726 0.195,0.9744 -6e-4,0.4992 -0.0654,0.909 -0.1956,1.2312 z',
                    width : 32,
                    height : 32
                },
                uri : 'http://nicta.github.io/nationalmap/public/faq.html',
                target : '_blank'
            }
        ]
    });

    this._titleWidget = titleWidget;

    this._navigationWidget = new NavigationWidget(this, document.body);

    this._searchWidget = new SearchWidget({
        container : document.body,
        viewer : this
    });

    var legend = document.createElement('div');
    legend.id = 'legend';
//    div.className = 'legend';
    legend.style.visibility = "hidden";
    legend.innerHTML += '\
            <table> \
                <td><canvas id="legendCanvas" width="32" height="128"></canvas></td> \
                <td> <table> \
                    <tr height="64"><td id="lgd_max_val" valign="top"></td></tr> \
                    <tr height="64"><td id="lgd_min_val" valign="bottom"></td></tr> \
                    </table> \
                </td> \
            </table>';
    document.body.appendChild(legend);

    var leftArea = document.createElement('div');
    leftArea.className = 'ausglobe-left-area';
    document.body.appendChild(leftArea);

    //TODO: perf test to set environment

    this.geoDataWidget = new GeoDataWidget(geoDataManager, function (layer) { setCurrentDataset(layer, that); });
    this.scene = undefined;
    this.viewer = undefined;
    this.map = undefined;

    this.geoDataBrowser = new GeoDataBrowser({
        viewer : this,
        container : leftArea,
        dataManager : geoDataManager
    });

    this.webGlSupported = supportsWebgl();
    if (!this.webGlSupported) {
        var noWebGLMessage = new PopupMessage({
            container : document.body,
            title : 'WebGL not supported',
            message : '\
National Map works best with a web browser that supports <a href="http://get.webgl.com" target="_blank">WebGL</a>, including the \
latest versions of <a href="http://www.google.com/chrome" target="_blank">Google Chrome</a>, \
<a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>, and \
<a href="http://www.microsoft.com/ie" target="_blank">Microsoft Internet Explorer</a>. \
Your web browser does not appear to support WebGL, so you will see a degraded, \
2D-only experience.'
        });
    }

    this.selectViewer(this.webGlSupported);

    // simple way to capture most ux redraw needs - catch all canvas clicks
    $(document).click(function() {
        if (that.frameChecker !== undefined) {
            that.frameChecker.forceFrameUpdate();
        }
    });

    this.geoDataManager.loadInitialUrl(window.location);

    this.geoDataManager.ShareRequest.addEventListener(function(collection, request) {
        console.log('Share Request Event:');
        var sharePanel = new SharePanel({
            request : request,
            container : document.body,
            geoDataManager : that.geoDataManager
        });
    });

};



// -------------------------------------------
// PERF: skip frames where reasonable - global vars for now
// -------------------------------------------
var FrameChecker = function () {
    this._lastDate = undefined;
    this._lastCam = undefined;
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
};

// call to force draw - usually after long downloads/processes
FrameChecker.prototype.forceFrameUpdate = function() {
    this._skipCnt = 0;
};

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
};

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
};


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
};

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
};

AusGlobeViewer.prototype._cesiumViewerActive = function() { return (this.viewer !== undefined); };

AusGlobeViewer.prototype._createCesiumViewer = function(container) {

    var options = {
        dataSources : this.geoDataManager.dataSourceCollection,
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
        }),
        timeControlsInitiallyVisible : false
    };

    //create CesiumViewer
    var viewer = new Viewer(container, options);
    viewer.extend(viewerDynamicObjectMixin);

    var lastHeight = 0;
    viewer.scene.preRender.addEventListener(function(scene, time) {
        var container = viewer._container;
        var height = container.clientHeight;

        if (height !== lastHeight) {
            viewer.infoBox.viewModel.maxHeight = Math.max(height - 300, 100);
            lastHeight = height;
        }
    });


    var scene = viewer.scene;
    var canvas = scene.canvas;
    var globe = scene.globe;
    var ellipsoid = globe.ellipsoid;
    var camera = scene.camera;

    globe.depthTestAgainstTerrain = false;

    scene.frameState.creditDisplay.addDefaultCredit(new Credit('CESIUM', undefined, 'http://cesiumjs.org/'));
    scene.frameState.creditDisplay.addDefaultCredit(new Credit('BING', undefined, 'http://www.bing.com/'));

    //TODO: set based on platform
//        globe.tileCacheSize *= 2;

    var that = this;
    
    var inputHandler = viewer.screenSpaceEventHandler;

    // Add double click zoom
    inputHandler.setInputAction(
        function (movement) {
            zoomIn(that.scene, movement.position);
        },
        ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    inputHandler.setInputAction(
        function (movement) {
            zoomOut(that.scene, movement.position);
        },
        ScreenSpaceEventType.LEFT_DOUBLE_CLICK, KeyboardEventModifier.SHIFT);

    // Show mouse position and height if terrain on
    inputHandler.setInputAction( function (movement) {
        var terrainProvider = scene.globe.terrainProvider;
        var cartesian = camera.pickEllipsoid(movement.endPosition, ellipsoid);
        if (cartesian) {
            if (terrainProvider instanceof EllipsoidTerrainProvider) {
                //flat earth
                document.getElementById('ausglobe-title-middle').innerHTML = cartesianToDegreeString(scene, cartesian);
            }
            else {
                var cartographic = ellipsoid.cartesianToCartographic(cartesian);
                var terrainPos = [cartographic];
                
                //TODO: vary tile level based based on camera height
                var tileLevel = 5;
                try {
                    when(sampleTerrain(terrainProvider, tileLevel, terrainPos), function() {
                        if (scene.isDestroyed()) {
                            return;
                        }
                        var text = cartesianToDegreeString(scene, cartesian);
                        text += ' | Elev: ' + terrainPos[0].height.toFixed(1) + ' m';
                        document.getElementById('ausglobe-title-middle').innerHTML = text;
                    });
                } catch (e) {}
            }
        }
        else {
            document.getElementById('ausglobe-title-middle').innerHTML = "";
        }
    }, ScreenSpaceEventType.MOUSE_MOVE);

    // Attempt to pick WMS layers on left click.
    var extentScratch = new Rectangle();
    var oldClickAction = inputHandler.getInputAction(ScreenSpaceEventType.LEFT_CLICK);
    inputHandler.setInputAction(
        function(movement) {
            if (defined(oldClickAction)) {
                oldClickAction(movement);
            }

            // If something is already selected, don't try to pick WMS features.
            if (defined(that.viewer.selectedObject)) {
                return;
            }

            // Find the picked location on the globe.
            // TODO: this should take terrain into account.
            var pickedPosition = scene.camera.pickEllipsoid(movement.position, Ellipsoid.WGS84);
            var pickedLocation = Ellipsoid.WGS84.cartesianToCartographic(pickedPosition);

            // Find the terrain tile containing the picked location.
            var surface = that.viewer.scene.globe._surface;
            var pickedTile;

            for (var textureIndex = 0; !defined(pickedTile) && textureIndex < surface._tilesToRenderByTextureCount.length; ++textureIndex) {
                var tiles = surface._tilesToRenderByTextureCount[textureIndex];
                if (!defined(tiles)) {
                    continue;
                }

                for (var tileIndex = 0; !defined(pickedTile) && tileIndex < tiles.length; ++tileIndex) {
                    var tile = tiles[tileIndex];
                    if (Rectangle.contains(tile.rectangle, pickedLocation)) {
                        pickedTile = tile;
                    }
                }
            }

            if (!defined(pickedTile)) {
                return;
            }

            // GetFeatureInfo for all attached imagery tiles containing the pickedLocation.
            var tileExtent = pickedTile.rectangle;
            var imageryTiles = pickedTile.imagery;
            var extent = extentScratch;

            var promises = [];
            for (var i = 0; i < imageryTiles.length; ++i) {
                var terrainImagery = imageryTiles[i];
                var imagery = terrainImagery.readyImagery;
                if (!defined(imagery)) {
                    continue;
                }
                var provider = imagery.imageryLayer.imageryProvider;
                if (!(provider instanceof WebMapServiceImageryProvider)) {
                    continue;
                }

                extent.west = CesiumMath.lerp(tileExtent.west, tileExtent.east, terrainImagery.textureCoordinateRectangle.x);
                extent.south = CesiumMath.lerp(tileExtent.south, tileExtent.north, terrainImagery.textureCoordinateRectangle.y);
                extent.east = CesiumMath.lerp(tileExtent.west, tileExtent.east, terrainImagery.textureCoordinateRectangle.z);
                extent.north = CesiumMath.lerp(tileExtent.south, tileExtent.north, terrainImagery.textureCoordinateRectangle.w);

                if (Rectangle.contains(extent, pickedLocation)) {
                    var pixelX = 255.0 * (pickedLocation.longitude - extent.west) / (extent.east - extent.west) | 0;
                    var pixelY = 255.0 * (extent.north - pickedLocation.latitude) / (extent.north - extent.south) | 0;
                    promises.push(provider.getFeatureInfo(imagery.x, imagery.y, imagery.level, pixelX, pixelY));
                }
            }

            if (promises.length === 0) {
                return;
            }

            var nextPromiseIndex = 0;

            function waitForNextLayersResponse() {
                if (nextPromiseIndex >= promises.length) {
                    that.viewer.selectedObject = new DynamicObject('None');
                    that.viewer.selectedObject.description = {
                        getValue : function() {
                            return 'No features found.';
                        }
                    };
                    return;
                }

                when(promises[nextPromiseIndex++], function(result) {
                    function findGoodIdProperty(properties) {
                        for (var key in properties) {
                            if (properties.hasOwnProperty(key) && properties[key]) {
                                if (/name/i.test(key) || /title/i.test(key)) {
                                    return properties[key];
                                }
                            }
                        }

                        return undefined;
                    }

                    function describe(properties) {
                        var html = '<table class="cesium-geoJsonDataSourceTable">';
                        for ( var key in properties) {
                            if (properties.hasOwnProperty(key)) {
                                var value = properties[key];
                                if (defined(value)) {
                                    if (typeof value === 'object') {
                                        html += '<tr><td>' + key + '</td><td>' + describe(value) + '</td></tr>';
                                    } else {
                                        html += '<tr><td>' + key + '</td><td>' + value + '</td></tr>';
                                    }
                                }
                            }
                        }
                        html += '</table>';
                        return html;
                    }

                    // Handle MapInfo MXP.  This is ugly.
                    if (result instanceof XMLDocument) {
                        var json = $.xml2json(result);
                        if (json.FeatureCollection &&
                            json.FeatureCollection.FeatureMembers && 
                            json.FeatureCollection.FeatureMembers.Feature && 
                            json.FeatureCollection.FeatureMembers.Feature.Val) {

                            var properties = {};
                            result = {
                                features : [
                                    {
                                        properties : properties
                                    }
                                ]
                            };

                            var vals = json.FeatureCollection.FeatureMembers.Feature.Val;
                            for (var i = 0; i < vals.length; ++i) {
                                properties[vals[i].ref] = vals[i].text;
                            }
                        }
                    }

                    if (!defined(result) || !defined(result.features) || result.features.length === 0) {
                        waitForNextLayersResponse();
                        return;
                    }

                    // Show information for the first selected feature.
                    var feature = result.features[0];
                    if (defined(feature)) {
                        that.viewer.selectedObject = new DynamicObject(findGoodIdProperty(feature.properties));
                        var description = describe(feature.properties);
                        that.viewer.selectedObject.description = {
                            getValue : function() {
                                return description;
                            }
                        };
                    } else {
                        that.viewer.selectedObject = new DynamicObject('None');
                        that.viewer.selectedObject.description = {
                            getValue : function() {
                                return 'No features found.';
                            }
                        };
                    }
                }, function() {
                    waitForNextLayersResponse();
                });
            }

            waitForNextLayersResponse();

            // Add placeholder information to the infobox so the user knows something is happening.
            that.viewer.selectedObject = new DynamicObject('Loading...');
            that.viewer.selectedObject.description = {
                getValue : function() {
                    return 'Loading WMS feature information...';
                }
            };
        },
        ScreenSpaceEventType.LEFT_CLICK);


    //Opening scene
    //TODO: based on perf test to see if we can do some animation at startup
    var e = new Cartesian3(-5696178.715241763, 5664619.403367736, -4108462.746194852);
    var v = new Cartesian3(0.6306011721197975, -0.6271116358860636, 0.45724518352430904);
    var u = new Cartesian3(-0.3415299812150222, 0.3048158142378301, 0.8890695080602443);
    var target = new Cartesian3();
    camera.lookAt(e, Cartesian3.add(e,v,target), u);

    return viewer;
};

AusGlobeViewer.prototype.isCesium = function() {
    return defined(this.viewer);
};

AusGlobeViewer.prototype.selectViewer = function(bCesium) {
    var bnds;
    var rect;

    if (!bCesium) {

        //create leaflet viewer
        var map = L.map('cesiumContainer', {
            zoomControl: false
        }).setView([-28.5, 135], 5);

        map.on("boxzoomend", function(e) {
            console.log(e.boxZoomBounds);
        });

        if (this.viewer !== undefined) {
            rect = getCameraRect(this.scene);
            bnds = [[CesiumMath.toDegrees(rect.south), CesiumMath.toDegrees(rect.west)],
                [CesiumMath.toDegrees(rect.north), CesiumMath.toDegrees(rect.east)]];
            map.fitBounds(bnds);
        }

        //Bing Maps Layer by default
        var layer = new L.BingLayer('Aowa32_DmAxInFM948JlflrBYsiqRIm-SqH1-zp8Btp4Bk-9K6gMKkpUNbPnrSsk');
//            var layer = new L.esri.TiledMapLayer('http://www.ga.gov.au/gis/rest/services/topography/Australian_Topography_WM/MapServer');
        map.addLayer(layer);

        //document.getElementById('controls').style.visibility = 'hidden';
        this._navigationWidget.showTilt = false;
        document.getElementById('ausglobe-title-middle').style.visibility = 'hidden';

        //redisplay data
        this.map = map;
        this.geoDataManager.setViewer({scene: undefined, map: map});
        this.geoDataBrowser.viewModel.map = map;

        this.captureCanvas = function() {
            var that = this;
            if (that.startup) {
                that.startup = false;
                alert('There are known problems capturing images with some datasets in 2D view.  Please use 3D mode if possible for this operation.');
            }
            that.map.attributionControl.removeFrom(that.map);
/*            //might need to break out to global function and deal with err
            leafletImage(that.map, function(err, canvas) {
                var dataUrl = canvas.toDataURL();
                    that.captureCanvasCallback(dataUrl);
                    that.map.attributionControl.addTo(that.map);
            });            
*/            
            html2canvas( document.getElementById('cesiumContainer'), {
	            useCORS: true,
                onrendered: function(canvas) {
                    var dataUrl = canvas.toDataURL("image/jpeg");
                    that.captureCanvasCallback(dataUrl);
                    that.map.attributionControl.addTo(that.map);
                }
            });
        };
        
        //shut down existing cesium
        if (this.viewer !== undefined) {
            this._enableSelectExtent(false);
            stopTimeline();

            var inputHandler = this.viewer.screenSpaceEventHandler;
            inputHandler.removeInputAction( ScreenSpaceEventType.MOUSE_MOVE );
            inputHandler.removeInputAction( ScreenSpaceEventType.LEFT_DOUBLE_CLICK );
            inputHandler.removeInputAction( ScreenSpaceEventType.LEFT_DOUBLE_CLICK, KeyboardEventModifier.SHIFT );

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
            that.scene.base_render(date);

            //capture the scene image right after the render and make
            //call to the GeoDataManager which saves scene data, which sets an event
            // which is picked up by the GeoDataWidget to launch the share dialog
            //TODO: need leaflet version - use extent for camera and placeholder image
            if (that.captureCanvasFlag === true) {
                that.captureCanvasFlag = false;
                var dataUrl = that.scene.canvas.toDataURL("image/jpeg");
                that.captureCanvasCallback(dataUrl);
            }
        };

        this.captureCanvas = function() {
            that.captureCanvasFlag = true;
        };

        if (this.map !== undefined) {
            rect = getCameraRect(undefined, this.map);

            //remove existing map viewer
            this.map.remove();
            this.map = undefined;

            this.updateCameraFromRect(rect, 0);
        }

        this.geoDataManager.setViewer({scene: this.scene, map: undefined});
        this.geoDataBrowser.viewModel.map = undefined;

        this._enableSelectExtent(true);
        stopTimeline(this.viewer);

        this._navigationWidget.showTilt = true;
        document.getElementById('ausglobe-title-middle').style.visibility = 'visible';

        /*
         var esri = new ArcGisMapServerImageryProvider({
         url: 'http://www.ga.gov.au/gis/rest/services/topography/Australian_Topography/MapServer',
         proxy: corsProxy
         });
         this.scene.globe.imageryLayers.addImageryProvider(esri);
         */
    }
};

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
    var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
        // Browser could not initialize WebGL. User probably needs to
        // update their drivers or get a new browser. Present a link to
        // http://get.webgl.org/troubleshooting
        console.log('!!Unable to successfully create Webgl context.');
        return false;
    }
    return true;
}

//------------------------------------
// Timeline display on selection
//------------------------------------
function showTimeline(viewer) {
    $('.cesium-viewer-animationContainer').css('visibility', 'visible');
    $('.cesium-viewer-timelineContainer').css('visibility', 'visible');

    if (defined(viewer)) {
        viewer.forceResize();
    }
}

function hideTimeline(viewer) {
    $('.cesium-viewer-animationContainer').css('visibility', 'hidden');
    $('.cesium-viewer-timelineContainer').css('visibility', 'hidden');

    if (defined(viewer)) {
        viewer.forceResize();
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
        clock.multiplier = JulianDate.getSecondsDifference(finish, start) / 60.0;
        clock.clockRange = ClockRange.LOOP_STOP;
        clock.shouldAnimate = true;
        viewer.timeline.zoomTo(clock.startTime, clock.stopTime);
    }
}

//update menu and camera
function setCurrentDataset(layer, that) {
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
    
    if (layer.zoomTo && layer.extent !== undefined) {
        that.updateCameraFromRect(layer.extent, 1000);
    }
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

var cartesian3Scratch = new Cartesian3();

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
    return Cartesian3.magnitude(Cartesian3.subtract(tx_pos, scene.camera.position, cartesian3Scratch));
}


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
function getCameraRect(scene, map) {
    if (scene !== undefined) {
        var focus = getCameraFocus(scene);
        var focus_cart = Ellipsoid.WGS84.cartesianToCartographic(focus);
        var lat = CesiumMath.toDegrees(focus_cart.latitude);
        var lon = CesiumMath.toDegrees(focus_cart.longitude);

        var dist = Cartesian3.magnitude(Cartesian3.subtract(focus, scene.camera.position, cartesian3Scratch));
        var offset = dist * 5e-6;

        return Rectangle.fromDegrees(lon-offset, lat-offset, lon+offset, lat+offset);
    }
    else if (map !== undefined) {
        var bnds = map.getBounds();
        return Rectangle.fromDegrees(bnds.getWest(), bnds.getSouth(), bnds.getEast(), bnds.getNorth());
    }
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

    scene.tweens.add({
        duration : durationMilliseconds / 1000.0,
        easingFunction : Tween.Easing.Sinusoidal.InOut,
        startObject : {
            time: 0.0
        },
        stopObject : {
            time : 1.0
        },
        update : function(value) {
            scene.camera.position.x = CesiumMath.lerp(startPosition.x, endPosition.x, value.time);
            scene.camera.position.y = CesiumMath.lerp(startPosition.y, endPosition.y, value.time);
            scene.camera.position.z = CesiumMath.lerp(startPosition.z, endPosition.z, value.time);

            var enuToFixed = Transforms.eastNorthUpToFixedFrame(camera.position, Ellipsoid.WGS84);
            var enuToFixedRotation = Matrix4.getRotation(enuToFixed);

            camera.up = Matrix3.multiplyByVector(enuToFixedRotation, initialEnuUp, camera.up);
            camera.right = Matrix3.multiplyByVector(enuToFixedRotation, initialEnuRight, camera.right);
            camera.direction = Matrix3.multiplyByVector(enuToFixedRotation, initialEnuDirection, camera.direction);
        },
        complete : function() {
            controller.enableInputs = true;
        },
        cancel: function() {
            controller.enableInputs = true;
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
                var direction = Cartesian3.subtract(cartesian, camera.position, cartesian3Scratch);
                var movementVector = Cartesian3.multiplyByScalar(direction, distFactor, cartesian3Scratch);
                var endPosition = Cartesian3.add(camera.position, movementVector, cartesian3Scratch);

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

function zoomIn(scene, pos) { zoomCamera(scene, 2.0/3.0, pos); }
function zoomOut(scene, pos) { zoomCamera(scene, -2.0, pos); }

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
        var flight = CameraFlightPath.createTweenRectangle(scene, {
            destination : rect,
            duration: flightTimeMilliseconds / 1000.0
        });
        scene.tweens.add(flight);
    }
    else if (map !== undefined) {
        var bnds = [[CesiumMath.toDegrees(rect.south), CesiumMath.toDegrees(rect.west)],
            [CesiumMath.toDegrees(rect.north), CesiumMath.toDegrees(rect.east)]];
        map.fitBounds(bnds);
    }
};

// -------------------------------------------
// Update the data legend
// -------------------------------------------
function updateLegend(datavis) {
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

module.exports = AusGlobeViewer;
