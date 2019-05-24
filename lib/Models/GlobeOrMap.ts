import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import Mappable from "./Mappable";
import Feature from "./Feature";
import Terria from "./Terria";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";
import isDefined from "../Core/isDefined";

export type CameraView = {
  rectangle: Cesium.Rectangle;
  position: any;
  direction: any;
  up: any;
};

export default abstract class GlobeOrMap {
  abstract readonly terria: Terria;
  protected static _featureHighlightName = "___$FeatureHighlight&__";

  abstract destroy(): void;
  abstract zoomTo(
    viewOrExtent: CameraView | Cesium.Rectangle | Mappable,
    flightDurationSeconds: number
  ): void;
  abstract getCurrentExtent(): Cesium.Rectangle;

  /* Gets the current container element.
   */
  abstract getContainer(): Element | undefined;

  abstract pauseMapInteraction(): void;
  abstract resumeMapInteraction(): void;

  abstract notifyRepaintRequired(): void;

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

  /**
   * Returns the side of the splitter the `position` lies on.
   *
   * @param The screen position.
   * @return The side of the splitter on which `position` lies.
   */
  protected _getSplitterSideForScreenPosition(
    position: Cartesian2 | Cartesian3
  ): ImagerySplitDirection | undefined {
    const container = this.terria.currentViewer.getContainer();
    if (!isDefined(container)) {
      return;
    }

    const splitterX = container.clientWidth * this.terria.splitPosition;
    if (position.x <= splitterX) {
      return ImagerySplitDirection.LEFT;
    } else {
      return ImagerySplitDirection.RIGHT;
    }
  }
}
