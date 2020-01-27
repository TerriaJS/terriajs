"use strict";

/*global require,describe,it,expect,beforeEach*/
var Cartographic = require("terriajs-cesium/Source/Core/Cartographic").default;
var CesiumMath = require("terriajs-cesium/Source/Core/Math").default;
var CesiumTileLayer = require("../../lib/Map/CesiumTileLayer");
var Color = require("terriajs-cesium/Source/Core/Color").default;
var Ellipsoid = require("terriajs-cesium/Source/Core/Ellipsoid").default;
var Entity = require("terriajs-cesium/Source/DataSources/Entity").default;
var GeoJsonDataSource = require("terriajs-cesium/Source/DataSources/GeoJsonDataSource")
  .default;
var ImageryLayerFeatureInfo = require("terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo")
  .default;
var L = require("leaflet");
var Leaflet = require("../../lib/Models/Leaflet");
var loadJson = require("../../lib/Core/loadJson");
var Terria = require("../../lib/Models/Terria");
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var DEFAULT_ZOOM_LEVEL = 5;

describe("Leaflet Model", function() {
  var terria;
  var leaflet;
  var container, map, layers;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    container = document.createElement("div");
    container.id = "container";
    document.body.appendChild(container);
    map = L.map("container").setView([-28.5, 135], DEFAULT_ZOOM_LEVEL);

    spyOn(terria.tileLoadProgressEvent, "raiseEvent");

    layers = [
      new L.TileLayer("http://example.com"),
      new L.TileLayer("http://example.com"),
      // Make sure there's a non-tile layer in there to make sure we're able to handle those.
      new L.ImageOverlay("http://example.com", L.latLngBounds([1, 1], [3, 3]))
    ];
  });

  afterEach(function() {
    document.body.removeChild(container);
  });

  function initLeaflet() {
    leaflet = new Leaflet(terria, map);
    terria.leaflet = leaflet;
    layers.forEach(function(layer) {
      map.addLayer(layer);
    });
  }

  describe("should trigger a tileLoadProgressEvent", function() {
    ["tileloadstart", "tileload", "load"].forEach(function(event) {
      it("on " + event, function() {
        initLeaflet();

        layers[0].fire(event);

        expect(terria.tileLoadProgressEvent.raiseEvent).toHaveBeenCalled();
      });
    });
  });

  it("should be able to reference its container", function() {
    initLeaflet();
    expect(leaflet.getContainer()).toBe(container);
  });

  it("should trigger a tileLoadProgressEvent with the total number of tiles to be loaded for all layers", function() {
    initLeaflet();

    layers[0]._tiles = {
      1: { loaded: undefined },
      2: { loaded: undefined },
      a: { loaded: +new Date() }, // This is how Leaflet marks loaded tiles
      b: { loaded: undefined }
    };
    layers[1]._tiles = {
      3: { loaded: +new Date() },
      4: { loaded: undefined },
      c: { loaded: +new Date() },
      d: { loaded: undefined }
    };

    layers[1].fire("tileload");

    expect(terria.tileLoadProgressEvent.raiseEvent).toHaveBeenCalledWith(5, 5);
  });

  describe("should change the max", function() {
    it("to whatever the highest count of loading tiles so far was", function() {
      initLeaflet();

      changeTileLoadingCount(3);
      changeTileLoadingCount(6);
      changeTileLoadingCount(8);
      changeTileLoadingCount(2);

      expect(
        terria.tileLoadProgressEvent.raiseEvent.calls.mostRecent().args
      ).toEqual([2, 8]);
    });

    it("to 0 when loading tile count reaches 0", function() {
      initLeaflet();

      changeTileLoadingCount(3);
      changeTileLoadingCount(6);
      changeTileLoadingCount(8);
      changeTileLoadingCount(0);

      expect(
        terria.tileLoadProgressEvent.raiseEvent.calls.mostRecent().args
      ).toEqual([0, 0]);

      changeTileLoadingCount(3);

      expect(
        terria.tileLoadProgressEvent.raiseEvent.calls.mostRecent().args
      ).toEqual([3, 3]);
    });

    function changeTileLoadingCount(count) {
      var tiles = {};
      // Add loading tiles
      for (var i = 0; i < count; i++) {
        tiles["tile " + i] = { loaded: undefined };
      }
      layers[0]._tiles = tiles;
      layers[1]._tiles = {};
      layers[0].fire("tileload");
    }
  });

  describe("feature picking", function() {
    var latlng = { lat: 50, lng: 50 };
    var deferred1, deferred2;

    beforeEach(function() {
      deferred1 = when.defer();
      deferred2 = when.defer();

      terria.nowViewing.items = [
        {
          isEnabled: true,
          isShown: true,
          imageryLayer: new CesiumTileLayer({
            pickFeatures: jasmine
              .createSpy("pickFeatures")
              .and.returnValue(deferred1.promise),
            url: "http://example.com/1",
            ready: true,
            tilingScheme: {
              positionToTileXY: function() {
                return { x: 1, y: 2 };
              }
            }
          })
        },
        {
          isEnabled: true,
          isShown: true,
          imageryLayer: new CesiumTileLayer({
            pickFeatures: jasmine
              .createSpy("pickFeatures")
              .and.returnValue(deferred2.promise),
            url: "http://example.com/2",
            ready: true,
            tilingScheme: {
              positionToTileXY: function() {
                return { x: 4, y: 5 };
              }
            }
          })
        },
        {
          isEnabled: false,
          isShown: true,
          imageryLayer: new CesiumTileLayer({
            pickFeatures: jasmine.createSpy("pickFeatures"),
            url: "http://example.com/3",
            ready: true,
            tilingScheme: {
              positionToTileXY: function() {
                return { x: 1, y: 2 };
              }
            }
          })
        },
        {
          isEnabled: false,
          isShown: true,
          imageryLayer: new CesiumTileLayer({
            pickFeatures: jasmine.createSpy("pickFeatures"),
            url: "http://example.com/4",
            ready: true,
            tilingScheme: {
              positionToTileXY: function() {
                return { x: 1, y: 2 };
              }
            }
          })
        }
      ];
    });

    describe("from location", function() {
      beforeEach(function() {
        initLeaflet();
      });

      commonFeaturePickingTests(function() {
        leaflet.pickFromLocation(latlng, {});
      });

      it("uses tileCoordinates when provided", function() {
        leaflet.pickFromLocation(latlng, {
          "http://example.com/1": { x: 100, y: 200, level: 300 },
          "http://example.com/2": { x: 400, y: 500, level: 600 }
        });

        expect(
          terria.nowViewing.items[0].imageryLayer.imageryProvider.pickFeatures.calls.argsFor(
            0
          )[0]
        ).toBe(100);
        expect(
          terria.nowViewing.items[0].imageryLayer.imageryProvider.pickFeatures.calls.argsFor(
            0
          )[1]
        ).toBe(200);
        expect(
          terria.nowViewing.items[0].imageryLayer.imageryProvider.pickFeatures.calls.argsFor(
            0
          )[2]
        ).toBe(300);

        expect(
          terria.nowViewing.items[1].imageryLayer.imageryProvider.pickFeatures.calls.argsFor(
            0
          )[0]
        ).toBe(400);
        expect(
          terria.nowViewing.items[1].imageryLayer.imageryProvider.pickFeatures.calls.argsFor(
            0
          )[1]
        ).toBe(500);
        expect(
          terria.nowViewing.items[1].imageryLayer.imageryProvider.pickFeatures.calls.argsFor(
            0
          )[2]
        ).toBe(600);
      });

      it("adds existingFeatures to end result", function(done) {
        var existing = new ImageryLayerFeatureInfo();
        existing.name = "existing";
        leaflet.pickFromLocation(latlng, {}, [existing]);
        finishPickingPromise();

        terria.pickedFeatures.allFeaturesAvailablePromise
          .then(function() {
            expect(terria.pickedFeatures.features[0].name).toBe("existing");
          })
          .then(done)
          .otherwise(done.fail);
      });
    });

    describe("from click", function() {
      var click;

      beforeEach(function() {
        spyOn(map, "on").and.callFake(function(type, callback) {
          if (type === "click") {
            click = callback;
          }
        });

        initLeaflet();
      });

      commonFeaturePickingTests(function() {
        click({
          latlng: latlng
        });
      });

      describe("when combining vector and raster features", function() {
        var vectorFeature1, vectorFeature2;

        beforeEach(function() {
          vectorFeature1 = new Entity({
            name: "vector1"
          });
          vectorFeature2 = new Entity({
            name: "vector2"
          });
        });

        it("includes vector features with click events both before and after the map click event", function(done) {
          // vector and map clicks can come in any order.
          leaflet.scene.featureClicked.raiseEvent(vectorFeature1, {
            latlng: latlng
          });
          click({
            latlng: latlng
          });
          leaflet.scene.featureClicked.raiseEvent(vectorFeature2, {
            latlng: latlng
          });

          finishPickingPromise();

          terria.pickedFeatures.allFeaturesAvailablePromise
            .then(function() {
              expect(terria.pickedFeatures.features.length).toBe(5);
              expect(terria.pickedFeatures.features[0].name).toBe("vector1");
              expect(terria.pickedFeatures.features[1].name).toBe("vector2");
              expect(terria.pickedFeatures.features[2].name).toBe("1");
            })
            .then(done)
            .otherwise(done.fail);
        });

        it("resets the picked vector features if a subsequent map click is made", function(done) {
          leaflet.scene.featureClicked.raiseEvent(vectorFeature1, {
            latlng: latlng
          });
          click({
            latlng: latlng
          });
          leaflet.scene.featureClicked.raiseEvent(vectorFeature2, {
            latlng: latlng
          });

          // The reset happens in a runLater, which a second click will always come behind in a browser,
          // but this isn't guaranteed in unit tests because they're just two setTimeouts racing each other,
          // so give this a healthy 50ms delay to make sure it comes in behind the 0ms delay in Leaflet.js.
          setTimeout(function() {
            click({
              latlng: latlng
            });
            finishPickingPromise();
            terria.pickedFeatures.allFeaturesAvailablePromise
              .then(function() {
                expect(terria.pickedFeatures.features.length).toBe(3);
                expect(terria.pickedFeatures.features[0].name).toBe("1");
              })
              .then(done)
              .otherwise(done.fail);
          }, 50);
        });
      });
    });

    function commonFeaturePickingTests(trigger) {
      it("correctly tracks loading state", function(done) {
        expect(terria.pickedFeatures).toBeUndefined();

        trigger();

        expect(terria.pickedFeatures.isLoading).toBe(true);

        finishPickingPromise();

        terria.pickedFeatures.allFeaturesAvailablePromise
          .then(function() {
            expect(terria.pickedFeatures.isLoading).toBe(false);
          })
          .then(done)
          .otherwise(done.fail);
      });

      it("should load imagery layer features when feature info requests are enabled", function(done) {
        terria.allowFeatureInfoRequests = true;
        trigger();

        expect(terria.pickedFeatures.isLoading).toBe(true);

        var featureInfo1 = new ImageryLayerFeatureInfo();
        var featureInfo2 = new ImageryLayerFeatureInfo();

        featureInfo1.name = "name1";
        featureInfo2.name = "name2";

        deferred1.resolve([featureInfo1]);
        deferred2.resolve([featureInfo2]);

        terria.pickedFeatures.allFeaturesAvailablePromise
          .then(function() {
            expect(terria.pickedFeatures.isLoading).toBe(false);
            expect(terria.pickedFeatures.features.length).toBe(2);
            expect(terria.pickedFeatures.features[0].name).toBe("name1");
            expect(terria.pickedFeatures.features[1].name).toBe("name2");
          })
          .then(done)
          .otherwise(done.fail);
      });

      it("should not load imagery layer features when feature info requests are disabled", function(done) {
        terria.allowFeatureInfoRequests = false;
        trigger();

        terria.pickedFeatures.allFeaturesAvailablePromise
          .then(function() {
            expect(terria.pickedFeatures.isLoading).toBe(false);
            expect(terria.pickedFeatures.features.length).toBe(0);
          })
          .then(done)
          .otherwise(done.fail);
      });

      it("records pickPosition", function() {
        trigger();

        expect(terria.pickedFeatures.pickPosition).toEqual(
          Ellipsoid.WGS84.cartographicToCartesian(
            Cartographic.fromDegrees(50, 50)
          )
        );
      });

      describe("after feature picked", function() {
        beforeEach(trigger);

        it("populates terria.pickedFeatures", function() {
          expect(terria.pickedFeatures).toBeDefined();
          expect(
            terria.pickedFeatures.allFeaturesAvailablePromise
          ).toBeDefined();
        });

        it("calls pickFeatures for all enabled and shown layers", function() {
          expect(
            terria.nowViewing.items[0].imageryLayer.imageryProvider.pickFeatures
          ).toHaveBeenCalledWith(
            1,
            2,
            DEFAULT_ZOOM_LEVEL,
            CesiumMath.toRadians(50),
            CesiumMath.toRadians(50)
          );
          expect(
            terria.nowViewing.items[1].imageryLayer.imageryProvider.pickFeatures
          ).toHaveBeenCalledWith(
            4,
            5,
            DEFAULT_ZOOM_LEVEL,
            CesiumMath.toRadians(50),
            CesiumMath.toRadians(50)
          );
          expect(
            terria.nowViewing.items[2].imageryLayer.imageryProvider.pickFeatures
          ).not.toHaveBeenCalled();
          expect(
            terria.nowViewing.items[3].imageryLayer.imageryProvider.pickFeatures
          ).not.toHaveBeenCalled();
        });

        describe("after pickFeatures returns for all layers", function() {
          beforeEach(function(done) {
            finishPickingPromise();

            terria.pickedFeatures.allFeaturesAvailablePromise
              .then(done)
              .otherwise(done.fail);
          });

          it("combines promise results", function() {
            expect(terria.pickedFeatures.features[0].name).toBe("1");
            expect(terria.pickedFeatures.features[1].name).toBe("2");
            expect(terria.pickedFeatures.features[2].name).toBe("3");
          });

          it("records pick coords", function() {
            expect(terria.pickedFeatures.providerCoords).toEqual({
              "http://example.com/1": { x: 1, y: 2, level: DEFAULT_ZOOM_LEVEL },
              "http://example.com/2": { x: 4, y: 5, level: DEFAULT_ZOOM_LEVEL }
            });
          });

          it("sets imageryLayer on features", function() {
            expect(terria.pickedFeatures.features[0].imageryLayer).toBe(
              terria.nowViewing.items[0].imageryLayer
            );
            expect(terria.pickedFeatures.features[1].imageryLayer).toBe(
              terria.nowViewing.items[1].imageryLayer
            );
          });
        });
      });
    }

    it("should create GeoJSON for polygon when a rasterized polygon feature is selected", function(done) {
      loadJson("test/GeoJSON/polygon.geojson")
        .then(function(polygonGeoJson) {
          initLeaflet();

          var entity = new Entity();
          entity.data = polygonGeoJson;

          terria.selectedFeature = entity;

          expect(terria.leaflet._highlightPromise).toBeDefined();
          expect(terria.leaflet._removeHighlightCallback).toBeDefined();

          return terria.leaflet._highlightPromise.then(function() {
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
          initLeaflet();

          var entity = new Entity();
          entity.data = polylineGeoJson;

          terria.selectedFeature = entity;

          expect(terria.leaflet._highlightPromise).toBeDefined();
          expect(terria.leaflet._removeHighlightCallback).toBeDefined();

          return terria.leaflet._highlightPromise.then(function() {
            expect(terria.dataSources.length).toBe(1);
            expect(terria.dataSources.get(0) instanceof GeoJsonDataSource).toBe(
              true
            );
          });
        })
        .then(done)
        .otherwise(done.fail);
    });

    it("should update the style of a vector polygon when selected", function(done) {
      GeoJsonDataSource.load("test/GeoJSON/polygon.geojson")
        .then(function(dataSource) {
          initLeaflet();

          terria.dataSources.add(dataSource);

          var entity = dataSource.entities.values[0];

          terria.selectedFeature = entity;
          expect(entity.polygon.outlineColor.getValue()).toEqual(Color.WHITE);

          terria.selectedFeature = undefined;
          expect(entity.polygon.outlineColor.getValue()).not.toEqual(
            Color.WHITE
          );
        })
        .then(done)
        .otherwise(done.fail);
    });

    it("should update the style of a vector polyline when selected", function(done) {
      GeoJsonDataSource.load("test/GeoJSON/polyline.geojson")
        .then(function(dataSource) {
          initLeaflet();

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

    function finishPickingPromise() {
      var featureInfo1 = new ImageryLayerFeatureInfo();
      featureInfo1.name = "1";
      var featureInfo2 = new ImageryLayerFeatureInfo();
      featureInfo2.name = "2";
      var featureInfo3 = new ImageryLayerFeatureInfo();
      featureInfo3.name = "3";

      deferred1.resolve([featureInfo1]);
      deferred2.resolve([featureInfo2, featureInfo3]);
    }
  });
});
