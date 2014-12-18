/*
 *   A collection of additional viewer functionality independent
 *   of datasets
 */

"use strict";

/*global require,L,URI,$,Document,html2canvas,console,ga*/

var BingMapsApi = require('../../third_party/cesium/Source/Core/BingMapsApi');
var BingMapsImageryProvider = require('../../third_party/cesium/Source/Scene/BingMapsImageryProvider');
var BingMapsStyle = require('../../third_party/cesium/Source/Scene/BingMapsStyle');
var CameraFlightPath = require('../../third_party/cesium/Source/Scene/CameraFlightPath');
var Cartesian2 = require('../../third_party/cesium/Source/Core/Cartesian2');
var Cartesian3 = require('../../third_party/cesium/Source/Core/Cartesian3');
var Cartographic = require('../../third_party/cesium/Source/Core/Cartographic');
var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var CesiumTerrainProvider = require('../../third_party/cesium/Source/Core/CesiumTerrainProvider');
var Clock = require('../../third_party/cesium/Source/Core/Clock');
var ClockRange = require('../../third_party/cesium/Source/Core/ClockRange');
var Color = require('../../third_party/cesium/Source/Core/Color');
var Clock = require('../../third_party/cesium/Source/Core/Clock');
var Credit = require('../../third_party/cesium/Source/Core/Credit');
var DataSourceDisplay = require('../../third_party/cesium/Source/DataSources/DataSourceDisplay');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var Ellipsoid = require('../../third_party/cesium/Source/Core/Ellipsoid');
var EllipsoidGeodesic = require('../../third_party/cesium/Source/Core/EllipsoidGeodesic');
var EllipsoidTerrainProvider = require('../../third_party/cesium/Source/Core/EllipsoidTerrainProvider');
var FeatureDetection = require('../../third_party/cesium/Source/Core/FeatureDetection');
var EventHelper = require('../../third_party/cesium/Source/Core/EventHelper');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var Fullscreen = require('../../third_party/cesium/Source/Core/Fullscreen');
var InfoBox = require('../../third_party/cesium/Source/Widgets/InfoBox/InfoBox');
var Intersections2D = require('../../third_party/cesium/Source/Core/Intersections2D');
var JulianDate = require('../../third_party/cesium/Source/Core/JulianDate');
var KeyboardEventModifier = require('../../third_party/cesium/Source/Core/KeyboardEventModifier');
var loadJson = require('../../third_party/cesium/Source/Core/loadJson');
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');
var Material = require('../../third_party/cesium/Source/Scene/Material');
var Matrix3 = require('../../third_party/cesium/Source/Core/Matrix3');
var Matrix4 = require('../../third_party/cesium/Source/Core/Matrix4');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var RectanglePrimitive = require('../../third_party/cesium/Source/Scene/RectanglePrimitive');
var ScreenSpaceEventHandler = require('../../third_party/cesium/Source/Core/ScreenSpaceEventHandler');
var ScreenSpaceEventType = require('../../third_party/cesium/Source/Core/ScreenSpaceEventType');
var Transforms = require('../../third_party/cesium/Source/Core/Transforms');
var Tween = require('../../third_party/cesium/Source/ThirdParty/Tween');
var Viewer = require('../../third_party/cesium/Source/Widgets/Viewer/Viewer');
var viewerEntityMixin = require('../../third_party/cesium/Source/Widgets/Viewer/viewerEntityMixin');
var WebMercatorProjection = require('../../third_party/cesium/Source/Core/WebMercatorProjection');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var Animation = require('../../third_party/cesium/Source/Widgets/Animation/Animation');
var AnimationViewModel = require('../../third_party/cesium/Source/Widgets/Animation/AnimationViewModel');
var Timeline = require('../../third_party/cesium/Source/Widgets/Timeline/Timeline');
var ClockViewModel = require('../../third_party/cesium/Source/Widgets/ClockViewModel');

var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var corsProxy = require('../Core/corsProxy');
var GeoDataBrowser = require('./GeoDataBrowser');
var CesiumViewModel = require('../ViewModels/CesiumViewModel');
var LeafletViewModel = require('../ViewModels/LeafletViewModel');
var NavigationWidget = require('./NavigationWidget');
var PopupMessage = require('./PopupMessage');
var rectangleToLatLngBounds = require('../Map/rectangleToLatLngBounds');
var SearchWidget = require('./SearchWidget');
//var ServicesPanel = require('./ServicesPanel');
var SharePanel = require('./SharePanel');
var TitleWidget = require('./TitleWidget');
var LeafletVisualizer = require('../Map/LeafletVisualizer');
var ViewerMode = require('../ViewModels/ViewerMode');

//use our own bing maps key
BingMapsApi.defaultKey = undefined;

//Initialize the selected viewer - Cesium or Leaflet
var AusGlobeViewer = function(application) {
    this._distanceLegendBarWidth = undefined;
    this._distanceLegendLabel = undefined;

    var that = this;
    
    that.startup = true;
    this.captureCanvas = function() { console.log('capture call unset'); };
    this.captureCanvasCallback = function(dataUrl) { console.log('callback unset'); };

    var titleWidget = new TitleWidget({
        container : document.body,
        menuItems : [
            {
                svg : {
                    path : 'M 30.1,5.5 H 1.9 C 1.2376,5.5 0.7,6.0376 0.7,6.7 v 18.6 c 0,0.6624 0.5376,1.2 1.2,1.2 h 28.2 c 0.6624,0 1.2,-0.5376 1.2,-1.2 V 6.7 c 0,-0.6624 -0.537,-1.2 -1.2,-1.2 z m -12,18 c 0,0.6624 -0.5376,1.2 -1.2,1.2 H 3.7 c -0.6624,0 -1.2,-0.5376 -1.2,-1.2 v -7.2 c 0,-0.6624 0.5376,-1.2 1.2,-1.2 h 13.2 c 0.6624,0 1.2,0.5376 1.2,1.2 v 7.2 z',
                    width : 32,
                    height : 32
                },
                tooltip : 'Fullscreen',
                callback : function() {
                    if (Fullscreen.fullscreen) {
                        Fullscreen.exitFullscreen();
                    } else {
                        Fullscreen.requestFullscreen(document.body);
                    }
                }
            },
            {
                svg : {
                    path : 'm 22.6786,19.8535 c -0.8256,0 -1.5918,0.2514 -2.229,0.6822 l -7.1958,-4.1694 c 0.0198,-0.1638 0.0492,-0.3252 0.0492,-0.4944 0,-0.2934 -0.0366,-0.5778 -0.096,-0.8532 l 6.9978,-3.7554 c 0.6816,0.5442 1.5342,0.8844 2.4738,0.8844 2.199,0 3.9822,-1.7832 3.9822,-3.9822 0,-2.199 -1.7832,-3.9816 -3.9822,-3.9816 -2.199,0 -3.9816,1.7826 -3.9816,3.9816 0,0.1434 0.0276,0.279 0.042,0.4188 l -7.2198,3.9702 c -0.6306,-0.4182 -1.3854,-0.6648 -2.1978,-0.6648 -2.1996,0 -3.9822,1.7826 -3.9822,3.9822 0,2.1984 1.7826,3.9816 3.9822,3.9816 0.906,0 1.731,-0.3144 2.4,-0.8238 l 7.0398,4.1628 c -0.0342,0.2106 -0.0642,0.4224 -0.0642,0.642 0,2.199 1.7826,3.9816 3.9816,3.9816 2.199,0 3.9822,-1.7826 3.9822,-3.9816 -6e-4,-2.1984 -1.7832,-3.981 -3.9822,-3.981 z',
                    width : 32,
                    height : 32
                },
                tooltip : 'Share',
                callback : function() {
                    that.captureCanvasCallback = function (dataUrl) {
                        var camera = getCameraRect(that.scene, that.map);

                        var request = {
                            version: '0.0.03',
                            image: dataUrl,
                            initSources: that.application.initSources.slice()
                        };

                        var initSources = request.initSources;

                        // Add an init source with user-added catalog members.
                        var userDataSerializeOptions = {
                            userSuppliedOnly: true,
                            skipItemsWithLocalData: true,
                            itemsSkippedBecauseTheyHaveLocalData: []
                        };

                        var userAddedCatalog = that.application.catalog.serializeToJson(userDataSerializeOptions);
                        if (userAddedCatalog.length > 0) {
                            initSources.push({
                                catalog: userAddedCatalog,
                                catalogIsUserSupplied: true
                            });
                        }

                        // Add an init source with the enabled/opened catalog members.
                        var enabledAndOpenedCatalog = that.application.catalog.serializeToJson({
                            enabledItemsOnly: true,
                            skipItemsWithLocalData: true,
                            serializeForSharing: true,
                        });
                        if (enabledAndOpenedCatalog.length > 0) {
                            initSources.push({
                                catalog: enabledAndOpenedCatalog,
                                catalogOnlyUpdatesExistingItems: true
                            });
                        }

                        // Add an init source with the camera position.
                        initSources.push({
                            camera: {
                                west: CesiumMath.toDegrees(camera.west),
                                south: CesiumMath.toDegrees(camera.south),
                                east: CesiumMath.toDegrees(camera.east),
                                north: CesiumMath.toDegrees(camera.north)
                            }
                        });

                        SharePanel.open({
                            request: request,
                            container: document.body,
                            itemsSkippedBecauseTheyHaveLocalData: userDataSerializeOptions.itemsSkippedBecauseTheyHaveLocalData
                        });
                    };
                    that.captureCanvas();
                }
            },
            // {
            //     svg : {
            //         path : 'M26.33,15.836l-3.893-1.545l3.136-7.9c0.28-0.705-0.064-1.505-0.771-1.785c-0.707-0.28-1.506,0.065-1.785,0.771l-3.136,7.9l-4.88-1.937l3.135-7.9c0.281-0.706-0.064-1.506-0.77-1.786c-0.706-0.279-1.506,0.065-1.785,0.771l-3.136,7.9L8.554,8.781l-1.614,4.066l2.15,0.854l-2.537,6.391c-0.61,1.54,0.143,3.283,1.683,3.895l1.626,0.646L8.985,26.84c-0.407,1.025,0.095,2.188,1.122,2.596l0.93,0.369c1.026,0.408,2.188-0.095,2.596-1.121l0.877-2.207l1.858,0.737c1.54,0.611,3.284-0.142,3.896-1.682l2.535-6.391l1.918,0.761L26.33,15.836z',
            //         width : 32,
            //         height : 32
            //     },
            //     tooltip : 'Services',
            //     callback : function() {
            //         that.captureCanvasCallback = function (dataUrl) {
            //             var serializeOptions = {
            //                 enabledItemsOnly: true,
            //                 skipItemsWithLocalData: false
            //             };
            //             var jsonCatalog = that.application.catalog.serializeToJson(serializeOptions);
            //             var request = {
            //                 version: '0.0.03',
            //                 camera: getCameraRect(that.scene, that.map),
            //                 image: dataUrl,
            //                 catalog: jsonCatalog
            //             };

            //             ServicesPanel.open({
            //                 request: request,
            //                 container: document.body,
            //                 catalog: that.application.catalog,
            //                 services: that.application.services.services
            //             });
            //         };
            //         that.captureCanvas();
            //     }
            // },
            {
                svg : {
                    path : 'M 16,5.0002 C 9.925,5.0002 5.0002,9.925 5.0002,16 5.0002,22.075 9.925,26.9998 16,26.9998 22.075,26.9998 26.9998,22.075 26.9998,16 26.9998,9.9256 22.075,5.0002 16,5.0002 z m 1.7994,17.2002 h -3 v -7.8 h 3 v 7.8 z m -1.5996,-9.8496 c -0.897,0 -1.6248,-0.7272 -1.6248,-1.6248 0,-0.8976 0.7278,-1.6248 1.6248,-1.6248 0.8976,0 1.6254,0.7272 1.6254,1.6248 0,0.8976 -0.7278,1.6248 -1.6254,1.6248 z',
                    width : 32,
                    height : 32
                },
                tooltip : 'About National Map',
                uri : 'http://nicta.github.io/nationalmap/public/info.html',
                target : '_blank'
            },
            {
                svg : {
                    path : 'M 16,5.0002 C 9.925,5.0002 5.0002,9.925 5.0002,16 5.0002,22.075 9.925,26.9998 16,26.9998 22.075,26.9998 26.9998,22.075 26.9998,16 26.9998,9.9256 22.075,5.0002 16,5.0002 z m 0.1572,17.0004 c -0.7452,0 -1.35,-0.6042 -1.35,-1.35 0,-0.7458 0.6048,-1.35 1.35,-1.35 0.7458,0 1.3506,0.6042 1.3506,1.35 0,0.7458 -0.6048,1.35 -1.3506,1.35 z m 3.486,-7.4106 c -0.1302,0.3228 -0.291,0.5982 -0.4836,0.8268 -0.1926,0.2292 -0.4056,0.4242 -0.6396,0.585 -0.234,0.1614 -0.4548,0.3228 -0.6624,0.4836 -0.2088,0.1614 -0.4758,0.3456 -0.6372,0.5538 -0.162,0.2082 -0.3876,0.468 -0.3876,0.78 v 0.7812 h -1.8 V 17.71 c 0,-0.447 0.048,-0.8214 0.1872,-1.1232 0.1404,-0.3012 0.27,-0.5592 0.4572,-0.7722 0.1872,-0.213 0.3678,-0.3978 0.576,-0.5538 0.2082,-0.156 0.3912,-0.312 0.5682,-0.468 0.177,-0.156 0.315,-0.3276 0.4242,-0.5148 0.1092,-0.1872 0.1566,-0.4212 0.1464,-0.702 0,-0.4782 -0.1182,-0.8322 -0.3522,-1.0608 -0.234,-0.2286 -0.5598,-0.3432 -0.9756,-0.3432 -0.2808,0 -0.5232,0.0546 -0.726,0.1638 -0.2028,0.1092 -0.369,0.255 -0.4992,0.4368 -0.1302,0.1818 -0.2262,0.4956 -0.2886,0.7398 -0.0624,0.2442 -0.093,0.288 -0.093,0.888 h -2.2932 c 0.0102,-0.6 0.1068,-1.1766 0.2886,-1.6446 0.1818,-0.468 0.4368,-0.9234 0.7638,-1.2666 0.3276,-0.3432 0.723,-0.636 1.1862,-0.8286 0.4626,-0.192 0.9798,-0.3006 1.5522,-0.3006 0.738,0 1.3542,0.0948 1.8486,0.2976 0.4932,0.2028 0.891,0.4518 1.1928,0.7536 0.3018,0.3018 0.5172,0.6252 0.6474,0.9732 0.1302,0.348 0.195,0.6726 0.195,0.9744 -6e-4,0.4992 -0.0654,0.909 -0.1956,1.2312 z',
                    width : 32,
                    height : 32
                },
                tooltip : 'Help',
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

    var leftArea = document.createElement('div');
    leftArea.className = 'ausglobe-left-area';
    document.body.appendChild(leftArea);

    var url = window.location;
    var uri = new URI(url);
    var params = uri.search(true);

    this.webGlSupported = (application.userProperties.map === '2d' || params.map === '2d') ? false : true;
    
    var noWebGLMessage;
    
    if (FeatureDetection.isInternetExplorer() && FeatureDetection.internetExplorerVersion()[0] < 9) {
        noWebGLMessage = new PopupMessage({
            container : document.body,
            title : 'Unsupported browser version detected',
            message : '\
The National Map is not designed to work on versions of Internet Explorer older than 9.0. \
We suggest you upgrade to the latest version of Google Chrome, Microsoft IE11 or Mozilla Firefox. \
Running on your current browser will probably suffer from limited functionality, poor appearance, \
and stability issues.'
        });
        this.webGlSupported = false;
    }

    //catch problems 
    if (this.webGlSupported && !supportsWebgl()) {
        noWebGLMessage = new PopupMessage({
            container : document.body,
            title : 'WebGL not supported',
            message : '\
National Map works best with a web browser that supports <a href="http://get.webgl.com" target="_blank">WebGL</a>, \
including the latest versions of <a href="http://www.google.com/chrome" target="_blank">Google Chrome</a>, \
<a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>, \
<a href="https://www.apple.com/au/osx/how-to-upgrade/" target="_blank">Apple Safari</a>, and \
<a href="http://www.microsoft.com/ie" target="_blank">Microsoft Internet Explorer</a>. \
Your web browser does not appear to support WebGL, so you will see a limited, 2D-only experience.'
        });
        this.webGlSupported = false;
    }

    if (document.body.clientWidth < 520 || document.body.clientHeight < 400) {
        PopupMessage.open({
            container : document.body,
            title : 'Small screen or window',
            message : '\
Hello!<br/>\
<br/>\
Currently the National Map isn\'t optimised for small screens.<br/>\
<br/>\
For a better experience we\'d suggest you visit the application from a larger screen like your tablet, laptop or desktop.  \
If you\'re on a desktop or laptop, consider increasing the size of your window.'
        });
    }
    
    //TODO: perf test to set environment

    this.scene = undefined;
    this.viewer = undefined;
    this.map = undefined;

    this.application = application;

    this.geoDataBrowser = new GeoDataBrowser({
        viewer : that,
        container : leftArea,
        mode3d: that.webGlSupported,
        catalog : this.application.catalog
    });

    this.selectViewer(this.webGlSupported);

    knockout.getObservable(this.application, 'viewerMode').subscribe(function() {
        changeViewer(this);
    }, this);

    knockout.getObservable(this.application, 'initialBoundingBox').subscribe(function() {
        that.updateCameraFromRect(that.application.initialBoundingBox, 2000);
    });
};

AusGlobeViewer.create = function(application) {
    return new AusGlobeViewer(application);
};

function changeViewer(viewer) {
    var application = viewer.application;
    var newMode = application.viewerMode;

    if (newMode === ViewerMode.Leaflet) {
        ga('send', 'event', 'mapSettings', 'switchViewer', '2D');
        viewer.selectViewer(false);
    } else if (newMode === ViewerMode.CesiumTerrain) {
        ga('send', 'event', 'mapSettings', 'switchViewer', '3D');

        if (defined(application.leaflet)) {
            viewer.selectViewer(true);
        } else {
            application.cesium.scene.globe.terrainProvider = new CesiumTerrainProvider({
                url : '//cesiumjs.org/stk-terrain/tilesets/world/tiles'
            });
        }
    } else if (newMode === ViewerMode.CesiumEllipsoid) {
        ga('send', 'event', 'mapSettings', 'switchViewer', 'Smooth 3D');

        if (defined(application.leaflet)) {
            viewer.selectViewer(true);
        }

        application.cesium.scene.globe.terrainProvider = new EllipsoidTerrainProvider();
    }
}

// -------------------------------------------
// PERF: skip frames where reasonable
// -------------------------------------------
var FrameChecker = function () {
    this._lastDate = new JulianDate(0, 0.0);
    this._lastCam = new Matrix4();
    this._maxFPS = 40.0;
    this._skipCnt = 0;
    this._skipWaitNorm = 3.0; //start skip after launch
    this._skipWaitLim = 10.0; //start skip at launch
};

// call to force draw - usually after long downloads/processes
FrameChecker.prototype.forceFrameUpdate = function() {
    this._skipCnt = 0;
};

// see if we can skip the draw on this frame
FrameChecker.prototype.skipFrame = function(scene, date) {
    //check if anything actually changed
    if (this._lastDate) {
        var bDateSame = this._lastDate.equals(date);
        var bCamSame = this._lastCam.equalsEpsilon(scene.camera.viewMatrix, CesiumMath.EPSILON5);
        if (bDateSame && bCamSame) {
            this._skipCnt++;
        }
        else {
            this._skipCnt = 0;
        }
    }

    // If terrain/imagery is loading, force another render immediately so that the loading
    // happens as quickly as possible.
    var surface = scene.globe._surface;
    if (surface._tileLoadQueue.length > 0 || surface._debug.tilesWaitingForChildren > 0) {
        this._skipCnt = 0;
    }

    if (this._skipCnt > (this._maxFPS * this._skipWaitLim)) {
        this._skipWaitLim = this._skipWaitNorm; //go to normal skip wait
        return true;
    }

    this._lastDate = date.clone(this._lastDate);
    this._lastCam = scene.camera.viewMatrix.clone(this._lastCam);
    return false;
};

// -------------------------------------------
// DrawExtentHelper from the cesium sample code
//  modified to always be available on shift-click
// -------------------------------------------
var DrawExtentHelper = function (scene, handler) {
    this._scene = scene;
    this._ellipsoid = scene.globe.ellipsoid;
    this._finishHandler = handler;
    this._mouseHandler = new ScreenSpaceEventHandler(scene.canvas);
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
        var pickRay = this._scene.camera.getPickRay(movement.position);
        var cartesian = this._scene.globe.pick(pickRay, this._scene);
        if (cartesian) {
            this._click2 = this._ellipsoid.cartesianToCartographic(cartesian);
        }
        ext = this.getExtent(this._click1, this._click2);
    }
    this._scene.primitives.remove(this._extentPrimitive);
    this.active = false;
    this._finishHandler(ext);
};

DrawExtentHelper.prototype.handleRegionInter = function (movement) {
    var pickRay = this._scene.camera.getPickRay(movement.endPosition);
    var cartesian = this._scene.globe.pick(pickRay, this._scene);
    if (cartesian) {
        var cartographic = this._ellipsoid.cartesianToCartographic(cartesian);
        this.setPolyPts(this._click1, cartographic);
    }
};

DrawExtentHelper.prototype.handleRegionStart = function (movement) {
    var pickRay = this._scene.camera.getPickRay(movement.position);
    var cartesian = this._scene.globe.pick(pickRay, this._scene);
    if (cartesian) {
        this.disableInput();
        this.active = true;
        this._extentPrimitive = new RectanglePrimitive({
            material : Material.fromType('Color', {
                color : new Color(1.0, 1.0, 1.0, 0.5)
            })
        });
        this._extentPrimitive.asynchronous = false;
        this._scene.primitives.add(this._extentPrimitive);
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
    this._mouseHandler.destroy();
    this._scene = undefined;
};


// -------------------------------------------
// Region Selection
// -------------------------------------------
AusGlobeViewer.prototype._enableSelectExtent = function(bActive) {
    if (bActive) {
        var that = this;
        this.regionSelect = new DrawExtentHelper(this.scene, function (ext) {
            if (ext) {
                that.updateCameraFromRect(ext, 2000);
            }
        });
        this.regionSelect.start();
    }
    else {
        this.regionSelect.destroy();
    }
};


AusGlobeViewer.prototype._createCesiumViewer = function(container) {

    var that = this;
    
    var terrainProvider = new CesiumTerrainProvider({
            url : '//cesiumjs.org/stk-terrain/tilesets/world/tiles'
        });

    var options = {
        dataSources: this.application.dataSources,
        clock: this.application.clock,
        homeButton: false,
        sceneModePicker: false,
        navigationInstructionsInitiallyVisible: false,
        geocoder: false,
        baseLayerPicker: false,
        navigationHelpButton: false,
        fullscreenButton : false,
        terrainProvider : terrainProvider,
        imageryProvider : new BingMapsImageryProvider({
            url : '//dev.virtualearth.net',
            mapStyle : BingMapsStyle.AERIAL_WITH_LABELS
        }),
        timeControlsInitiallyVisible : false,
        targetFrameRate : 40
    };

    // Workaround for Firefox bug with WebGL and printing:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=976173
    if (FeatureDetection.isFirefox()) {
        options.contextOptions = {webgl : {preserveDrawingBuffer : true}};
    }

     //create CesiumViewer
    var viewer = new Viewer(container, options);
    viewer.extend(viewerEntityMixin);

    viewer.clock.shouldAnimate = false;

    //catch Cesium terrain provider down and switch to Ellipsoid
    terrainProvider.errorEvent.addEventListener(function(err) {
        console.log('Terrain provider error.  ', err.message);
        if (viewer.scene.terrainProvider instanceof CesiumTerrainProvider) {
            console.log('Switching to EllipsoidTerrainProvider.');
            viewer.scene.terrainProvider = new EllipsoidTerrainProvider();
            if (!defined(that.TerrainMessageViewed)) {
                PopupMessage.open({
                    container : document.body,
                    title : 'Terrain Server Not Responding',
                    message : '\
The terrain server is not responding at the moment.  You can still use all the features of National \
Map but there will be no terrain detail in 3D mode.  We\'re sorry for the inconvenience.  Please try \
again later and the terrain server should be responding as expected.  If the issue persists, please contact \
us via email at nationalmap@lists.nicta.com.au.'
                });
                that.TerrainMessageViewed = true;
            }
        }
    });


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
    var globe = scene.globe;
    var camera = scene.camera;

    globe.depthTestAgainstTerrain = false;

    scene.frameState.creditDisplay.addDefaultCredit(new Credit('CESIUM', undefined, 'http://cesiumjs.org/'));
    scene.frameState.creditDisplay.addDefaultCredit(new Credit('BING', undefined, 'http://www.bing.com/'));


    //Placeholder for now - commenting out since the warning doesn't mean much when we stop the render loop
//    var monitor = new FrameRateMonitor.fromScene(scene);
//    viewer._unsubscribeLowFrameRate = monitor.lowFrameRate.addEventListener(function() {
//        console.log('Unusually slow startup detected!!  Messagebox for user options - webgl fixes, 2d mode.');
//    });


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

        if (that.frameChecker !== undefined) {
            that.frameChecker.forceFrameUpdate();
        }

        var pickRay = camera.getPickRay(movement.endPosition);

        var globe = scene.globe;
        var pickedTriangle = globe.pickTriangle(pickRay, scene);
        if (defined(pickedTriangle)) {
            // Get a fast, accurate-ish height every time the mouse moves.
            var ellipsoid = globe.ellipsoid;
            
            var v0 = ellipsoid.cartesianToCartographic(pickedTriangle.v0);
            var v1 = ellipsoid.cartesianToCartographic(pickedTriangle.v1);
            var v2 = ellipsoid.cartesianToCartographic(pickedTriangle.v2);
            var intersection = ellipsoid.cartesianToCartographic(pickedTriangle.intersection);

            var barycentric = Intersections2D.computeBarycentricCoordinates(
                intersection.longitude, intersection.latitude,
                v0.longitude, v0.latitude,
                v1.longitude, v1.latitude,
                v2.longitude, v2.latitude);

            if (barycentric.x >= -1e-15 && barycentric.y >= -1e-15 && barycentric.z >= -1e-15) {
                var height = barycentric.x * v0.height +
                             barycentric.y * v1.height +
                             barycentric.z * v2.height;
                intersection.height = height;
            }

            var errorBar = globe.terrainProvider.getLevelMaximumGeometricError(pickedTriangle.tile.level);
            var approximateHeight = intersection.height;
            var minHeight = pickedTriangle.tile.data.minimumHeight;
            var maxHeight = pickedTriangle.tile.data.maximumHeight;
            var maxDiff = Math.max(approximateHeight - minHeight, maxHeight - approximateHeight);
            errorBar = Math.min(errorBar, maxDiff);

            document.getElementById('ausglobe-title-position').innerHTML = cartographicToDegreeString(intersection, errorBar);

            debounceSampleAccurateHeight(globe, intersection);
        } else {
            document.getElementById('ausglobe-title-position').innerHTML = '';
        }
    }, ScreenSpaceEventType.MOUSE_MOVE);

    return viewer;
};

var lastHeightSamplePosition = new Cartographic();
var accurateHeightTimer;
var tileRequestInFlight;
var accurateSamplingDebounceTime = 250;

function debounceSampleAccurateHeight(globe, position) {
    // After a delay with no mouse movement, get a more accurate height.
    Cartographic.clone(position, lastHeightSamplePosition);

    var terrainProvider = globe.terrainProvider;
    if (terrainProvider instanceof CesiumTerrainProvider) {
        clearTimeout(accurateHeightTimer);
        accurateHeightTimer = setTimeout(function() {
            sampleAccurateHeight(terrainProvider, position);
        }, accurateSamplingDebounceTime);
    }
}

function sampleAccurateHeight(terrainProvider, position) {
        //can happen if reload while over ui element
    if (!defined(terrainProvider) || !defined(position)) {
        return;
    }
    accurateHeightTimer = undefined;
    if (tileRequestInFlight) {
        // A tile request is already in flight, so reschedule for later.
        accurateHeightTimer = setTimeout(sampleAccurateHeight, accurateSamplingDebounceTime);
        return;
    }

    // Find the most detailed available tile at the last mouse position.
    var tilingScheme = terrainProvider.tilingScheme;
    var tiles = terrainProvider._availableTiles;
    var foundTileID;
    var foundLevel;

    for (var level = tiles.length - 1; !foundTileID && level >= 0; --level) {
        var levelTiles = tiles[level];
        var tileID = tilingScheme.positionToTileXY(position, level);
        var yTiles = tilingScheme.getNumberOfYTilesAtLevel(level);
        var tmsY = yTiles - tileID.y - 1;

        // Is this tile ID available from the terrain provider?
        for (var i = 0, len = levelTiles.length; !foundTileID && i < len; ++i) {
            var range = levelTiles[i];
            if (tileID.x >= range.startX && tileID.x <= range.endX && tmsY >= range.startY && tmsY <= range.endY) {
                foundLevel = level;
                foundTileID = tileID;
            }
        }
    }

    if (foundTileID) {
        // This tile has our most accurate available height, so go get it.
        tileRequestInFlight = when(terrainProvider.requestTileGeometry(foundTileID.x, foundTileID.y, foundLevel, false), function(terrainData) {
            tileRequestInFlight = undefined;
            if (Cartographic.equals(position, lastHeightSamplePosition)) {
                position.height = terrainData.interpolateHeight(tilingScheme.tileXYToRectangle(foundTileID.x, foundTileID.y, foundLevel), position.longitude, position.latitude);
                document.getElementById('ausglobe-title-position').innerHTML = cartographicToDegreeString(position);
            } else {
                // Mouse moved since we started this request, so the result isn't useful.  Try again next time.
            }
        }, function() {
            tileRequestInFlight = undefined;
        });
    }
}

AusGlobeViewer.prototype.isCesium = function() {
    return defined(this.viewer);
};

var isTimelineVisible = function() {
    return $('.cesium-viewer-animationContainer').css('visibility') === 'visible';
};

AusGlobeViewer.prototype.selectViewer = function(bCesium) {
    var previousClock;
    if (this.viewer) {
        previousClock = Clock.clone(this.viewer.clock);
    } else if (this.map) {
        previousClock = Clock.clone(this.map.clock);
    }

    this.application.beforeViewerChanged.raiseEvent();

    var bnds, rect;

    var that = this;

    var timelineVisible = isTimelineVisible();

    if (!bCesium) {

            //shut down existing cesium
        if (defined(this.viewer)) {
            //get camera and timeline settings
            rect = getCameraRect(this.scene);
            bnds = [[CesiumMath.toDegrees(rect.south), CesiumMath.toDegrees(rect.west)],
                [CesiumMath.toDegrees(rect.north), CesiumMath.toDegrees(rect.east)]];

            this._enableSelectExtent(false);

            var inputHandler = this.viewer.screenSpaceEventHandler;
            inputHandler.removeInputAction( ScreenSpaceEventType.MOUSE_MOVE );
            inputHandler.removeInputAction( ScreenSpaceEventType.LEFT_DOUBLE_CLICK );
            inputHandler.removeInputAction( ScreenSpaceEventType.LEFT_DOUBLE_CLICK, KeyboardEventModifier.SHIFT );

            this.viewer.destroy();
            this.viewer = undefined;
        }
        else {
            bnds = rectangleToLatLngBounds(this.application.initialBoundingBox);
        }

       //create leaflet viewer
        var map = L.map('cesiumContainer', {
            worldCopyJump: true,
            zoomControl: false
        }).setView([-28.5, 135], 5);

        this.map = map;
        map.clock = this.application.clock;
        map.dataSources = this.application.dataSources;

        map.screenSpaceEventHandler = {
            setInputAction : function() {},
            remoteInputAction : function() {}
        };
        map.destroy = function() {};

        map.infoBox = new InfoBox(document.body);
        viewerEntityMixin(map);

        if (!defined(this.leafletVisualizer)) {
            this.leafletVisualizer = new LeafletVisualizer();
        }
        this.dataSourceDisplay = new DataSourceDisplay({
            scene : map,
            dataSourceCollection : map.dataSources,
            visualizersCallback: this.leafletVisualizer.visualizersCallback
        });

        var eventHelper = new EventHelper();

        eventHelper.add(map.clock.onTick, function(clock) {
            that.dataSourceDisplay.update(clock.currentTime);
        });

        that.leafletEventHelper = eventHelper;

        var ticker = function() {
            if (that.map === map) {
                map.clock.tick();

                if (typeof requestAnimationFrame !== 'undefined') {
                    requestAnimationFrame(ticker);
                } else {
                    setTimeout(ticker, 15);
                }
            } else {
                console.log('done');
            }
        };

        ticker();

        this.createLeafletTimeline(map.clock);

        Clock.clone(previousClock, map.clock);
        map.timeline.zoomTo(map.clock.startTime, map.clock.stopTime);

        map.on("boxzoomend", function(e) {
            console.log(e.boxZoomBounds);
        });

        map.fitBounds(bnds);

        //Bing Maps Layer by default
        this.mapBaseLayer = new L.BingLayer(BingMapsApi.getKey(), { type: 'AerialWithLabels' });
        map.addLayer(this.mapBaseLayer);

        //document.getElementById('controls').style.visibility = 'hidden';
        this._navigationWidget.showTilt = false;
        document.getElementById('ausglobe-title-position').style.visibility = 'hidden';

        //redisplay data
        this.map = map;

        this.application.leaflet = new LeafletViewModel(this.application, map);
        this.application.cesium = undefined;

        this.captureCanvas = function() {
            var that = this;
            if (that.startup) {
                that.startup = false;
            }
            that.map.attributionControl.removeFrom(that.map);
            html2canvas( document.getElementById('cesiumContainer'), {
	            useCORS: true,
                onrendered: function(canvas) {
                    var dataUrl = canvas.toDataURL("image/jpeg");
                    that.captureCanvasCallback(dataUrl);
                    that.map.attributionControl.addTo(that.map);
                }
            });
        };

        map.on('click', function(e) {
            selectFeatureLeaflet(that, e.latlng);
        });

        this.geoDataBrowser.viewModel.map = map;
    }
    else {
        if (defined(this.map)) {
            //get camera and timeline settings
            rect = getCameraRect(undefined, this.map);

            if (that.leafletEventHelper) {
                that.leafletEventHelper.removeAll();
                that.leafletEventHelper = undefined;
            }

            this.removeLeafletTimeline();
            this.dataSourceDisplay.destroy();
            this.map.dataSources = undefined;
            this.map.remove();
            this.map = undefined;
        }
        else {
            rect = this.application.initialBoundingBox;
         }

        //create Cesium viewer
        this.viewer = this._createCesiumViewer('cesiumContainer');
        this.scene = this.viewer.scene;

        this.application.cesium = new CesiumViewModel(this.application, this.viewer);
        this.application.leaflet = undefined;

        this.frameChecker = new FrameChecker();

        // Make sure we re-render when data sources or imagery layers are added or removed.
        this.scene.imageryLayers.layerAdded.addEventListener(this.frameChecker.forceFrameUpdate, this.frameChecker);
        this.scene.imageryLayers.layerRemoved.addEventListener(this.frameChecker.forceFrameUpdate, this.frameChecker);
        this.scene.imageryLayers.layerMoved.addEventListener(this.frameChecker.forceFrameUpdate, this.frameChecker);

        this.viewer.dataSources.dataSourceAdded.addEventListener(this.frameChecker.forceFrameUpdate, this.frameChecker);
        this.viewer.dataSources.dataSourceRemoved.addEventListener(this.frameChecker.forceFrameUpdate, this.frameChecker);

        // override the default render loop
        this.scene.base_render = this.scene.render;
        this.scene.render = function(date) {

            if (that.frameChecker.skipFrame(that.scene, date)) {
                return;
            }
            that.scene.base_render(date);

            that.updateDistanceLegend();

            // Capture the scene image right after the render.
            // With preserveDrawingBuffer: false on the WebGL canvas (the default), we can't rely
            // on the canvas still having its image once we return from requestAnimationFrame.
            if (that.captureCanvasFlag === true) {
                that.captureCanvasFlag = false;
                var dataUrl = that.scene.canvas.toDataURL("image/jpeg");
                that.captureCanvasCallback(dataUrl);
            }
        };

        this.captureCanvas = function() {
            that.captureCanvasFlag = true;
        };

        this.updateCameraFromRect(rect, 0);

        this.geoDataBrowser.viewModel.map = undefined;

        this._enableSelectExtent(true);

        Clock.clone(previousClock, this.viewer.clock);

        this._navigationWidget.showTilt = true;
        document.getElementById('ausglobe-title-position').style.visibility = 'visible';

    }

    this.application.afterViewerChanged.raiseEvent();

    if (timelineVisible) {
        showTimeline(this.viewer);
    } else {
        hideTimeline(this.viewer);
    }
};

var geodesic = new EllipsoidGeodesic();

var distances = [
    1, 2, 3, 5,
    10, 20, 30, 50,
    100, 200, 300, 500,
    1000, 2000, 3000, 5000,
    10000, 20000, 30000, 50000,
    100000, 200000, 300000, 500000,
    1000000, 2000000, 3000000, 5000000,
    10000000, 20000000, 30000000, 50000000];

AusGlobeViewer.prototype.updateDistanceLegend = function() {
    // Find the distance between two pixels at the bottom center of the screen.
    var scene = this.scene;
    var width = scene.canvas.clientWidth;
    var height = scene.canvas.clientHeight;

    var left = scene.camera.getPickRay(new Cartesian2((width / 2) | 0, height - 1));
    var right = scene.camera.getPickRay(new Cartesian2(1 + (width / 2) | 0, height - 1));

    var globe = scene.globe;
    var leftPosition = globe.pick(left, scene);
    var rightPosition = globe.pick(right, scene);

    if (!defined(leftPosition) || !defined(rightPosition)) {
        document.getElementById('ausglobe-title-scale').style.visibility = 'hidden';
        return;
    }

    var leftCartographic = globe.ellipsoid.cartesianToCartographic(leftPosition);
    var rightCartographic = globe.ellipsoid.cartesianToCartographic(rightPosition);

    geodesic.setEndPoints(leftCartographic, rightCartographic);
    var pixelDistance = geodesic.surfaceDistance;

    // Find the first distance that makes the scale bar less than 150 pixels.
    var maxBarWidth = 150;
    var distance;
    for (var i = distances.length - 1; !defined(distance) && i >= 0; --i) {
        if (distances[i] / pixelDistance < maxBarWidth) {
            distance = distances[i];
        }
    }

    if (defined(distance)) {
        var label;
        if (distance >= 1000) {
            label = (distance / 1000).toString() + ' km';
        } else {
            label = distance.toString() + ' m';
        }

        var barWidth = (distance / pixelDistance) | 0;
        if (barWidth !== this._distanceLegendBarWidth || label !== this._distanceLegendLabel) {
            document.getElementById('ausglobe-title-scale').style.visibility = 'visible';
            document.getElementById('ausglobe-title-scale-label').textContent = label;
            document.getElementById('ausglobe-title-scale-bar').style.width = barWidth.toString() + 'px';

            this._distanceLegendBarWidth = barWidth;
            this._distanceLegendLabel = label;
        }
    } else {
        document.getElementById('ausglobe-title-scale').style.visibility = 'hidden';
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

    var webglOptions = {
        alpha : false,
        stencil : false,
        failIfMajorPerformanceCaveat : true
    };

    var gl = canvas.getContext("webgl", webglOptions) || canvas.getContext("experimental-webgl", webglOptions);
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

AusGlobeViewer.prototype.createLeafletTimeline = function(clock) {

    var viewerContainer = document.getElementById('cesiumContainer');

    var clockViewModel = new ClockViewModel(clock);

    var animationContainer = document.createElement('div');
    animationContainer.className = 'cesium-viewer-animationContainer';
    animationContainer.style.bottom = '15px';
    viewerContainer.appendChild(animationContainer);
    this.map.animation = new Animation(animationContainer, new AnimationViewModel(clockViewModel));

    var timelineContainer = document.createElement('div');
    timelineContainer.className = 'cesium-viewer-timelineContainer';
    timelineContainer.style.right = '0px';
    timelineContainer.style.bottom = '15px';
    viewerContainer.appendChild(timelineContainer);
    var timeline = new Timeline(timelineContainer, clock);
    timeline.zoomTo(clock.startTime, clock.stopTime);
    this.map.timeline = timeline;

    var that = this;
    timeline.scrubFunction = function(e) {
        if (that.map.dragging.enabled()) {
            that.map.dragging.disable();
            that.map.on('mouseup', function(e) {
                that.map.dragging.enable();
            });
        }
        var clock = e.clock;
        clock.currentTime = e.timeJulian;
        clock.shouldAnimate = false;
    };
    timeline.addEventListener('settime', timeline.scrubFunction, false);
};

AusGlobeViewer.prototype.removeLeafletTimeline = function() {
    var viewerContainer = document.getElementById('cesiumContainer');

    if (defined(this.map.animation)) {
        viewerContainer.removeChild(this.map.animation.container);
        this.map.animation = this.map.animation.destroy();
    }

    if (defined(this.map.timeline)) {
        this.map.timeline.removeEventListener('settime', this.map.timeline.scrubFunction, false);
        viewerContainer.removeChild(this.map.timeline.container);
        this.map.timeline = this.map.timeline.destroy();
    }
};

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

//update the timeline
AusGlobeViewer.prototype.updateTimeline = function(start, finish, cur, run) {
    var viewer = this.viewer;
    var clock = defined(viewer) ? this.viewer.clock : this.map.clock;
    var timeline = defined(viewer) ? this.viewer.timeline : this.map.timeline;

    if (start === undefined || finish === undefined) {
        hideTimeline(viewer);
        clock.clockRange = ClockRange.UNBOUNDED;
        clock.shouldAnimate = false;
    }
    else {
        showTimeline(viewer);
        clock.startTime = start;
        clock.currentTime = (defined(cur)) ? cur : start;
        clock.stopTime = finish;
        clock.multiplier = JulianDate.secondsDifference(finish, start) / 60.0;
        clock.clockRange = ClockRange.LOOP_STOP;
        clock.shouldAnimate = defined(run) ? run : false;
        timeline.zoomTo(clock.startTime, clock.stopTime);
    }
 };

 AusGlobeViewer.prototype.getTimelineSettings = function() {
    if ($('.cesium-viewer-timelineContainer').css('visibility') === 'hidden' ) {
        return {};
    }
    var viewer = this.viewer;
    var clock = defined(viewer) ? this.viewer.clock : this.map.clock;
    return {start: clock.startTime, stop: clock.stopTime, cur: clock.currentTime};
 };


//update timeline and camera
AusGlobeViewer.prototype.setCurrentDataset = function(layer) {
    //remove case
    if (layer === undefined) {
        this.updateTimeline();
        return;
    }
    
    //table info
    var start, finish;
    if (layer.dataSource !== undefined) {
        var collection = layer.dataSource.entities;
        var availability = collection.computeAvailability();
        if (availability.isStartIncluded && availability.isStopIncluded) {
            start = availability.start;
            finish = availability.stop;
        }
    }
    this.updateTimeline(start, finish, start, true);
    
    if (layer.zoomTo && layer.extent !== undefined) {
        this.updateCameraFromRect(layer.extent, 3000);
    }
};

// -------------------------------------------
// Text Formatting
// -------------------------------------------
function cartographicToDegreeString(cartographic, errorBar) {
    var strNS = cartographic.latitude < 0 ? 'S' : 'N';
    var strWE = cartographic.longitude < 0 ? 'W' : 'E';
    var text = 'Lat: ' + Math.abs(CesiumMath.toDegrees(cartographic.latitude)).toFixed(3) + '&deg; ' + strNS +
        ' | Lon: ' + Math.abs(CesiumMath.toDegrees(cartographic.longitude)).toFixed(3) + '&deg; ' + strWE;
    if (defined(cartographic.height)) {
        text += ' | Elev: ' + cartographic.height.toFixed(1);
        if (defined(errorBar)) {
            text += "±" + errorBar.toFixed(1);
        }

        text += ' m';
    }
    return text;
}

var cartesian3Scratch = new Cartesian3();

// -------------------------------------------
// Camera management
// -------------------------------------------

//Camera extent approx for 2D viewer
function getCameraFocus(scene) {
    //Hack to get current camera focus
    var pos = Cartesian2.fromArray([$(document).width()/2,$(document).height()/2]);
    var pickRay = scene.camera.getPickRay(pos);
    var focus = scene.globe.pick(pickRay, scene);
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
        var offset = dist * 2.5e-6;

        return Rectangle.fromDegrees(lon-offset, lat-offset, lon+offset, lat+offset);
    }
    else if (map !== undefined) {
        var bnds = map.getBounds();
        return Rectangle.fromDegrees(bnds.getWest(), bnds.getSouth(), bnds.getEast(), bnds.getNorth());
    }
}

function flyToPosition(scene, position, durationMilliseconds) {
    var camera = scene.camera;
    var startPosition = camera.position;
    var endPosition = position;

    durationMilliseconds = defaultValue(durationMilliseconds, 200);

    var initialEnuToFixed = Transforms.eastNorthUpToFixedFrame(startPosition, Ellipsoid.WGS84);

    var initialEnuToFixedRotation = new Matrix4();
    Matrix4.getRotation(initialEnuToFixed, initialEnuToFixedRotation);
    
    var initialFixedToEnuRotation = new Matrix3();
    Matrix3.transpose(initialEnuToFixedRotation, initialFixedToEnuRotation);

    var initialEnuUp = new Matrix3();
    Matrix3.multiplyByVector(initialFixedToEnuRotation, camera.up, initialEnuUp);

    var initialEnuRight = new Matrix3();
    Matrix3.multiplyByVector(initialFixedToEnuRotation, camera.right, initialEnuRight);

    var initialEnuDirection = new Matrix3();
    Matrix3.multiplyByVector(initialFixedToEnuRotation, camera.direction, initialEnuDirection);

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

            var enuToFixedRotation = new Matrix3();
            Matrix4.getRotation(enuToFixed, enuToFixedRotation);

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

function zoomCamera(scene, distFactor, pos) { 
    var camera = scene.camera;
    var pickRay = camera.getPickRay(pos);
    var targetCartesian = scene.globe.pick(pickRay, scene);
    if (targetCartesian) {
        // Zoom to the picked latitude/longitude, at a distFactor multiple
        // of the height.
        var targetCartographic = Ellipsoid.WGS84.cartesianToCartographic(targetCartesian);
        var cameraCartographic = Ellipsoid.WGS84.cartesianToCartographic(camera.position);
        targetCartographic.height = cameraCartographic.height - (cameraCartographic.height - targetCartographic.height) * distFactor;
        targetCartesian = Ellipsoid.WGS84.cartographicToCartesian(targetCartographic);
        flyToPosition(scene, targetCartesian);
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
        rect.east += epsilon;
        rect.west -= epsilon;
    }
    if ((rect.north - rect.south) < epsilon) {
        rect.north += epsilon;
        rect.south -= epsilon;
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

function getWmsFeatureInfo(baseUrl, useProxy, layers, extent, width, height, i, j, useWebMercator, wmsFeatureInfoFilter) {
    var url = baseUrl;
    var indexOfQuestionMark = url.indexOf('?');
    if (indexOfQuestionMark >= 0 && indexOfQuestionMark < url.length - 1) {
        if (url[url.length - 1] !== '&') {
            url += '&';
        }
    } else if (indexOfQuestionMark < 0) {
        url += '?';
    }

    var srs;
    var sw;
    var ne;
    if (useWebMercator) {
        srs = 'EPSG:3857';
        
        var projection = new WebMercatorProjection();
        sw = projection.project(Rectangle.southwest(extent));
        ne = projection.project(Rectangle.northeast(extent));
    } else {
        srs = 'EPSG:4326';
        sw = new Cartesian3(CesiumMath.toDegrees(extent.west), CesiumMath.toDegrees(extent.south), 0.0);
        ne = new Cartesian3(CesiumMath.toDegrees(extent.east), CesiumMath.toDegrees(extent.north), 0.0);
    }

    url += 'service=WMS&request=GetFeatureInfo&version=1.1.1&layers=' + layers + '&query_layers=' + layers + 
           '&srs=' + srs + '&width=' + width + '&height=' + height + '&info_format=application/json' +
           '&x=' + i + '&y=' + j + '&';


    var bbox = sw.x + ',' + sw.y + ',' + ne.x + ',' + ne.y;
    url += 'bbox=' + bbox + '&';

    if (useProxy) {
        url = corsProxy.getURL(url);
    }

    return when(loadJson(url), function(json) {
        if (defined(wmsFeatureInfoFilter)) {
            json = wmsFeatureInfoFilter(json);
        }
        return json;
    }, function (e) {
        // If something goes wrong, try requesting XML instead of GeoJSON.  Then try to interpret it.
        url = url.replace('info_format=application/json', 'info_format=text/xml');
        return loadXML(url);
    });
}

function selectFeatureLeaflet(viewer, latlng) {
    var dataSources = viewer.application.nowViewing.items;

    var pickedXY = viewer.map.latLngToContainerPoint(latlng, viewer.map.getZoom());
    var bounds = viewer.map.getBounds();
    var extent = new Rectangle(CesiumMath.toRadians(bounds.getWest()), CesiumMath.toRadians(bounds.getSouth()), CesiumMath.toRadians(bounds.getEast()), CesiumMath.toRadians(bounds.getNorth()));

    var promises = [];
    for (var i = dataSources.length - 1; i >=0 ; --i) {
        var dataSource = dataSources[i];
        if (dataSource.type === 'wms' || (dataSource.type === 'csv' && defined(dataSource.layers))) {
            var useProxy = corsProxy.shouldUseProxy(dataSource.url);
            promises.push(getWmsFeatureInfo(dataSource.url, useProxy, dataSource.layers, 
                extent, viewer.map.getSize().x, viewer.map.getSize().y, pickedXY.x, pickedXY.y, true, 
                dataSource.wmsFeatureInfoFilter));
        }
    }

    if (promises.length === 0) {
        return;
    }

    selectFeatures(promises, viewer.map, latlng);
}


function selectFeatures(promises, viewer, latlng) {
    var nextPromiseIndex = 0;

    function waitForNextLayersResponse() {
        if (nextPromiseIndex >= promises.length) {
            updatePopup( 'None', 'No features found.');
            return;
        }

        when(promises[nextPromiseIndex++], function(result) {
            function findGoodIdProperty(properties) {
                for (var key in properties) {
                    if (properties.hasOwnProperty(key) && properties[key]) {
                        if (/name/i.test(key) || /title/i.test(key)|| /id/i.test(key)) {
                            return properties[key];
                        }
                    }
                }

                return undefined;
            }

            function describe(properties) {
                var html = '<table class="cesium-infoBox-defaultTable">';
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
            if (result instanceof Document || defined(result.xml)) {
                var json = $.xml2json(result);

                // xml2json returns namespaced property names in IE9.
                if (json['mxp:FeatureCollection']) {
                    json.FeatureCollection = json['mxp:FeatureCollection'];
                    if (json.FeatureCollection['mxp:FeatureMembers']) {
                        json.FeatureCollection.FeatureMembers = json.FeatureCollection['mxp:FeatureMembers'];
                        if (json.FeatureCollection.FeatureMembers['mxp:Feature']) {
                            json.FeatureCollection.FeatureMembers.Feature = json.FeatureCollection.FeatureMembers['mxp:Feature'];
                            if (json.FeatureCollection.FeatureMembers.Feature['mxp:Val']) {
                                json.FeatureCollection.FeatureMembers.Feature.Val = json.FeatureCollection.FeatureMembers.Feature['mxp:Val'];
                            }
                        }
                    }
                }

                var properties;
                if (json.FeatureCollection &&
                    json.FeatureCollection.FeatureMembers && 
                    json.FeatureCollection.FeatureMembers.Feature && 
                    json.FeatureCollection.FeatureMembers.Feature.Val) {

                    properties = {};
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
                } else if (json.FIELDS) {
                    properties = {};
                    result = {
                        features : [
                            {
                                properties : properties
                            }
                        ]
                    };

                    var fields = json.FIELDS;
                    for (var field in fields) {
                        if (fields.hasOwnProperty(field)) {
                            properties[field] = fields[field];
                        }
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
                updatePopup( findGoodIdProperty(feature.properties), describe(feature.properties) );
            } else {
                updatePopup( 'None', 'No features found.');
            }
        }, function() {
            waitForNextLayersResponse();
        });
    }

    waitForNextLayersResponse();

        //create popup but don't show it
    var popup = L.popup({maxHeight: 520 }).setLatLng(latlng);
    function updatePopup(title, text) {
        popup.setContent('<h3><center>'+title+'</center></h3>'+text);
    }
        // Show placeholder text to the infobox so the user knows something is happening.
    updatePopup('', 'Loading WMS feature information...');

        // Wait for .5 seconds to show to let double click through
    setTimeout(function() { popup.openOn(viewer); }, 500);
    
}

module.exports = AusGlobeViewer;
