/*
 *   A collection of additional viewer functionality independent
 *   of datasets
 */

"use strict";

/*global require,console*/
var BingMapsApi = require('terriajs-cesium/Source/Core/BingMapsApi');
var Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');
//var Cesium = require('../Models/Cesium');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var cesiumRequestAnimationFrame = require('terriajs-cesium/Source/Core/requestAnimationFrame');
var clone = require('terriajs-cesium/Source/Core/clone');
var CesiumTerrainProvider = require('terriajs-cesium/Source/Core/CesiumTerrainProvider');
//var CesiumWidget = require('terriajs-cesium/Source/Widgets/CesiumWidget/CesiumWidget');
var createCredit = require('../Map/createCredit');
var createWorldTerrain = require('terriajs-cesium/Source/Core/createWorldTerrain');
var Credit = require('terriajs-cesium/Source/Core/Credit');
var CreditDisplay = require('terriajs-cesium/Source/Scene/CreditDisplay');
var DrawExtentHelper = require('../Map/DrawExtentHelper');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var EllipsoidTerrainProvider = require('terriajs-cesium/Source/Core/EllipsoidTerrainProvider');
var EventHelper = require('terriajs-cesium/Source/Core/EventHelper');
var FeatureDetection = require('terriajs-cesium/Source/Core/FeatureDetection');
var FrameRateMonitor = require('terriajs-cesium/Source/Scene/FrameRateMonitor');
var getElement = require('terriajs-cesium/Source/Widgets/getElement');
var Ion = require('terriajs-cesium/Source/Core/Ion');
var KeyboardEventModifier = require('terriajs-cesium/Source/Core/KeyboardEventModifier');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var L = require('leaflet');
var Leaflet = require('../Models/Leaflet');
var LeafletDataSourceDisplay = require('../Map/LeafletDataSourceDisplay');
var LeafletVisualizer = require('../Map/LeafletVisualizer');
var Matrix3 = require('terriajs-cesium/Source/Core/Matrix3');
var Matrix4 = require('terriajs-cesium/Source/Core/Matrix4');
var runLater = require('../Core/runLater');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var ScreenSpaceEventType = require('terriajs-cesium/Source/Core/ScreenSpaceEventType');
var SingleTileImageryProvider = require('terriajs-cesium/Source/Scene/SingleTileImageryProvider');
var supportsWebGL = require('../Core/supportsWebGL');
var Transforms = require('terriajs-cesium/Source/Core/Transforms');
var Tween = require('terriajs-cesium/Source/ThirdParty/Tween');
var URI = require('urijs');
var ViewerMode = require('../Models/ViewerMode');
var NoViewer = require('../Models/NoViewer');
var when = require('terriajs-cesium/Source/ThirdParty/when');
var reaction = require('mobx').reaction;

//use our own bing maps key
BingMapsApi.defaultKey = undefined;

// Make Cesium think pixelated image rendering is supported, always.
// As a result, Cesium will honor the devicePixelRatio even in browsers (IE) that don't
// support pixelated rendering.  This means the imagery may look slightly blurrier than
// in other browers, but that's better than rendering 4x the pixels in an already
// slow browser!
FeatureDetection.supportsImageRenderingPixelated = function() { return true; };

// Don't let Cesium automatically add its logo. We'll do so manually when necessary.
CreditDisplay._cesiumCreditInitialized = true;

/**
 * The Terria map viewer, utilizing Cesium and Leaflet.
 * @param {Terria} terria The Terria instance.
 * @param {Object} options Object with the following properties:
 * @param {Object} [options.developerAttribution] Attribution for the map developer, displayed at the bottom of the map.  This is an
 *                 object with two properties, `text` and `link`.  `link` is optional and is the URL to open when the user
 *                 clicks on the attribution.
 * @param {String|TerrainProvider} [options.terrain] The terrain to use in the 3D view.  This may be a string, in which case it is loaded using
 *                                 `CesiumTerrainProvider`, or it may be a `TerrainProvider`.  If this property is undefined, STK World Terrain
 *                                 is used.
 * @param {Integer} [options.maximumLeafletZoomLevel] The maximum level to which to allow Leaflet to zoom to.
                    If this property is undefined, Leaflet defaults to level 18.
 */
var TerriaViewer = function(terria, options) {
    options = defaultValue(options, {});

    this._mapContainer = defaultValue(options.mapContainer, 'cesiumContainer');
    this._uiContainer = defaultValue(options.uiContainer, 'ui');
    this._developerAttribution = options.developerAttribution;
    this.maximumLeafletZoomLevel = options.maximumLeafletZoomLevel;

    var webGLSupport = supportsWebGL();  // true, false, or 'slow'
    this._slowWebGLAvailable = webGLSupport === 'slow';
    this._useWebGL = webGLSupport === true;

    if ((terria.viewerMode === ViewerMode.CesiumTerrain || terria.viewerMode === ViewerMode.CesiumEllipsoid) && !this._useWebGL) {
        if (this._slowWebGLAvailable) {
            terria.error.raiseEvent({
                title : 'Poor WebGL performance',
                message : 'Your web browser reports that it has performance issues displaying '+terria.appName+' in 3D, \
so you will see a limited, 2D-only experience. For the full 3D experience, please try using a different web browser, upgrading your video \
drivers, or upgrading your operating system.'
            });
        } else {
            terria.error.raiseEvent({
                title : 'WebGL not supported',
                message : terria.appName+' works best with a web browser that supports <a href="http://get.webgl.org" target="_blank">WebGL</a>, \
including the latest versions of <a href="http://www.google.com/chrome" target="_blank">Google Chrome</a>, \
<a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>, \
<a href="https://www.apple.com/au/osx/how-to-upgrade/" target="_blank">Apple Safari</a>, and \
<a href="http://www.microsoft.com/ie" target="_blank">Microsoft Internet Explorer</a>. \
Your web browser does not appear to support WebGL, so you will see a limited, 2D-only experience.'
            });
        }
        terria.viewerMode = ViewerMode.Leaflet;
    }

    //TODO: perf test to set environment

    this.terria = terria;

    var useCesium = terria.viewerMode !== ViewerMode.Leaflet;
    terria.analytics.logEvent('startup', 'initialViewer', useCesium ? 'cesium' : 'leaflet');

    /** A terrain provider used when ViewerMode === ViewerMode.CesiumTerrain */
    this._bumpyTerrainProvider = undefined;

    /** The terrain provider currently being used - can be either a bumpy terrain provider or a smooth EllipsoidTerrainProvider */
    this._terrain = options.terrain;
    this._terrainProvider = undefined;

    if (defined(this._terrain) && this._terrain.length === 0) {
        this._terrain = undefined;
    }

    if (this._useWebGL) {
        initializeTerrainProvider(this);
    }

    this.selectViewer(useCesium);
    this.observeSubscriptions = [];

    this.observeSubscriptions.push(reaction(() => this.terria.viewerMode, () => {
        changeViewer(this);
    }));

    this._previousBaseMap = this.terria.baseMap;
    // this.observeSubscriptions.push(reaction(() => this.terria.baseMap, () => {
    //     changeBaseMap(this, this.terria.baseMap);
    // }));

    this.observeSubscriptions.push(reaction(() => this.terria.fogSettings, () => {
        changeFogSettings(this);
    }));

    this.observeSubscriptions.push(reaction(() => this.terria.selectBox, () => {
        changeSelectBox(this);
    }));
};

TerriaViewer.create = function(terria, options) {
    return new TerriaViewer(terria, options);
};

function changeSelectBox(viewer) {
    var terria = viewer.terria;
    var selectBox = terria.selectBox;

    if (terria.viewerMode === ViewerMode.Leaflet) {
        if (selectBox) {
            terria.leaflet.map.dragBox.enable();
        } else {
            terria.leaflet.map.dragBox.disable();
        }
    } else {
        if (selectBox) {
            // Add and start a DrawExtentHelper - used by mapInteractionMode with drawRectangle
            viewer._enableSelectExtent(terria.cesium.viewer.scene, false);
            viewer.dragBox = new DrawExtentHelper(terria, terria.cesium.viewer.scene,
                function(ext) {
                    var mapInteractionModeStack = this.terria.mapInteractionModeStack;
                    if (defined(mapInteractionModeStack) && mapInteractionModeStack.length > 0) {
                        if (mapInteractionModeStack[mapInteractionModeStack.length - 1].drawRectangle) {
                            mapInteractionModeStack[mapInteractionModeStack.length - 1].pickedFeatures = clone(ext, true);
                        }
                    }
                }.bind(viewer), KeyboardEventModifier.SHIFT);
            viewer.dragBox.start();
        } else {
            viewer.dragBox.destroy();
            viewer._enableSelectExtent(terria.cesium.viewer.scene, true);
        }
    }
}

function changeViewer(viewer) {
    var terria = viewer.terria;
    var newMode = terria.viewerMode;

    if (newMode === ViewerMode.Leaflet) {
        if (!terria.leaflet) {
            terria.analytics.logEvent('mapSettings', 'switchViewer', '2D');
            viewer.selectViewer(false);
        }
    } else {
        if (!viewer._useWebGL) {
            terria.error.raiseEvent({
                title : 'WebGL not supported or too slow',
                message : '\
Your web browser cannot display the map in 3D, either because it does not support WebGL or because your web browser has reported that WebGL will be extremely slow.  \
Please try a different web browser, such as the latest version of <a href="http://www.google.com/chrome" target="_blank">Google Chrome</a>, \
<a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>, \
<a href="https://www.apple.com/au/osx/how-to-upgrade/" target="_blank">Apple Safari</a>, or \
<a href="http://www.microsoft.com/ie" target="_blank">Microsoft Internet Explorer</a>.  In some cases, you may need to \
upgrade your computer\'s video driver or operating system in order to get the 3D view in ' + terria.appName + '.'
            });

            terria.viewerMode = ViewerMode.Leaflet;
        } else {
            if (newMode === ViewerMode.CesiumTerrain) {
                terria.analytics.logEvent('mapSettings', 'switchViewer', '3D');

                if (defined(terria.leaflet)) {
                    viewer.selectViewer(true);
                } else {
                    terria.cesium.scene.globe.terrainProvider = viewer._bumpyTerrainProvider;
                    CreditDisplay._cesiumCredit = viewer._bumpyTerrainCredit;
                }
            } else if (newMode === ViewerMode.CesiumEllipsoid) {
                terria.analytics.logEvent('mapSettings', 'switchViewer', 'Smooth 3D');

                if (defined(terria.leaflet)) {
                    viewer.selectViewer(true);
                } else {
                    terria.cesium.scene.globe.terrainProvider = new EllipsoidTerrainProvider();
                    CreditDisplay._cesiumCredit = undefined;
                }
            }
        }
    }
}

function changeBaseMap(viewer, newBaseMap) {
    if (defined(viewer._previousBaseMap)) {
        viewer._previousBaseMap.show = false;
        // viewer._previousBaseMap._hide();
        // viewer._previousBaseMap._disable();
    }

    if (defined(newBaseMap)) {
        newBaseMap._enable();
        newBaseMap._show();
        if (defined(viewer.terria.currentViewer)) {
            viewer.terria.currentViewer.lowerToBottom(newBaseMap);
        }
    }

    viewer._previousBaseMap = newBaseMap;

    if (defined(viewer.terria.currentViewer)) {
        // viewer.terria.currentViewer.notifyRepaintRequired();
    }
}

function changeFogSettings(viewer) {
    if (defined(viewer.terria.fogSettings) && defined(viewer.terria.cesium)) {
        var fogSettings = viewer.terria.fogSettings;
        for (var settingKey in fogSettings) {
            if (viewer.terria.cesium.scene.fog.hasOwnProperty(settingKey)) {
                viewer.terria.cesium.scene.fog[settingKey] = fogSettings[settingKey];
            }
        }
    }

}

// -------------------------------------------
// Region Selection
// -------------------------------------------
TerriaViewer.prototype._enableSelectExtent = function(scene, bActive) {
    if (bActive) {
        var that = this;
        this.regionSelect = new DrawExtentHelper(that.terria, scene, function (ext) {
            if (ext) {
                that.terria.currentViewer.zoomTo(ext, 2.0);
            }
        });
        this.regionSelect.start();
    }
    else {
        this.regionSelect.destroy();
    }
};


TerriaViewer.prototype._createCesiumViewer = function(container, CesiumWidget) {

    var that = this;

    initializeTerrainProvider(this);
    var terrainProvider = that._terrainProvider;

    //An arbitrary base64 encoded image used to populate the placeholder SingleTileImageryProvider
    var img = 'data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUA \
AAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO \
9TXL0Y4OHwAAAABJRU5ErkJggg==';

    var options = {
        dataSources:  this.terria.dataSources,
        clock:  this.terria.clock,
        terrainProvider : terrainProvider,
        imageryProvider : new SingleTileImageryProvider({ url: img }),
        scene3DOnly: true
    };

    // Workaround for Firefox bug with WebGL and printing:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=976173
    if (FeatureDetection.isFirefox()) {
        options.contextOptions = {webgl : {preserveDrawingBuffer : true}};
    }

    //create CesiumViewer
    var viewer = new CesiumWidget(container, options);

    // Disable HDR lighting for better performance and to avoid changing imagery colors.
    viewer.scene.highDynamicRange = false;

    viewer.scene.imageryLayers.removeAll();

    //catch Cesium terrain provider down and switch to Ellipsoid
    terrainProvider.errorEvent.addEventListener(function(err) {
        console.log('Terrain provider error.  ', err.message);
        if (viewer.scene.terrainProvider instanceof CesiumTerrainProvider) {
            console.log('Switching to EllipsoidTerrainProvider.');
            that.terria.viewerMode = ViewerMode.CesiumEllipsoid;
            if (!defined(that.TerrainMessageViewed)) {
                that.terria.error.raiseEvent({
                    title : 'Terrain Server Not Responding',
                    message : '\
The terrain server is not responding at the moment.  You can still use all the features of '+that.terria.appName+' \
but there will be no terrain detail in 3D mode.  We\'re sorry for the inconvenience.  Please try \
again later and the terrain server should be responding as expected.  If the issue persists, please contact \
us via email at '+that.terria.supportEmail+'.'
                });
                that.TerrainMessageViewed = true;
            }
        }
    });

    if (defined(this._defaultTerriaCredit)) {
        var containerElement = getElement(container);
        var creditsElement = containerElement && containerElement.getElementsByClassName('cesium-widget-credits')[0];
        var logoContainer = creditsElement && creditsElement.getElementsByClassName('cesium-credit-logoContainer')[0];
        if (logoContainer) {
            creditsElement.insertBefore(this._defaultTerriaCredit.element, logoContainer);
        }
    }

    var scene = viewer.scene;

    scene.globe.depthTestAgainstTerrain = false;

    var d = this._getDisclaimer();
    if (d) {
        scene.frameState.creditDisplay.addDefaultCredit(d);
    }

    if (defined(this._developerAttribution)) {
        scene.frameState.creditDisplay.addDefaultCredit(createCredit(this._developerAttribution.text, this._developerAttribution.link));
    }

    scene.frameState.creditDisplay.addDefaultCredit(new Credit('<a href="http://cesiumjs.org" target="_blank" rel="noopener noreferrer">CESIUM</a>'));

    var inputHandler = viewer.screenSpaceEventHandler;

    // Add double click zoom
    inputHandler.setInputAction(
        function (movement) {
            zoomIn(scene, movement.position);
        },
        ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    inputHandler.setInputAction(
        function (movement) {
            zoomOut(scene, movement.position);
        },
        ScreenSpaceEventType.LEFT_DOUBLE_CLICK, KeyboardEventModifier.SHIFT);

    return viewer;
};

TerriaViewer.prototype.destroy = function () {
    this.terria.beforeViewerChanged.raiseEvent();

    this.terria.

    changeBaseMap(this, undefined);

    this.observeSubscriptions.forEach(subscription => subscription());

    if (defined(this.terria.cesium)) {
        this.destroyCesium();
    } else if (defined(this.terria.leaflet)) {//
        this.destroyLeaflet();
    }

    this.terria.currentViewer = new NoViewer(this.terria);
    this.terria.afterViewerChanged.raiseEvent();
};

TerriaViewer.prototype.destroyCesium = function () {
    const viewer = this.terria.cesium.viewer;

    this.terria.cesium.destroy();

    if (this.cesiumEventHelper) {
        this.cesiumEventHelper.removeAll();
        this.cesiumEventHelper = undefined;
    }

    this.dataSourceDisplay.destroy();//

    this._enableSelectExtent(viewer.scene, false);

    var inputHandler = viewer.screenSpaceEventHandler;
    inputHandler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
    inputHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    inputHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK, KeyboardEventModifier.SHIFT);

    if (defined(this.monitor)) {
        this.monitor.destroy();
        this.monitor = undefined;
    }
    viewer.destroy();
    this.terria.cesium = undefined;
};

TerriaViewer.prototype.destroyLeaflet = function() {
    const map = this.terria.leaflet.map;
    this.terria.leaflet.destroy();

    if (this.leafletEventHelper) {
        this.leafletEventHelper.removeAll();
        this.leafletEventHelper = undefined;
    }

    this.dataSourceDisplay.destroy();
    map.remove();
    this.terria.leaflet = undefined;
};

TerriaViewer.prototype.selectViewer = function(cesium) {

    changeBaseMap(this, undefined);

    this.terria.beforeViewerChanged.raiseEvent();

    var that = this;

    var createViewerPromise = cesium ? this.selectCesium() : this.selectLeaflet();
    createViewerPromise.then(function() {
        that.terria.afterViewerChanged.raiseEvent();
        changeBaseMap(that, that.terria.baseMap);
    });
};

TerriaViewer.prototype.selectLeaflet = function() {
    var map, rect, eventHelper;

    //shut down existing cesium
    if (defined(this.terria.cesium)) {
        //get camera and timeline settings
        try {
            rect =  this.terria.cesium.getCurrentExtent();
        } catch (e) {
            console.log('Using default screen extent', e.message);
            rect =  this.terria.initialView;
        }

        this.destroyCesium();
    }
    else {
        rect =  this.terria.initialView;
    }

    //create leaflet viewer
    map = L.map(this._mapContainer, {
        zoomControl: false,
        attributionControl: false,
        maxZoom: this.maximumLeafletZoomLevel,
        zoomSnap: 1, // Change to  0.2 for incremental zoom when Chrome fixes canvas scaling gaps
        preferCanvas: true,
        worldCopyJump: true
    }).setView([-28.5, 135], 5);

    map.attributionControl = L.control.attribution({
        position: 'bottomleft'
    });
    map.addControl(map.attributionControl);

    map.screenSpaceEventHandler = {
        setInputAction : function() {},
        remoteInputAction : function() {}
    };
    map.destroy = function() {};

    var leaflet = new Leaflet(this.terria, map);

    if (!defined(this.leafletVisualizer)) {
        this.leafletVisualizer = new LeafletVisualizer();
    }

    const terriaLogo = this._defaultTerriaCredit ? this._defaultTerriaCredit.html : '';

    const creditParts = [
        this._getDisclaimer(),
        this._developerAttribution && createCredit(this._developerAttribution.text, this._developerAttribution.link),
        new Credit('<a target="_blank" href="http://leafletjs.com/">Leaflet</a>')
    ];

    map.attributionControl.setPrefix(terriaLogo + creditParts.filter(part => defined(part)).map(credit => credit.html).join(' | '));

    map.on("boxzoomend", function(e) {
        console.log(e.boxZoomBounds);
    });

    this.terria.leaflet = leaflet;
    this.terria.currentViewer =  this.terria.leaflet;

    this.dataSourceDisplay = new LeafletDataSourceDisplay({
        scene : leaflet.scene,
        dataSourceCollection : this.terria.dataSources,
        visualizersCallback: this.leafletVisualizer.visualizersCallback
    });

    eventHelper = new EventHelper();

    var that = this;
    eventHelper.add(that.terria.clock.onTick, function(clock) {
        that.dataSourceDisplay.update(clock.currentTime);
    });

    this.terria.leaflet.dataSourceDisplay = this.dataSourceDisplay;

    this.leafletEventHelper = eventHelper;

    var ticker = function() {
        if (defined(that.terria.leaflet)) {
            that.terria.clock.tick();
            cesiumRequestAnimationFrame(ticker);
        }
    };

    ticker();

    this.terria.leaflet.zoomTo(rect, 0.0);

    return when();
};

TerriaViewer.prototype.selectCesium = function() {
    var deferred = when.defer();

    var that = this;
    require.ensure([
        'terriajs-cesium/Source/Widgets/CesiumWidget/CesiumWidget',
        'terriajs-cesium/Source/DataSources/DataSourceDisplay',
        '../Models/Cesium'
    ], function() {
        var CesiumWidget = require('terriajs-cesium/Source/Widgets/CesiumWidget/CesiumWidget');
        var DataSourceDisplay = require('terriajs-cesium/Source/DataSources/DataSourceDisplay');
        var {default: Cesium} = require('../Models/Cesium');

        var viewer, rect, eventHelper;

        if (defined(that.terria.leaflet)) {
            rect =  that.terria.leaflet.getCurrentExtent();

            that.destroyLeaflet();
        }

        //create Cesium viewer
        viewer = that._createCesiumViewer(that._mapContainer, CesiumWidget);

        that._enableSelectExtent(viewer.scene, true);

        that.terria.cesium = new Cesium(that.terria, viewer);
        that.terria.currentViewer =  that.terria.cesium;
        that.terria.cesium.observeModelLayer();

        changeFogSettings(that);

        //Simple monitor to start up and switch to 2D if seem to be stuck.
        if (!defined(that.checkedStartupPerformance)) {
            that.checkedStartupPerformance = true;
            var uri = new URI(window.location);
            var params = uri.search(true);
            var frameRate = (defined(params.fps)) ? params.fps : 5;

            that.monitor = new FrameRateMonitor({
                scene: viewer.scene,
                minimumFrameRateDuringWarmup: frameRate,
                minimumFrameRateAfterWarmup: 0,
                samplingWindow: 2
            });
            that.monitor.lowFrameRate.addEventListener( function() {
                if (!that.terria.cesium.stoppedRendering) {
                    that.terria.error.raiseEvent({
                        title : 'Unusually Slow Performance Detected',
                        message : 'It appears that your system is capable of running ' + that.terria.appName + ' \
in 3D mode, but is having significant performance issues. \
We are automatically switching to 2D mode to help resolve this issue.  If you want to switch back to 3D mode you can select \
that option from the Maps button at the top of the screen.'
                    });
                    runLater(function() {
                        that.terria.viewerMode = ViewerMode.Leaflet;
                    });
                }
            });
        }

        eventHelper = new EventHelper();

        // eventHelper.add(that.terria.clock.onTick, function(clock) {
        //     that.dataSourceDisplay.update(clock.currentTime);
        // });

        that.cesiumEventHelper = eventHelper;

        // that.dataSourceDisplay = new DataSourceDisplay({
        //     scene : viewer.scene,
        //     dataSourceCollection : that.terria.dataSources
        // });

        that.terria.cesium.dataSourceDisplay = that.dataSourceDisplay;

        if (defined(rect)) {
            that.terria.cesium.zoomTo(rect, 0.0);
        } else {
            that.terria.cesium.zoomTo(that.terria.initialView, 0.0);
        }

        deferred.resolve();
    }, '3D');

    return deferred.promise;
};

TerriaViewer.prototype._getDisclaimer = function() {
    var d = this.terria.configParameters.disclaimer;
    if (d) {
        return createCredit(d.text, d.url);
    } else {
        return null;
    }
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

var destinationScratch = new Cartesian3();

function zoomCamera(scene, distFactor, pos) {
    var camera = scene.camera;
    var pickRay = camera.getPickRay(pos);
    var targetCartesian = scene.globe.pick(pickRay, scene);
    if (targetCartesian) {
        // Zoom to the picked latitude/longitude, at a distFactor multiple
        // of the height.
        var destination = Cartesian3.lerp(camera.position, targetCartesian, distFactor, destinationScratch);
        flyToPosition(scene, destination);
    }
}

function zoomIn(scene, pos) { zoomCamera(scene, 2.0/3.0, pos); }
function zoomOut(scene, pos) { zoomCamera(scene, -2.0, pos); }

function initializeTerrainProvider(terriaViewer) {
    if (defined(terriaViewer._terrainProvider)) {
        return;
    }

    if (terriaViewer.terria.configParameters.cesiumIonAccessToken) {
        Ion.defaultAccessToken = terriaViewer.terria.configParameters.cesiumIonAccessToken;
    }

    if (terriaViewer.terria.configParameters.useCesiumIonTerrain) {
        terriaViewer._bumpyTerrainProvider = createWorldTerrain();
        const logo = require('terriajs-cesium/Source/Assets/Images/ion-credit.png');
        terriaViewer._bumpyTerrainCredit = new Credit('<a href="https://cesium.com/" target="_blank" rel="noopener noreferrer"><img src="' + logo + '" title="Cesium ion"/></a>', true);
    } else if (typeof terriaViewer._terrain === 'string' || terriaViewer._terrain instanceof String) {
        terriaViewer._bumpyTerrainProvider = new CesiumTerrainProvider({
            url: terriaViewer._terrain
        });
        terriaViewer._bumpyTerrainCredit = undefined;
    } else if (defined(terriaViewer._terrain)) {
        terriaViewer._bumpyTerrainProvider = terriaViewer._terrain;
        terriaViewer._bumpyTerrainCredit = undefined;
    } else  {
        terriaViewer._bumpyTerrainProvider = new EllipsoidTerrainProvider();
        terriaViewer._bumpyTerrainCredit = undefined;
    }

    var terria = terriaViewer.terria;
    if (terria.viewerMode === ViewerMode.CesiumTerrain) {
        terriaViewer._terrainProvider = terriaViewer._bumpyTerrainProvider;
        CreditDisplay._cesiumCredit = terriaViewer._bumpyTerrainCredit;

    } else if (terria.viewerMode === ViewerMode.CesiumEllipsoid) {
        terriaViewer._terrainProvider = new EllipsoidTerrainProvider();
        CreditDisplay._cesiumCredit = undefined;
    }
    // add terria logo unless specified not to
    if (!terriaViewer.terria.configParameters.hideTerriaLogo) {
        const terriaLogo = require('../../wwwroot/images/terria-watermark.svg');
        terriaViewer._defaultTerriaCredit = new Credit('<div id="terriaLogoWrapper"><a id="terriaLogo" href="https://terria.io/" target="_blank" rel="noopener noreferrer" ><img src="' + terriaLogo + '" title="Built with Terria"/></a></div>', true);
    } else {
        terriaViewer._defaultTerriaCredit = undefined;
    }
}

module.exports = TerriaViewer;
