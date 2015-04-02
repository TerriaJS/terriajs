/*
 *   A collection of additional viewer functionality independent
 *   of datasets
 */

"use strict";

/*global require,L,URI,$,console,ga*/

var BingMapsApi = require('../../third_party/cesium/Source/Core/BingMapsApi');
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
var Material = require('../../third_party/cesium/Source/Scene/Material');
var Matrix3 = require('../../third_party/cesium/Source/Core/Matrix3');
var Matrix4 = require('../../third_party/cesium/Source/Core/Matrix4');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var RectanglePrimitive = require('../../third_party/cesium/Source/Scene/RectanglePrimitive');
var cesiumRequestAnimationFrame = require('../../third_party/cesium/Source/Core/requestAnimationFrame');
var ScreenSpaceEventHandler = require('../../third_party/cesium/Source/Core/ScreenSpaceEventHandler');
var ScreenSpaceEventType = require('../../third_party/cesium/Source/Core/ScreenSpaceEventType');
var SingleTileImageryProvider = require('../../third_party/cesium/Source/Scene/SingleTileImageryProvider');
var Transforms = require('../../third_party/cesium/Source/Core/Transforms');
var Tween = require('../../third_party/cesium/Source/ThirdParty/Tween');
var Viewer = require('../../third_party/cesium/Source/Widgets/Viewer/Viewer');

var Animation = require('../../third_party/cesium/Source/Widgets/Animation/Animation');
var AnimationViewModel = require('../../third_party/cesium/Source/Widgets/Animation/AnimationViewModel');
var Timeline = require('../../third_party/cesium/Source/Widgets/Timeline/Timeline');
var ClockViewModel = require('../../third_party/cesium/Source/Widgets/ClockViewModel');

var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var FrameRateMonitor = require('../../third_party/cesium/Source/Scene/FrameRateMonitor');
var runLater = require('../Core/runLater');

var Cesium = require('../Models/Cesium');
var Leaflet = require('../Models/Leaflet');
var PopupMessageViewModel = require('../ViewModels/PopupMessageViewModel');
var LeafletVisualizer = require('../Map/LeafletVisualizer');
var ViewerMode = require('../Models/ViewerMode');

//use our own bing maps key
BingMapsApi.defaultKey = undefined;

//Initialize the selected viewer - Cesium or Leaflet
var AusGlobeViewer = function(application) {
    this._distanceLegendBarWidth = undefined;
    this._distanceLegendLabel = undefined;

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
    this._popupSinceLastClick = false;

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
                that.application.currentViewer.zoomTo(ext, 2.0);
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
        timeControlsInitiallyVisible : false,
        scene3DOnly: true,
        selectionIndicator: false,
        infoBox: false
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

    var rect;

    var that = this;

    var timelineVisible = isTimelineVisible();

    if (!bCesium) {

            //shut down existing cesium
        if (defined(this.viewer)) {
            //get camera and timeline settings
            try {
                rect = this.application.cesium.getCurrentExtent();
            } catch (e) {
                console.log('Using default screen extent', e.message);
                rect = this.application.initialView.rectangle;
            }

            this.application.cesium.destroy();

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
            rect = this.application.initialView.rectangle;
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

        var leaflet = new Leaflet(this.application, map);

        if (!defined(this.leafletVisualizer)) {
            this.leafletVisualizer = new LeafletVisualizer();
        }
        this.dataSourceDisplay = new DataSourceDisplay({
            scene : leaflet.scene,
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
                cesiumRequestAnimationFrame(ticker);
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

        //redisplay data
        this.map = map;

        this.application.leaflet = leaflet;
        this.application.cesium = undefined;
        this.application.currentViewer = this.application.leaflet;

        this.application.leaflet.zoomTo(rect, 0.0);
    }
    else {
        if (defined(this.map)) {
            rect = this.application.leaflet.getCurrentExtent();
            this.application.leaflet.destroy();

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

        //create Cesium viewer
        this.viewer = this._createCesiumViewer('cesiumContainer');
        this.scene = this.viewer.scene;

        this.application.cesium = new Cesium(this.application, this.viewer);
        this.application.leaflet = undefined;
        this.application.currentViewer = this.application.cesium;

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

        if (defined(rect)) {
            this.application.cesium.zoomTo(rect, 0.0);
        } else {
            this.application.cesium.zoomTo(this.application.initialView, 0.0);
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


// -------------------------------------------
// Camera management
// -------------------------------------------

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

module.exports = AusGlobeViewer;
