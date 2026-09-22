import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import nearestAxisOrder from "../../../lib/Map/PickedFeatures/nearestAxisOrder";

describe("nearestAxisOrder", function () {
  /** A picked feature positioned at the given degrees, in the given order. */
  function featureAt(first: number, second: number) {
    const feature = new ImageryLayerFeatureInfo();
    feature.position = Cartographic.fromDegrees(first, second);
    return feature;
  }

  const click = (lon: number, lat: number) =>
    Cartographic.fromDegrees(lon, lat);

  function degrees(feature: ImageryLayerFeatureInfo) {
    return [
      CesiumMath.toDegrees(feature.position!.longitude),
      CesiumMath.toDegrees(feature.position!.latitude)
    ];
  }

  it("swaps a [lat, lon] position when that lands nearer the click", function () {
    // Copernicus Marine reports lat 33.17, lon -44.83 as [33.17, -44.83].
    const feature = featureAt(33.17, -44.83);

    nearestAxisOrder(feature, click(-45, 33));

    const [longitude, latitude] = degrees(feature);
    expect(longitude).toBeCloseTo(-44.83, 6);
    expect(latitude).toBeCloseTo(33.17, 6);
  });

  it("keeps a [lon, lat] position the server already got right", function () {
    const feature = featureAt(150.2, -33.9);

    nearestAxisOrder(feature, click(150, -34));

    const [longitude, latitude] = degrees(feature);
    expect(longitude).toBeCloseTo(150.2, 6);
    expect(latitude).toBeCloseTo(-33.9, 6);
  });

  it("never swaps a longitude that would fall beyond the poles", function () {
    // Swapping would put latitude at 150 degrees, so the reading must stand
    // even though the click is nearer the transposed point.
    const feature = featureAt(150, 10);

    nearestAxisOrder(feature, click(10, 150));

    const [longitude, latitude] = degrees(feature);
    expect(longitude).toBeCloseTo(150, 6);
    expect(latitude).toBeCloseTo(10, 6);
  });

  it("leaves a feature without a position alone", function () {
    const feature = new ImageryLayerFeatureInfo();

    nearestAxisOrder(feature, click(0, 0));

    expect(feature.position).toBeUndefined();
  });
});
