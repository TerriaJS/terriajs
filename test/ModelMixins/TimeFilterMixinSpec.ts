import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction
} from "mobx";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import WebMapServiceImageryProvider from "terriajs-cesium/Source/Scene/WebMapServiceImageryProvider";
import { DiscreteTimeAsJS } from "../../lib/ModelMixins/DiscretelyTimeVaryingMixin";
import MappableMixin from "../../lib/ModelMixins/MappableMixin";
import TimeFilterMixin from "../../lib/ModelMixins/TimeFilterMixin";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import CreateModel from "../../lib/Models/Definition/CreateModel";
import { ModelConstructorParameters } from "../../lib/Models/Definition/Model";
import Terria from "../../lib/Models/Terria";
import mixTraits from "../../lib/Traits/mixTraits";
import TimeFilterTraits from "../../lib/Traits/TraitsClasses/TimeFilterTraits";

describe("TimeFilterMixin", function () {
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria();
  });

  describe("canFilterTimeByFeature", function () {
    it(
      "returns false if timeFilterPropertyName is not set",
      action(function () {
        const testItem = new TestTimeFilterableItem("test", terria);
        expect(testItem.canFilterTimeByFeature).toBe(false);
      })
    );

    it(
      "returns true if timeFilterPropertyName is set",
      action(function () {
        const testItem = new TestTimeFilterableItem("test", terria);
        testItem.setTrait(
          CommonStrata.user,
          "timeFilterPropertyName",
          "filter-dates"
        );
        expect(testItem.canFilterTimeByFeature).toBe(true);
      })
    );
  });

  describe("setTimeFilterFromLocation", function () {
    let item: TestTimeFilterableItem;
    let imageryProvider: ImageryProvider;

    beforeEach(function () {
      item = new TestTimeFilterableItem("test", terria);
      item.setTrait(
        CommonStrata.user,
        "timeFilterPropertyName",
        "availabilityAtLocation"
      );

      imageryProvider = new WebMapServiceImageryProvider({
        url: "test",
        layers: "testlayer"
      });
      item.imageryProviders = [imageryProvider];

      const fullAvailability = [
        "2023-01-01",
        "2023-01-02",
        "2023-01-03",
        "2023-01-04",
        "2023-01-05"
      ];

      item.discreteTimes = fullAvailability.map((time) => ({
        time,
        tag: undefined
      }));
    });

    it(
      "loads the filter with dates available for the given location and updates the timeFilterCoordinates traits",
      action(async function () {
        // Set filter property to provide 2 dates from the available set
        const fakeImageryFeature = new ImageryLayerFeatureInfo();
        fakeImageryFeature.properties = {
          availabilityAtLocation: ["2023-01-02", "2023-01-03"]
        };
        spyOn(imageryProvider, "pickFeatures").and.returnValue(
          Promise.resolve([fakeImageryFeature])
        );

        await item.setTimeFilterFromLocation({
          // Position to pick
          position: {
            // in degrees
            latitude: -37.831,
            longitude: 144.973
          },
          // Coordinates of the tiles
          tileCoords: {
            x: 1,
            y: 2,
            level: 3
          }
        });

        expect(
          runInAction(() => item.discreteTimesAsSortedJulianDates)?.map((dt) =>
            dt.time.toString()
          )
        ).toEqual(["2023-01-02T00:00:00Z", "2023-01-03T00:00:00Z"]);
      })
    );

    it("should correctly update the timeFilterCoordinates", async function () {
      // Set filter property to provide 2 dates from the available set
      const fakeImageryFeature = new ImageryLayerFeatureInfo();
      fakeImageryFeature.properties = {
        availabilityAtLocation: ["2023-01-02", "2023-01-03"]
      };
      spyOn(imageryProvider, "pickFeatures").and.returnValue(
        Promise.resolve([fakeImageryFeature])
      );

      await item.setTimeFilterFromLocation({
        // Position to pick
        position: {
          // in degrees
          latitude: -37.831,
          longitude: 144.973
        },
        // Coordinates of the tiles
        tileCoords: {
          x: 1,
          y: 2,
          level: 3
        }
      });

      const {
        tile: { x, y, level },
        latitude,
        longitude,
        height
      } = runInAction(() => item.timeFilterCoordinates);
      expect({ x, y, level }).toEqual({ x: 1, y: 2, level: 3 });
      expect({ latitude, longitude, height }).toEqual({
        longitude: 144.973,
        latitude: -37.831,
        height: 0
      });
    });

    describe("when there are multiple imageryProviders", function () {
      it("queries all of them", async function () {
        item.imageryProviders = [
          new WebMapServiceImageryProvider({
            url: "test1",
            layers: "layer1"
          }),
          new WebMapServiceImageryProvider({
            url: "test2",
            layers: "layer2"
          })
        ];
        const spy0 = spyOn(
          item.imageryProviders[0],
          "pickFeatures"
        ).and.returnValue(undefined);
        const spy1 = spyOn(
          item.imageryProviders[1],
          "pickFeatures"
        ).and.returnValue(undefined);

        await item.setTimeFilterFromLocation({
          // Position to pick
          position: {
            // in degrees
            latitude: -37.831,
            longitude: 144.973
          },
          // Coordinates of the tiles
          tileCoords: {
            x: 1,
            y: 2,
            level: 3
          }
        });

        expect(spy0).toHaveBeenCalledTimes(1);
        expect(spy1).toHaveBeenCalledTimes(1);
      });

      it(
        "sets the time filter from the first imageryProvider that returns a valid pick result",
        action(async function () {
          item.imageryProviders = [
            new WebMapServiceImageryProvider({
              url: "test1",
              layers: "layer1"
            }),
            new WebMapServiceImageryProvider({
              url: "test2",
              layers: "layer2"
            })
          ];

          const featureInfo1 = new ImageryLayerFeatureInfo();
          featureInfo1.properties = {
            someprop: ["2023-01-01"]
          };

          const featureInfo2 = new ImageryLayerFeatureInfo();
          featureInfo2.properties = {
            timeprop: ["2023-01-04"]
          };

          item.setTrait(
            CommonStrata.user,
            "timeFilterPropertyName",
            "timeprop"
          );

          const spy0 = spyOn(
            item.imageryProviders[0],
            "pickFeatures"
          ).and.returnValue(Promise.resolve([featureInfo1]));
          const spy1 = spyOn(
            item.imageryProviders[1],
            "pickFeatures"
          ).and.returnValue(Promise.resolve([featureInfo2]));

          await item.setTimeFilterFromLocation({
            // Position to pick
            position: {
              // in degrees
              latitude: -37.831,
              longitude: 144.973
            },
            // Coordinates of the tiles
            tileCoords: {
              x: 1,
              y: 2,
              level: 3
            }
          });

          expect(spy0).toHaveBeenCalledTimes(1);
          expect(spy1).toHaveBeenCalledTimes(1);

          expect(
            (item.discreteTimesAsSortedJulianDates ?? []).map((dt) =>
              dt.time.toString()
            )
          ).toEqual(["2023-01-04T00:00:00Z"]);
        })
      );
    });

    it("passes the correct arguments when picking the imagery provider", async function () {
      const spy = spyOn(imageryProvider, "pickFeatures").and.returnValue(
        undefined
      );

      await item.setTimeFilterFromLocation({
        // Position to pick
        position: {
          // in degrees
          latitude: -37.831,
          longitude: 144.973
        },
        // Coordinates of the tiles
        tileCoords: {
          x: 1,
          y: 2,
          level: 3
        }
      });

      const [x, y, level, longitude, latitude] = spy.calls.mostRecent().args;
      expect([x, y, level]).toEqual([1, 2, 3]);
      expect(longitude).toBeCloseTo(2.5302);
      expect(latitude).toBeCloseTo(-0.6602);
    });

    it("does nothing when terria.allowFeatureInfoRequests is set to `false`", async function () {
      const pickFeatures = spyOn(
        imageryProvider,
        "pickFeatures"
      ).and.returnValue(undefined);

      terria.allowFeatureInfoRequests = false;
      await item.setTimeFilterFromLocation({
        // Position to pick
        position: {
          // in degrees
          latitude: -37.831,
          longitude: 144.973
        },
        // Coordinates of the tiles
        tileCoords: {
          x: 1,
          y: 2,
          level: 3
        }
      });
      expect(pickFeatures).not.toHaveBeenCalled();
    });
  });
});

class TestTimeFilterableItem extends TimeFilterMixin(
  MappableMixin(CreateModel(mixTraits(TimeFilterTraits)))
) {
  @observable discreteTimes: DiscreteTimeAsJS[] = [];

  @observable
  imageryProviders: ImageryProvider[] = [];

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  protected async forceLoadMapItems(): Promise<void> {}

  @computed
  get mapItems() {
    return this.imageryProviders.map((imageryProvider) => ({
      imageryProvider,
      alpha: 1.0,
      show: true,
      clippingRectangle: imageryProvider.rectangle
    }));
  }
}
