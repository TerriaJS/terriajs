/*
 *   A collection of additional viewer functionality independent
 *   of datasets
 */

/*global define*/
define([
        'ui/GeoDataWidget',
        'ui/TitleWidget'
    ], function(
        GeoDataWidget,
        TitleWidget) {
    //"use strict";

    //Initialize the selected viewer - Cesium or Leaflet
    var AusGlobeViewer = function(geoDataManager) {

        var titleWidget = new TitleWidget({
            container : document.body
        });

        var div = document.createElement('div');
        div.id = 'controls';
        div.innerHTML = '\
                <span id="zoom_in" class="zoomin_button" title="Zoom in"></span> \
                <span id="zoom_out" class="zoomout_button" title="Zoom out"></span>';
        document.body.appendChild(div);

        div = document.createElement('div');
        div.id = 'settings';
        div.innerHTML = '<span id="settings" class="settings_button" title="Display Settings"></span>';
        document.body.appendChild(div);

        div = document.createElement('div');
        div.id = 'dialogSettings';
        div.class = "dialog";
        div.innerHTML = '<div id="list4" class="list"></div>';
        document.body.appendChild(div);

        div = document.createElement('div');
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

        var css = { 'background': '#333333',
            'color': '#eeeeee',
            'border-color': '#555555',
            'width': '30px',
            'height': '30px',
            'border-radius': '1px'
        };
        $(".zoomin_button").button({
            text: true,
            icons: { primary: "ui-icon-plus" }
        }).css(css);
        $(".zoomout_button").button({
            text: true,
            icons: { primary: "ui-icon-minus" }
        }).css(css);
        $(".settings_button").button({
            text: true,
            icons: { primary: "ui-icon-gear" }
        }).css(css);

        var that = this;
        $("#settings").click(function () {
            that._showSettingsDialog();
        });
        $("#zoom_in").click(function () {
            zoomIn(that.scene);
        });
        $("#zoom_out").click(function () {
            zoomOut(that.scene);
        });

        //TODO: perf test to set environment

        var that = this;
        this.geoDataWidget = new GeoDataWidget(geoDataManager, function (layer) { setCurrentDataset(layer, that); });
        this.geoDataManager = geoDataManager;
        this.scene = undefined;
        this.viewer = undefined;
        this.map = undefined;

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
    function cartographictoDegreeString(scene, cartographic) {
        var strNS = cartographic.latitude < 0 ? 'S' : 'N';
        var strWE = cartographic.longitude < 0 ? 'W' : 'E';
        var text = 'lat <strong>' + Math.abs(Cesium.Math.toDegrees(cartographic.latitude)).toFixed(3) + '</strong> ' + strNS +
            ' lon <strong>' + Math.abs(Cesium.Math.toDegrees(cartographic.longitude)).toFixed(3) + '</strong> ' + strWE;
        return text;
    }

    function cartesianToDegreeString(scene, cartesian) {
        var globe = scene.globe;
        var ellipsoid = globe.ellipsoid;
        var cartographic = ellipsoid.cartesianToCartographic(cartesian);
        return cartographictoDegreeString(scene, cartographic);
    }

    function rectangleToDegreeString(scene, rect) {
        var nw = new Cesium.Cartographic(rect.west, rect.north);
        var se = new Cesium.Cartographic(rect.east, rect.south);
        var text = 'NW: ' + cartographictoDegreeString(scene, nw);
        text += ', SE: ' + cartographictoDegreeString(scene, se);
        return text;
    }

    // -------------------------------------------
    // Camera management
    // -------------------------------------------
    function getCameraPos(scene) {
        var ellipsoid = Cesium.Ellipsoid.WGS84;
        var cam_pos = scene.camera.position;
        return ellipsoid.cartesianToCartographic(cam_pos);
    }

    //determine the distance from the camera to a point
    function getCameraDistance(scene, pos) {
        var tx_pos = Cesium.Ellipsoid.WGS84.cartographicToCartesian(
            Cesium.Cartographic.fromDegrees(pos[0], pos[1], pos[2]));
        return Cesium.Cartesian3.magnitude(Cesium.Cartesian3.subtract(tx_pos, scene.camera.position));
    };


    function getCameraSeaLevel(scene) {
        var ellipsoid = Cesium.Ellipsoid.WGS84;
        var cam_pos = scene.camera.position;
        return ellipsoid.cartesianToCartographic(ellipsoid.scaleToGeodeticSurface(cam_pos));
    }


    function getCameraHeight(scene) {
        var ellipsoid = Cesium.Ellipsoid.WGS84;
        var cam_pos = scene.camera.position;
        var camPos = getCameraPos(scene);
        var seaLevel = getCameraSeaLevel(scene);
        return camPos.height - seaLevel.height;
    }

    //Camera extent approx for 2D viewer
    function getCameraFocus(scene) {
        //HACK to get current camera focus
        var pos = Cesium.Cartesian2.fromArray([$(document).width()/2,$(document).height()/2]);
        var focus = scene.camera.pickEllipsoid(pos, Cesium.Ellipsoid.WGS84);
        return focus;
    }
    //Approximate camera extent approx for 2D viewer
    function getCameraRect(scene) {
        var focus = getCameraFocus(scene);
        var focus_cart = Cesium.Ellipsoid.WGS84.cartesianToCartographic(focus);
        var lat = Cesium.Math.toDegrees(focus_cart.latitude);
        var lon = Cesium.Math.toDegrees(focus_cart.longitude);

        var dist = Cesium.Cartesian3.magnitude(Cesium.Cartesian3.subtract(focus, scene.camera.position));
        var offset = dist * 5e-6;

        var rect = Cesium.Rectangle.fromDegrees(lon-offset, lat-offset, lon+offset, lat+offset);
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
        Cesium.when(Cesium.sampleTerrain(scene.globe.terrainProvider, 5, terrainPos), function() {
            terrainPos[0].height += 100;
            if (getCameraHeight(scene) < terrainPos[0].height) {
                var curCamPos = getCameraPos(scene);
                curCamPos.height = terrainPos[0].height;
                scene.camera.position = Cesium.Ellipsoid.WGS84.cartographicToCartesian(curCamPos);
            }
        });
    }

    //TODO: need to make this animate
    function zoomCamera(scene, distFactor, pos) {
        var camera = scene.camera;
        //for now
        if (scene.mode === Cesium.SceneMode.SCENE3D) {
            var cartesian;
            if (pos === undefined) {
                cartesian = getCameraFocus(scene);
            }
            else {
                cartesian = camera.pickEllipsoid(pos, Cesium.Ellipsoid.WGS84);
            }
            if (cartesian) {
                //TODO: zoom to point selected by user
//                camera.lookAt(camera.position, cartesian, camera.up);
                var dist = Cesium.Cartesian3.magnitude(Cesium.Cartesian3.subtract(cartesian, camera.position));
                camera.moveForward(dist * distFactor);
            }
        }
        else {
            camera.moveForward(camera.getMagnitude() * distFactor);
        }
    }

    function zoomIn(scene, pos) { zoomCamera(scene, 2.0/3.0, pos); };
    function zoomOut(scene, pos) { zoomCamera(scene, -3.0/2.0, pos); };

    // Move camera to Rectangle
    function updateCameraFromRect(scene, map, rect_in, ms) {
        if (rect_in === undefined) {
            return;
        }
        //check that we're not too close
        var epsilon = Cesium.Math.EPSILON3;
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
            var flight = Cesium.CameraFlightPath.createAnimationRectangle(scene, {
                destination : rect,
                duration: ms
            });
            scene.animations.add(flight);
        }
        else if (map !== undefined) {
            var bnds = [[Cesium.Math.toDegrees(rect.south), Cesium.Math.toDegrees(rect.west)],
                [Cesium.Math.toDegrees(rect.north), Cesium.Math.toDegrees(rect.east)]];
            map.fitBounds(bnds);
        }
    }


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
            var bCamSame = this._lastCam.equalsEpsilon(scene.camera.viewMatrix, Cesium.Math.EPSILON5);
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
        this._mouseHandler = new Cesium.ScreenSpaceEventHandler(this._canvas);
        this._extentPrimitive = new Cesium.RectanglePrimitive();
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
        var e = new Cesium.Rectangle();

        // Re-order so west < east and south < north
        e.west = Math.min(mn.longitude, mx.longitude);
        e.east = Math.max(mn.longitude, mx.longitude);
        e.south = Math.min(mn.latitude, mx.latitude);
        e.north = Math.max(mn.latitude, mx.latitude);

        // Check for approx equal (shouldn't require abs due to re-order)
        var epsilon = Cesium.Math.EPSILON6;

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
        var toRad = Cesium.Math.toRadians;
        var mn = new Cesium.Cartographic(toRad(w), toRad(s));
        var mx = new Cesium.Cartographic(toRad(e), toRad(n));
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
            }, Cesium.ScreenSpaceEventType.LEFT_UP, Cesium.KeyboardEventModifier.SHIFT);
            this._mouseHandler.setInputAction(function (movement) {
                that.handleRegionInter(movement);
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE, Cesium.KeyboardEventModifier.SHIFT);
        }
    };


    DrawExtentHelper.prototype.start = function () {

        var that = this;

        // Now wait for start
        this._mouseHandler.setInputAction(function (movement) {
            that.handleRegionStart(movement);
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.KeyboardEventModifier.SHIFT);
    };

    DrawExtentHelper.prototype.destroy = function () {
        this._scene.primitives.remove(this._extentPrimitive);
    }


    // -------------------------------------------
    // Region Selection
    // -------------------------------------------
    AusGlobeViewer.prototype._enableSelectExtent = function(bActive) {
        if (bActive) {
            this.regionPolylines = new Cesium.PolylineCollection();
            this.scene.primitives.add(this.regionPolylines);
            var that = this;
            this.regionSelect = new DrawExtentHelper(this.scene, function (ext) {
                if (that.regionPolylines.get(0)) {
                    that.regionPolylines.remove(that.regionPolylines.get(0));
                }
                that.geoDataWidget.setExtent(ext);
                if (ext) {
                    updateCameraFromRect(that.scene, that.map, ext, 1000);
                    // Display polyline based on ext
                    var east = ext.east, west = ext.west, north = ext.north, south = ext.south;
                    var ellipsoid = Cesium.Ellipsoid.WGS84;
                    that.regionPolylines.add({
                        positions : ellipsoid.cartographicArrayToCartesianArray(
                            [
                                new Cesium.Cartographic(west, south),
                                new Cesium.Cartographic(west, north),
                                new Cesium.Cartographic(east, north),
                                new Cesium.Cartographic(east, south),
                                new Cesium.Cartographic(west, south)
                            ]),
                        width: 3.0,
                        material : Cesium.Material.fromType('Color', {
                            color : new Cesium.Color(0.8, 0.8, 0.0, 0.5)
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
    function showTimeline() {
        $('.cesium-viewer-timelineContainer').show();
        $('.cesium-viewer-animationContainer').show();
    }

    function hideTimeline() {
        $('.cesium-viewer-timelineContainer').hide();
        $('.cesium-viewer-animationContainer').hide();
    }

    hideTimeline();

    function stopTimeline(viewer) {
        hideTimeline();
        if (viewer !== undefined) {
            viewer.clock.clockRange = Cesium.ClockRange.UNBOUNDED;
            viewer.clock.shouldAnimate = false;
        }
    }

    //update the timeline
    function updateTimeline(viewer, start, finish) {
        if (start === undefined || finish === undefined) {
            stopTimeline(viewer);
            return;
        }
        showTimeline();
        //update clock
        if (viewer !== undefined) {
            var clock = viewer.clock;
            clock.startTime = start;
            clock.currentTime = start;
            clock.stopTime = finish;
            clock.multiplier = start.getSecondsDifference(finish) / 60.0;
            clock.clockRange = Cesium.ClockRange.LOOP_STOP;
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

        if (layer.extent !== undefined) {
            updateCameraFromRect(that.scene, that.map, layer.extent, 1000);
        }
    }


    // Settings dialog
    AusGlobeViewer.prototype._showSettingsDialog = function() {

        $("#dialogSettings").dialog({
            title: 'Settings',
            width: 250,
            height: 250,
            modal: false,
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
                setState: function(val) { that.selectViewer(val); },
            },
            {
                text: 'Water Mask',
                getState: function() { return true; },
                setState: function(val) { alert('NYI'); },
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

        //use our own bing maps key
        Cesium.BingMapsApi.defaultKey = 'Aowa32_DmAxInFM948JlflrBYsiqRIm-SqH1-zp8Btp4Bk-9K6gMKkpUNbPnrSsk';

        var options = {
            homeButton: false,
            sceneModePicker: false,
            navigationInstructionsInitiallyVisible: false,
        };

        //create CesiumViewer
        var viewer = new Cesium.Viewer(container, options);
        var scene = viewer.scene;
        var canvas = scene.canvas;
        var globe = scene.globe;
        var ellipsoid = globe.ellipsoid;
        var camera = scene.camera;

        //set to bing with labels and small terrain
        viewer.baseLayerPicker.viewModel.selectedImagery = viewer.baseLayerPicker.viewModel.imageryProviderViewModels[1];
        viewer.baseLayerPicker.viewModel.selectedTerrain = viewer.baseLayerPicker.viewModel.terrainProviderViewModels[2];

        globe.terrainProvider.hasWaterMask = function () { return false; };
        globe.depthTestAgainstTerrain = false


        //TODO: replace cesium & bing icon with hightlighted text like leaflet to reduce footprint
//        var creditDisplay = scene.frameState.creditDisplay;
//        var cesiumCredit = new Cesium.Credit('Cesium', '', 'http://cesiumjs.org/');
//        creditDisplay.addDefaultCredit(cesiumCredit);

        //TODO: set based on platform
//        globe.tileCacheSize *= 2;

        // Add double click zoom
        var that = this;
        this.mouseZoomHandler = new Cesium.ScreenSpaceEventHandler(canvas);
        this.mouseZoomHandler.setInputAction(
            function (movement) {
                zoomIn(that.scene, movement.position);
            },
            Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        this.mouseZoomHandler.setInputAction(
            function (movement) {
                zoomOut(that.scene, movement.position);
            },
            Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK, Cesium.KeyboardEventModifier.SHIFT);


        // Show mouse position and height if terrain on
        this.mouseOverPosHandler = new Cesium.ScreenSpaceEventHandler(canvas);
        this.mouseOverPosHandler.setInputAction( function (movement) {
            var terrainProvider = scene.globe.terrainProvider;
            var cartesian = camera.pickEllipsoid(movement.endPosition, ellipsoid);
            if (cartesian) {
                if (terrainProvider instanceof Cesium.EllipsoidTerrainProvider) {
                    //flat earth
                    document.getElementById('position').innerHTML = cartesianToDegreeString(scene, cartesian);
                }
                else {
                    var cartographic = ellipsoid.cartesianToCartographic(cartesian);
                    var terrainPos = [cartographic];
                    function sampleTerrainSuccess() {
                        var text = cartesianToDegreeString(scene, cartesian);
                        text += ' elev <strong>' + terrainPos[0].height.toFixed(1) + '</strong> m';
                        document.getElementById('position').innerHTML = text;
                    }
                    //TODO: vary tile level based based on camera height
                    var tileLevel = 5;
                    try {
                        Cesium.when(Cesium.sampleTerrain(terrainProvider, tileLevel, terrainPos), sampleTerrainSuccess);
                    } catch (e) {};
                }
            }
            else {
                document.getElementById('position').innerHTML = "";
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);


        //Opening scene
        //TODO: based on perf test to see if we can do some animation at startup
        var e = new Cesium.Cartesian3(-5696178.715241763, 5664619.403367736, -4108462.746194852);
        var v = new Cesium.Cartesian3(0.6306011721197975, -0.6271116358860636, 0.45724518352430904);
        var u = new Cesium.Cartesian3(-0.3415299812150222, 0.3048158142378301, 0.8890695080602443);
        camera.lookAt(e, Cesium.Cartesian3.add(e,v), u);

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
                var bnds = [[Cesium.Math.toDegrees(rect.south), Cesium.Math.toDegrees(rect.west)],
                    [Cesium.Math.toDegrees(rect.north), Cesium.Math.toDegrees(rect.east)]];
                map.fitBounds(bnds);
            }

            //Bing Maps Layer by default
            var layer = new L.BingLayer('Aowa32_DmAxInFM948JlflrBYsiqRIm-SqH1-zp8Btp4Bk-9K6gMKkpUNbPnrSsk');
//            var layer = new L.esri.TiledMapLayer('http://www.ga.gov.au/gis/rest/services/topography/Australian_Topography_WM/MapServer');
            map.addLayer(layer);

            document.getElementById('controls').style.visibility = 'hidden';
            document.getElementById('position').style.visibility = 'hidden';

            //redisplay data
            this.map = map;
            this.geoDataManager.setViewer({scene: undefined, map: map});

            //shut down existing cesium
            if (this.viewer !== undefined) {
                this._enableSelectExtent(false);
                stopTimeline();

                this.mouseOverPosHandler.removeInputAction( Cesium.ScreenSpaceEventType.MOUSE_MOVE );
                this.mouseZoomHandler.removeInputAction( Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK );
                this.mouseZoomHandler.removeInputAction( Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK, Cesium.KeyboardEventModifier.SHIFT );

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
                var rect = Cesium.Rectangle.fromDegrees(bnds.getWest(), bnds.getSouth(), bnds.getEast(), bnds.getNorth());
                updateCameraFromRect(this.scene, undefined, rect, 0);
            }

            this.geoDataManager.setViewer({scene: this.scene, map: undefined});

            this._enableSelectExtent(true);
            stopTimeline(this.viewer);

            document.getElementById('controls').style.visibility = 'visible';
            document.getElementById('position').style.visibility = 'visible';
            /*
             var esri = new Cesium.ArcGisMapServerImageryProvider({
             url: 'http://www.ga.gov.au/gis/rest/services/topography/Australian_Topography/MapServer',
             proxy: new Cesium.DefaultProxy('/proxy/')
             });
             this.scene.globe.imageryLayers.addImageryProvider(esri);
             */
            //remove existing map viewer
            if (this.map !== undefined) {
                this.map.remove();
                this.map = undefined;
            }

        }
    };

    return AusGlobeViewer;
});
