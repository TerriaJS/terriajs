/*
 *   A collection of additional viewer functionality independent
 *   of datasets
 */

"use strict";

/*global require,L,URI,$,Document,html2canvas,console,ga*/

var BingMapsApi = require('../../third_party/cesium/Source/Core/BingMapsApi');
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
var EllipsoidTerrainProvider = require('../../third_party/cesium/Source/Core/EllipsoidTerrainProvider');
var FeatureDetection = require('../../third_party/cesium/Source/Core/FeatureDetection');
var EventHelper = require('../../third_party/cesium/Source/Core/EventHelper');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var InfoBox = require('../../third_party/cesium/Source/Widgets/InfoBox/InfoBox');
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
var SingleTileImageryProvider = require('../../third_party/cesium/Source/Scene/SingleTileImageryProvider');
var Transforms = require('../../third_party/cesium/Source/Core/Transforms');
var Tween = require('../../third_party/cesium/Source/ThirdParty/Tween');
var Viewer = require('../../third_party/cesium/Source/Widgets/Viewer/Viewer');
var WebMercatorProjection = require('../../third_party/cesium/Source/Core/WebMercatorProjection');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var Animation = require('../../third_party/cesium/Source/Widgets/Animation/Animation');
var AnimationViewModel = require('../../third_party/cesium/Source/Widgets/Animation/AnimationViewModel');
var Timeline = require('../../third_party/cesium/Source/Widgets/Timeline/Timeline');
var ClockViewModel = require('../../third_party/cesium/Source/Widgets/ClockViewModel');

var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var FrameRateMonitor = require('../../third_party/cesium/Source/Scene/FrameRateMonitor');
var runLater = require('../Core/runLater');

var corsProxy = require('../Core/corsProxy');
var Cesium = require('../Models/Cesium');
var Leaflet = require('../Models/Leaflet');
var PopupMessageViewModel = require('../ViewModels/PopupMessageViewModel');
var rectangleToLatLngBounds = require('../Map/rectangleToLatLngBounds');
var LeafletVisualizer = require('../Map/LeafletVisualizer');
var ViewerMode = require('../Models/ViewerMode');

//use our own bing maps key
BingMapsApi.defaultKey = undefined;

//Initialize the selected viewer - Cesium or Leaflet
var AusGlobeViewer = function(application) {
    this._distanceLegendBarWidth = undefined;
    this._distanceLegendLabel = undefined;

    var that = this;
    
    var url = window.location;
    var uri = new URI(url);
    var params = uri.search(true);

    var useCesium = (application.userProperties.map === '2d' || params.map === '2d') ? false : true;
    
    if (useCesium && !supportsWebgl()) {
        PopupMessageViewModel.open('ui', {
            title : 'WebGL not supported',
            message : '\
National Map works best with a web browser that supports <a href="http://get.webgl.com" target="_blank">WebGL</a>, \
including the latest versions of <a href="http://www.google.com/chrome" target="_blank">Google Chrome</a>, \
<a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>, \
<a href="https://www.apple.com/au/osx/how-to-upgrade/" target="_blank">Apple Safari</a>, and \
<a href="http://www.microsoft.com/ie" target="_blank">Microsoft Internet Explorer</a>. \
Your web browser does not appear to support WebGL, so you will see a limited, 2D-only experience.'
        });
        useCesium = false;
    }

    if (document.body.clientWidth < 520 || document.body.clientHeight < 400) {
        PopupMessageViewModel.open('ui', {
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

    application.viewerMode = useCesium ? ViewerMode.CesiumTerrain : ViewerMode.Leaflet;
    
    //TODO: perf test to set environment

    this.scene = undefined;
    this.viewer = undefined;
    this.map = undefined;

    this.application = application;

    ga('send', 'event', 'startup', 'initialViewer', useCesium ? 'cesium' : 'leaflet');

    this.selectViewer(useCesium);

    knockout.getObservable(this.application, 'viewerMode').subscribe(function() {
        changeViewer(this);
    }, this);

    this._previousBaseMap = this.application.baseMap;

    knockout.getObservable(this.application, 'baseMap').subscribe(function() {
        changeBaseMap(this, this.application.baseMap);
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
        if (!application.leaflet) {
            ga('send', 'event', 'mapSettings', 'switchViewer', '2D');
            viewer.selectViewer(false);
        }
    } else {
        if (!supportsWebgl()) {
            PopupMessageViewModel.open('ui', {
                title : 'WebGL not supported',
                message : '\
Your web browser cannot display the map in 3D because it does not support WebGL.  Please upgrade to the \
latest version of <a href="http://www.google.com/chrome" target="_blank">Google Chrome</a>, \
<a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>, \
<a href="https://www.apple.com/au/osx/how-to-upgrade/" target="_blank">Apple Safari</a>, or \
<a href="http://www.microsoft.com/ie" target="_blank">Microsoft Internet Explorer</a>.'
            });

            application.viewerMode = ViewerMode.Leaflet;
        } else {
            if (newMode === ViewerMode.CesiumTerrain) {
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
    }
}

function changeBaseMap(viewer, newBaseMap) {
    if (defined(viewer._previousBaseMap)) {
        viewer._previousBaseMap._hide();
        viewer._previousBaseMap._disable();
    }

    if (defined(newBaseMap)) {
        newBaseMap._enable();
        newBaseMap._show();
        newBaseMap.lowerToBottom();
    }

    viewer._previousBaseMap = newBaseMap;

    if (defined(viewer.application.currentViewer)) {
        viewer.application.currentViewer.notifyRepaintRequired();
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
    this._mouseHandler = new ScreenSpaceEventHandler(scene.canvas, false);
    this._stopHandler = undefined;
    this._interHandler = undefined;
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
    this._mouseHandler.removeInputAction(ScreenSpaceEventType.LEFT_UP, KeyboardEventModifier.SHIFT);
    this._mouseHandler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE, KeyboardEventModifier.SHIFT);
    this._mouseHandler.removeInputAction(ScreenSpaceEventType.LEFT_UP);
    this._mouseHandler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);

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
        this._mouseHandler.setInputAction(function (movement) {
            that.handleRegionStop(movement);
        }, ScreenSpaceEventType.LEFT_UP);
        this._mouseHandler.setInputAction(function (movement) {
            that.handleRegionInter(movement);
        }, ScreenSpaceEventType.MOUSE_MOVE);
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
        imageryProvider : new SingleTileImageryProvider({ url: 'images/nicta.png' }),
        timeControlsInitiallyVisible : false
    };

    // Workaround for Firefox bug with WebGL and printing:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=976173
    if (FeatureDetection.isFirefox()) {
        options.contextOptions = {webgl : {preserveDrawingBuffer : true}};
    }

     //create CesiumViewer
    var viewer = new Viewer(container, options);

    viewer.scene.imageryLayers.removeAll();

    viewer.clock.shouldAnimate = false;

    //catch Cesium terrain provider down and switch to Ellipsoid
    terrainProvider.errorEvent.addEventListener(function(err) {
        console.log('Terrain provider error.  ', err.message);
        if (viewer.scene.terrainProvider instanceof CesiumTerrainProvider) {
            console.log('Switching to EllipsoidTerrainProvider.');
            viewer.scene.terrainProvider = new EllipsoidTerrainProvider();
            if (!defined(that.TerrainMessageViewed)) {
                PopupMessageViewModel.open('ui', {
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

    globe.depthTestAgainstTerrain = false;

    scene.frameState.creditDisplay.addDefaultCredit(new Credit('CESIUM', undefined, 'http://cesiumjs.org/'));
    scene.frameState.creditDisplay.addDefaultCredit(new Credit('BING', undefined, 'http://www.bing.com/'));

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

    return viewer;
};

AusGlobeViewer.prototype.isCesium = function() {
    return defined(this.viewer);
};

function isTimelineVisible() {
    return $('.cesium-viewer-animationContainer').css('visibility') === 'visible';
}

AusGlobeViewer.prototype.selectViewer = function(bCesium) {
    var previousClock;
    if (this.viewer) {
        previousClock = Clock.clone(this.viewer.clock);
    } else if (this.map) {
        previousClock = Clock.clone(this.map.clock);
    }

    changeBaseMap(this, undefined);

    this.application.beforeViewerChanged.raiseEvent();

    var bnds, rect;

    var that = this;

    var timelineVisible = isTimelineVisible();

    if (!bCesium) {

            //shut down existing cesium
        if (defined(this.viewer)) {
            this.application.cesium.destroy();

            //get camera and timeline settings
            try {
                rect = getCameraRect(this.scene);
                bnds = [[CesiumMath.toDegrees(rect.south), CesiumMath.toDegrees(rect.west)],
                    [CesiumMath.toDegrees(rect.north), CesiumMath.toDegrees(rect.east)]];
            } catch (e) {
                console.log('Using default screen extent', e.message);
                bnds = rectangleToLatLngBounds(this.application.initialBoundingBox);
            }

            this._enableSelectExtent(false);

            var inputHandler = this.viewer.screenSpaceEventHandler;
            inputHandler.removeInputAction( ScreenSpaceEventType.MOUSE_MOVE );
            inputHandler.removeInputAction( ScreenSpaceEventType.LEFT_DOUBLE_CLICK );
            inputHandler.removeInputAction( ScreenSpaceEventType.LEFT_DOUBLE_CLICK, KeyboardEventModifier.SHIFT );

            if (defined(this.monitor)) {
                this.monitor.destroy();
                this.monitor = undefined;
            }
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

        //redisplay data
        this.map = map;

        this.application.leaflet = new Leaflet(this.application, map);
        this.application.cesium = undefined;
        this.application.currentViewer = this.application.leaflet;

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
    }
    else {
        if (defined(this.map)) {
            this.application.leaflet.destroy();

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

        this.application.cesium = new Cesium(this.application, this.viewer);
        this.application.leaflet = undefined;
        this.application.currentViewer = this.application.cesium;

        this.frameChecker = new FrameChecker();

        // Make sure we re-render when data sources or imagery layers are added or removed.
        this.scene.imageryLayers.layerAdded.addEventListener(this.frameChecker.forceFrameUpdate, this.frameChecker);
        this.scene.imageryLayers.layerRemoved.addEventListener(this.frameChecker.forceFrameUpdate, this.frameChecker);
        this.scene.imageryLayers.layerMoved.addEventListener(this.frameChecker.forceFrameUpdate, this.frameChecker);

        this.viewer.dataSources.dataSourceAdded.addEventListener(this.frameChecker.forceFrameUpdate, this.frameChecker);
        this.viewer.dataSources.dataSourceRemoved.addEventListener(this.frameChecker.forceFrameUpdate, this.frameChecker);

        this.updateCameraFromRect(rect, 0);

        this._enableSelectExtent(true);

        Clock.clone(previousClock, this.viewer.clock);

        //Simple monitor to start up and switch to 2D if seem to be stuck.
        if (!defined(this.checkedStartupPerformance)) {
            this.checkedStartupPerformance = true;
            var uri = new URI(window.location);
            var params = uri.search(true);
            var frameRate = (defined(params.fps)) ? params.fps : 5;

            this.monitor = new FrameRateMonitor({ 
                scene: this.scene, 
                minimumFrameRateDuringWarmup: frameRate,
                minimumFrameRateAfterWarmup: 0,
                samplingWindow: 2
            });
            this.monitor.lowFrameRate.addEventListener( function() {
                if (!that.application.cesium.stoppedRendering) {
                    PopupMessageViewModel.open('ui', {
                        title : 'Unusually Slow Performance Detected',
                        message : '\
        It appears that your system is capable of running National Map in 3D mode, but is having significant performance issues. \
        We are automatically switching to 2D mode to help resolve this issue.  If you want to switch back to 3D mode you can select \
        that option from the Maps button at the top of the screen.'
                    });
                    runLater(function() { 
                        that.selectViewer(false); 
                    });
                }
            });
        }

    }

    this.application.afterViewerChanged.raiseEvent();

    changeBaseMap(this, this.application.baseMap);

    if (timelineVisible) {
        showTimeline(this.viewer);
    } else {
        hideTimeline(this.viewer);
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
    for (var i = 0; i < dataSources.length ; ++i) {
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
