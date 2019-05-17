import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import Mappable from "./Mappable";
import Feature from "./Feature";

export type CameraView = {
  rectangle: Cesium.Rectangle;
  position: any;
  direction: any;
  up: any;
};

export default abstract class GlobeOrMap {
  protected static _featureHighlightName = "___$FeatureHighlight&__";

  abstract destroy(): void;
  abstract zoomTo(
    viewOrExtent: CameraView | Cesium.Rectangle | Mappable,
    flightDurationSeconds: number
  ): void;
  abstract getCurrentExtent(): Cesium.Rectangle;

  /**
   * Creates a {@see Feature} (based on an {@see Entity}) from a {@see ImageryLayerFeatureInfo}.
   * @param imageryFeature The imagery layer feature for which to create an entity-based feature.
   * @return The created feature.
   */
  protected _createFeatureFromImageryLayerFeature(
    imageryFeature: ImageryLayerFeatureInfo
  ) {
    const feature = new Feature({
      id: imageryFeature.name
    });
    feature.name = imageryFeature.name;
    (<any>feature).description = imageryFeature.description; // already defined by the new Entity
    feature.properties = (<any>imageryFeature).properties;
    (<any>feature).data = imageryFeature.data;

    (<any>feature).imageryLayer = (<any>imageryFeature).imageryLayer;
    feature.position = Ellipsoid.WGS84.cartographicToCartesian(
      imageryFeature.position
    );
    (<any>feature).coords = (<any>imageryFeature).coords;

    return feature;
  }
}
