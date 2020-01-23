"use strict";

/*global require,describe,xdescribe,it,expect,beforeEach*/
var Cartographic = require("terriajs-cesium/Source/Core/Cartographic").default;
var Cesium = require("../../lib/Models/Cesium");
var CesiumMath = require("terriajs-cesium/Source/Core/Math").default;
var CesiumWidget = require("terriajs-cesium/Source/Widgets/CesiumWidget/CesiumWidget")
  .default;
var Color = require("terriajs-cesium/Source/Core/Color").default;
var Ellipsoid = require("terriajs-cesium/Source/Core/Ellipsoid").default;
var Entity = require("terriajs-cesium/Source/DataSources/Entity").default;
var FeatureDetection = require("terriajs-cesium/Source/Core/FeatureDetection")
  .default;
var GeoJsonDataSource = require("terriajs-cesium/Source/DataSources/GeoJsonDataSource")
  .default;
var ImageryLayer = require("terriajs-cesium/Source/Scene/ImageryLayer").default;
var ImageryLayerFeatureInfo = require("terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo")
  .default;
var loadJson = require("../../lib/Core/loadJson");
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var SceneTransforms = require("terriajs-cesium/Source/Scene/SceneTransforms")
  .default;
var supportsWebGL = require("../../lib/Core/supportsWebGL");
var Terria = require("../../lib/Models/Terria");
var TileBoundingRegion = require("terriajs-cesium/Source/Scene/TileBoundingRegion")
  .default;
var TileCoordinatesImageryProvider = require("terriajs-cesium/Source/Scene/TileCoordinatesImageryProvider")
  .default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var describeIfSupported = supportsWebGL() ? describe : xdescribe;

describeIfSupported("Cesium Model", function() {
  var terria;
  var cesium;
  var container;
  var LAT_DEGREES = 50;
  var LONG_DEGREES = 100;
  var HEIGHT = 1000;
  var LAT_RAD = CesiumMath.toRadians(LAT_DEGREES);
  var LONG_RAD = CesiumMath.toRadians(LONG_DEGREES);
  var EXPECTED_POS = Ellipsoid.WGS84.cartographicToCartesian(
    Cartographic.fromDegrees(LONG_DEGREES, LAT_DEGREES, HEIGHT)
  );
  var RECTANGLE_CONTAINING_EXPECTED_POS = new Rectangle(
    LONG_RAD - 0.1,
    LAT_RAD - 0.1,
    LONG_RAD + 0.1,
    LAT_RAD + 0.1
  );
  var expectedPosScreenCoords;

  var imageryLayers, imageryLayerPromises;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    container = document.createElement("div");
    container.id = "container";
    document.body.appendChild(container);

    spyOn(terria.tileLoadProgressEvent, "raiseEvent");

    var cesiumWidget = new CesiumWidget(container, {
      imageryProvider: new TileCoordinatesImageryProvider()
    });

    spyOn(cesiumWidget.screenSpaceEventHandler, "setInputAction");

    cesium = new Cesium(terria, cesiumWidget);
    cesium.scene.globe._imageryLayerCollection.removeAll(true);

    expectedPosScreenCoords = SceneTransforms.wgs84ToWindowCoordinates(
      cesium.scene,
      EXPECTED_POS
    );

    imageryLayers = [];
    imageryLayerPromises = [];

    var IMAGERY_PROVIDER_URLS = [
      "http://example.com/1",
      "http://example.com/2"
    ];
    IMAGERY_PROVIDER_URLS.forEach(function(url) {
      var provider = new TileCoordinatesImageryProvider();
      provider.url = url;

      var deferred = when.defer();
      spyOn(provider, "pickFeatures").and.returnValue(deferred.promise);
      imageryLayerPromises.push(deferred);

      var layer = new ImageryLayer(provider);
      layer._rectangle = RECTANGLE_CONTAINING_EXPECTED_POS;
      imageryLayers.push(layer);
      cesium.scene.globe._imageryLayerCollection.add(layer);
    });

    terria.cesium = cesium;
  });

  afterEach(function() {
    cesium.viewer.destroy();
    document.body.removeChild(container);
  });

  it("should be able to reference its container", function() {
    expect(cesium.getContainer()).toBe(container);
  });

  it("should trigger terria.tileLoadProgressEvent on globe tileLoadProgressEvent", function() {
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(3);

    expect(terria.tileLoadProgressEvent.raiseEvent).toHaveBeenCalledWith(3, 3);
  });

  it("should retain the maximum length of tiles to be loaded", function() {
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(3);
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(7);
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(4);
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(2);

    expect(terria.tileLoadProgressEvent.raiseEvent).toHaveBeenCalledWith(2, 7);
  });

  it("should reset maximum length when the number of tiles to be loaded reaches 0", function() {
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(3);
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(7);
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(4);
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(0);

    expect(
      terria.tileLoadProgressEvent.raiseEvent.calls.mostRecent().args
    ).toEqual([0, 0]);

    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(2);

    expect(
      terria.tileLoadProgressEvent.raiseEvent.calls.mostRecent().args
    ).toEqual([2, 2]);
  });

  describe("feature picking", function() {
    describe("via pickFromLocation", function() {
      it("should populate terria.pickedFeatures", function() {
        expect(terria.pickedFeatures).toBeUndefined();

        cesium.pickFromLocation(
          { lat: LAT_DEGREES, lng: LONG_DEGREES, height: HEIGHT },
          {}
        );

        expect(terria.pickedFeatures).not.toBeUndefined();
        expect(terria.pickedFeatures.pickPosition).toEqual(EXPECTED_POS);
        expect(
          terria.pickedFeatures.allFeaturesAvailablePromise
        ).not.toBeUndefined();
      });

      it("should pass tile coordinates to associated imagery provider", function() {
        cesium.pickFromLocation(
          { lat: LAT_DEGREES, lng: LONG_DEGREES, height: HEIGHT },
          {
            "http://example.com/1": { x: 1, y: 2, level: 3 },
            "http://example.com/2": { x: 4, y: 5, level: 6 }
          }
        );

        expect(
          imageryLayers[0]._imageryProvider.pickFeatures.calls.argsFor(0)
        ).toEqual([1, 2, 3, LONG_RAD, LAT_RAD]);
        expect(
          imageryLayers[1]._imageryProvider.pickFeatures.calls.argsFor(0)
        ).toEqual([4, 5, 6, LONG_RAD, LAT_RAD]);
      });

      testFeatureInfoProcessing(function() {
        cesium.pickFromLocation(
          { lat: LAT_DEGREES, lng: LONG_DEGREES, height: HEIGHT },
          {
            "http://example.com/1": { x: 1, y: 2, level: 3 },
            "http://example.com/2": { x: 4, y: 5, level: 6 }
          }
        );
      });

      it("existing features are included in pickFeatures along with ones got from imagery layers", function(done) {
        var existingFeatures = [
          new ImageryLayerFeatureInfo(),
          new ImageryLayerFeatureInfo()
        ];

        existingFeatures[0].name = "1";
        existingFeatures[1].name = "2";

        cesium.pickFromLocation(
          { lat: LAT_DEGREES, lng: LONG_DEGREES, height: HEIGHT },
          {
            "http://example.com/1": {
              x: 1,
              y: 2,
              level: 3
            }
          },
          existingFeatures
        );

        var imageryLayerFeatureInfo = new ImageryLayerFeatureInfo();
        imageryLayerFeatureInfo.name = "3";
        imageryLayerPromises[0].resolve([imageryLayerFeatureInfo]);

        terria.pickedFeatures.allFeaturesAvailablePromise
          .then(function() {
            expect(terria.pickedFeatures.features[0].name).toBe("1");
            expect(terria.pickedFeatures.features[1].name).toBe("2");
            expect(terria.pickedFeatures.features[2].name).toBe("3");
          })
          .then(done)
          .otherwise(done.fail);
      });

      it("should load imagery layer features when feature info requests are enabled", function(done) {
        terria.allowFeatureInfoRequests = true;

        cesium.pickFromLocation(
          { lat: LAT_DEGREES, lng: LONG_DEGREES, height: HEIGHT },
          {
            "http://example.com/1": {
              x: 1,
              y: 2,
              level: 3
            }
          }
        );

        expect(terria.pickedFeatures.isLoading).toBe(true);

        var featureInfo = new ImageryLayerFeatureInfo();
        featureInfo.name = "A";
        imageryLayerPromises[0].resolve([featureInfo]);

        terria.pickedFeatures.allFeaturesAvailablePromise
          .then(function() {
            expect(terria.pickedFeatures.isLoading).toBe(false);
            expect(terria.pickedFeatures.features.length).toBe(1);
            expect(terria.pickedFeatures.features[0].name).toBe("A");
          })
          .then(done)
          .otherwise(done.fail);
      });

      it("should not load imagery layer features when feature info requests are disabled", function(done) {
        terria.allowFeatureInfoRequests = false;
        cesium.pickFromLocation(
          { lat: LAT_DEGREES, lng: LONG_DEGREES, height: HEIGHT },
          {
            "http://example.com/1": {
              x: 1,
              y: 2,
              level: 3
            }
          }
        );

        terria.pickedFeatures.allFeaturesAvailablePromise
          .then(function() {
            expect(terria.pickedFeatures.isLoading).toBe(false);
            expect(terria.pickedFeatures.features.length).toBe(0);
          })
          .then(done)
          .otherwise(done.fail);
      });

      stateTests(function() {
        cesium.pickFromLocation(
          { lat: LAT_DEGREES, lng: LONG_DEGREES, height: HEIGHT },
          {
            "http://example.com/1": {
              x: 1,
              y: 2,
              level: 3
            }
          }
        );
      });
    });

    describe("via clicking the screen", function() {
      var doClick;

      beforeEach(function() {
        // There should be some way to make this work without cheating like this but I can't figure out how.
        spyOn(cesium.scene.globe, "pick").and.returnValue(EXPECTED_POS);
        doClick = cesium.viewer.screenSpaceEventHandler.setInputAction.calls.argsFor(
          0
        )[0];

        var tile = new TileBoundingRegion({
          rectangle: RECTANGLE_CONTAINING_EXPECTED_POS
        });

        tile.data = {
          imagery: imageryLayers.map(function(layer, i) {
            return {
              readyImagery: {
                imageryLayer: layer,
                rectangle: RECTANGLE_CONTAINING_EXPECTED_POS,
                x: i + 1,
                y: i + 2,
                level: i + 3
              },
              textureCoordinateRectangle: {
                x: 0.5,
                z: 0.5,
                y: 0.5,
                w: 0.5
              }
            };
          })
        };

        cesium.scene.globe._surface._tilesToRender = [tile];
      });

      stateTests(function() {
        doClick({ position: expectedPosScreenCoords });
      });

      testFeatureInfoProcessing(function() {
        doClick({ position: expectedPosScreenCoords });
      });

      it("includes vector features alongside raster ones", function(done) {
        var vectorFeatures = [
          {
            id: new Entity({
              name: "entity1"
            })
          },
          {
            primitive: {
              id: new Entity({
                name: "entity2"
              })
            }
          }
        ];

        spyOn(cesium.scene, "drillPick").and.returnValue(vectorFeatures);

        var rasterFeature = new ImageryLayerFeatureInfo();
        rasterFeature.name = "entity3";
        imageryLayerPromises[0].resolve([rasterFeature]);
        imageryLayerPromises[1].resolve([]);

        doClick({ position: expectedPosScreenCoords });

        terria.pickedFeatures.allFeaturesAvailablePromise
          .then(function() {
            expect(cesium.scene.drillPick).toHaveBeenCalledWith(
              expectedPosScreenCoords
            );

            expect(terria.pickedFeatures.features[0].name).toBe("entity1");
            expect(terria.pickedFeatures.features[1].name).toBe("entity2");
            expect(terria.pickedFeatures.features[2].name).toBe("entity3");
          })
          .then(done)
          .otherwise(done.fail);
      });

      it("should load raster features when feature info requests are enabled", function(done) {
        terria.allowFeatureInfoRequests = true;

        doClick({ position: expectedPosScreenCoords });

        expect(terria.pickedFeatures.isLoading).toBe(true);

        var rasterFeature = new ImageryLayerFeatureInfo();
        rasterFeature.name = "A";
        imageryLayerPromises[0].resolve([rasterFeature]);
        imageryLayerPromises[1].resolve([]);

        terria.pickedFeatures.allFeaturesAvailablePromise
          .then(function() {
            expect(terria.pickedFeatures.isLoading).toBe(false);
            expect(terria.pickedFeatures.features.length).toBe(1);
            expect(terria.pickedFeatures.features[0].name).toBe("A");
          })
          .then(done)
          .otherwise(done.fail);
      });

      it("should not load raster features when feature info requests are disabled", function(done) {
        terria.allowFeatureInfoRequests = false;

        doClick({ position: expectedPosScreenCoords });

        terria.pickedFeatures.allFeaturesAvailablePromise
          .then(function() {
            expect(terria.pickedFeatures.isLoading).toBe(false);
            expect(terria.pickedFeatures.features.length).toBe(0);
          })
          .then(done)
          .otherwise(done.fail);
      });

      it("records tile coordinates when getting raster features", function(done) {
        doClick({ position: expectedPosScreenCoords });

        imageryLayerPromises[0].resolve([]);
        imageryLayerPromises[1].resolve([]);

        terria.pickedFeatures.allFeaturesAvailablePromise
          .then(function() {
            expect(
              terria.pickedFeatures.providerCoords["http://example.com/1"]
            ).toEqual({
              x: 1,
              y: 2,
              level: 3
            });
            expect(
              terria.pickedFeatures.providerCoords["http://example.com/2"]
            ).toEqual({
              x: 2,
              y: 3,
              level: 4
            });
          })
          .then(done)
          .otherwise(done.fail);
      });
    });
  });

  // Internet Explorer does not support (and likely never will support) depth textues, so we
  // can't put lines on terrain, so we won't create a highlight for polylines or polygons,
  // so don't try to test for it.
  if (!FeatureDetection.isInternetExplorer()) {
    it("should create GeoJSON for polygon when a rasterized polygon feature is selected", function(done) {
      loadJson("test/GeoJSON/polygon.geojson")
        .then(function(polygonGeoJson) {
          var entity = new Entity();
          entity.data = polygonGeoJson;

          terria.selectedFeature = entity;

          expect(terria.cesium._highlightPromise).toBeDefined();
          expect(terria.cesium._removeHighlightCallback).toBeDefined();

          return terria.cesium._highlightPromise.then(function() {
            expect(terria.dataSources.length).toBe(1);
            expect(terria.dataSources.get(0) instanceof GeoJsonDataSource).toBe(
              true
            );
          });
        })
        .then(done)
        .otherwise(done.fail);
    });

    it("should create GeoJSON for polyline when a rasterized polyline feature is selected", function(done) {
      loadJson("test/GeoJSON/polyline.geojson")
        .then(function(polylineGeoJson) {
          var entity = new Entity();
          entity.data = polylineGeoJson;

          terria.selectedFeature = entity;

          expect(terria.cesium._highlightPromise).toBeDefined();
          expect(terria.cesium._removeHighlightCallback).toBeDefined();

          return terria.cesium._highlightPromise.then(function() {
            expect(terria.dataSources.length).toBe(1);
            expect(terria.dataSources.get(0) instanceof GeoJsonDataSource).toBe(
              true
            );
          });
        })
        .then(done)
        .otherwise(done.fail);
    });
  }

  it("should update the style of a vector polygon when selected", function(done) {
    GeoJsonDataSource.load("test/GeoJSON/polygon.geojson")
      .then(function(dataSource) {
        terria.dataSources.add(dataSource);

        var entity = dataSource.entities.values[0];

        terria.selectedFeature = entity;
        expect(entity.polygon.outlineColor.getValue()).toEqual(Color.WHITE);

        terria.selectedFeature = undefined;
        expect(entity.polygon.outlineColor.getValue()).not.toEqual(Color.WHITE);
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("should update the style of a vector polyline when selected", function(done) {
    GeoJsonDataSource.load("test/GeoJSON/polyline.geojson")
      .then(function(dataSource) {
        terria.dataSources.add(dataSource);

        var entity = dataSource.entities.values[0];

        terria.selectedFeature = entity;
        expect(entity.polyline.width.getValue()).toEqual(2);

        terria.selectedFeature = undefined;
        expect(entity.polyline.width.getValue()).not.toEqual(2);
      })
      .then(done)
      .otherwise(done.fail);
  });

  function testFeatureInfoProcessing(beforeFn) {
    describe("correctly processes feature info", function() {
      beforeEach(beforeFn);

      it("from imagery providers to a single list of entities", function(done) {
        var featureInfo1 = new ImageryLayerFeatureInfo();
        var featureInfo2 = new ImageryLayerFeatureInfo();
        var featureInfo3 = new ImageryLayerFeatureInfo();

        featureInfo1.name = "name1";
        featureInfo2.name = "name2";
        featureInfo3.name = "name3";

        imageryLayerPromises[0].resolve([featureInfo1]);
        imageryLayerPromises[1].resolve([featureInfo2, featureInfo3]);

        terria.pickedFeatures.allFeaturesAvailablePromise
          .then(function() {
            expect(terria.pickedFeatures.features[0].name).toBe("name2");
            expect(terria.pickedFeatures.features[1].name).toBe("name3");
            expect(terria.pickedFeatures.features[2].name).toBe("name1");

            expect(terria.pickedFeatures.features[0].imageryLayer).toBe(
              imageryLayers[1]
            );
            expect(terria.pickedFeatures.features[1].imageryLayer).toBe(
              imageryLayers[1]
            );
            expect(terria.pickedFeatures.features[2].imageryLayer).toBe(
              imageryLayers[0]
            );
          })
          .then(done)
          .otherwise(done.fail);
      });

      it("from an ImageryLayerFeatureInfo into an Entity", function(done) {
        var featureInfo = new ImageryLayerFeatureInfo();

        featureInfo.name = "name1";
        featureInfo.description = "a description";
        featureInfo.properties = {
          foo: "bar"
        };
        featureInfo.position = Cartographic.fromDegrees(
          LONG_DEGREES,
          LAT_DEGREES,
          HEIGHT
        );
        featureInfo.coords = { x: 1, y: 2, level: 3 };

        imageryLayerPromises[0].resolve([featureInfo]);
        imageryLayerPromises[1].resolve([]);

        terria.pickedFeatures.allFeaturesAvailablePromise
          .then(function() {
            var entity = terria.pickedFeatures.features[0];

            expect(entity.id).toBe("name1");
            expect(entity.name).toBe("name1");
            expect(entity.properties.getValue().foo).toBe("bar");
            expect(entity.imageryLayer).toBe(imageryLayers[0]);
            expect(entity.position._value).toEqual(EXPECTED_POS);
            expect(entity.coords).toEqual({ x: 1, y: 2, level: 3 });

            done();
          })
          .otherwise(done.fail);
      });
    });
  }

  function stateTests(beforeFn) {
    describe("sets state", function() {
      beforeEach(beforeFn);

      it("to loading while load is in progress", function(done) {
        expect(terria.pickedFeatures.isLoading).toBe(true);

        imageryLayerPromises[0].resolve([]);
        imageryLayerPromises[1].resolve([]);

        terria.pickedFeatures.allFeaturesAvailablePromise.then(function() {
          expect(terria.pickedFeatures.isLoading).toBe(false);
          done();
        });
      });

      it("to not loading and error if error occurs", function(done) {
        imageryLayerPromises[0].reject(new Error("test"));

        terria.pickedFeatures.allFeaturesAvailablePromise.then(function() {
          expect(terria.pickedFeatures.isLoading).toBe(false);
          expect(terria.pickedFeatures.error).toBeDefined();
          done();
        });
      });
    });
  }
});
