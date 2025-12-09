import { computed, makeObservable, observable } from "mobx";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import MappableMixin, { ImageryParts } from "../../ModelMixins/MappableMixin";
import CameraView from "../../Models/CameraView";
import GeoJsonCatalogItem from "../../Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import CreateModel from "../../Models/Definition/CreateModel";
import MappableTraits from "../../Traits/TraitsClasses/MappableTraits";
import PreviewExtentGeoJson from "./PreviewExtentGeoJson";

/**
 * Wraps the previewed item to display it with full opacity and also show an
 * extent rectangle
 */
export default class PreviewItem extends MappableMixin(
  CreateModel(MappableTraits)
) {
  readonly previewed: MappableMixin.Instance;
  readonly getHomeCamera: () => CameraView;

  @observable
  isZoomedToExtent = false;

  constructor(
    previewed: MappableMixin.Instance,
    getHomeCamera: () => CameraView
  ) {
    super(undefined, previewed.terria);
    makeObservable(this);

    this.previewed = previewed;
    this.getHomeCamera = getHomeCamera;
  }

  async forceLoadMapItems() {}

  /**
   * Returns all mapItems from previewed item with opacity of imagery items set to 100%
   */
  @computed
  get mapItems() {
    const previewMapItems =
      this.previewed.mapItems.map((m) =>
        ImageryParts.is(m)
          ? {
              ...m,
              alpha: m.alpha !== 0.0 ? 1.0 : 0.0,
              show: true
            }
          : m
      ) ?? [];

    return [
      ...previewMapItems,
      ...(this.boundingRectangleItem?.mapItems ?? [])
    ];
  }

  @computed
  get boundingRectangleItem(): GeoJsonCatalogItem | undefined {
    const rectangle = this.previewed.rectangle;
    let { west, south, east, north } = rectangle ?? {};
    if (
      west === undefined ||
      south === undefined ||
      east === undefined ||
      north === undefined
    ) {
      return undefined;
    }

    if (!this.isZoomedToExtent) {
      // When zoomed out, make sure the dataset rectangle is at least 5% of the width and height
      // the home view, so that it is actually visible.
      const minimumFraction = 0.05;
      const homeView = this.getHomeCamera();
      const minimumWidth =
        CesiumMath.toDegrees(homeView.rectangle.width) * minimumFraction;
      if (east - west < minimumWidth) {
        const center = (east + west) * 0.5;
        west = center - minimumWidth * 0.5;
        east = center + minimumWidth * 0.5;
      }

      const minimumHeight =
        CesiumMath.toDegrees(homeView.rectangle.height) * minimumFraction;
      if (north - south < minimumHeight) {
        const center = (north + south) * 0.5;
        south = center - minimumHeight * 0.5;
        north = center + minimumHeight * 0.5;
      }
    }

    return PreviewExtentGeoJson.fromRectangle(this.terria, {
      west,
      south,
      east,
      north
    });
  }
}
