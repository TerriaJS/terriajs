import { computed, makeObservable, observable } from "mobx";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import MappableMixin, { ImageryParts } from "../../ModelMixins/MappableMixin";
import CameraView from "../../Models/CameraView";
import GeoJsonCatalogItem from "../../Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import CreateModel from "../../Models/Definition/CreateModel";
import MappableTraits from "../../Traits/TraitsClasses/MappableTraits";
import PreviewExtentGeoJson from "./PreviewExtentGeoJson";

/**
 * Wrap previewed item to display correctly on preview map and show an extent
 * rectangle
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

  // @computed
  // get boundingRectangleItem2(
  //   previewed: MappableMixin.Instance
  // ): GeoJsonCatalogItem | undefined {
  //   let rectangle, crs;

  //   if (hasTraits(previewed, CrsTraits, "previewCrs", "boundingBoxes")) {
  //     // Use native bounding box for the model if we know it.
  //     //
  //     // To define an extent we generate 4 points. We can generate it from 2
  //     // corner points given in degress (west, south, east, north) by the
  //     // model's rectangle definition. However for projections that cross the
  //     // pole 2 opposite corners of a rectangle can have the same latitude and
  //     // would look like a line if generated from just two points. In this case
  //     // we need either 2 corner points in native CRS or 4 points in
  //     // WGS84. Here we define the extent using 2 corner points in native CRS.
  //     const crsCode = previewed.previewCrs;
  //     const bbox = previewed.boundingBoxes.find((b) => b.crs === crsCode);
  //     if (bbox && crsCode) {
  //       // coords in this will be in CRS native coordinate space
  //       rectangle = {
  //         west: bbox.min.x,
  //         south: bbox.min.y,
  //         east: bbox.max.x,
  //         north: bbox.max.y
  //       };

  //       crs = {
  //         type: "name",
  //         properties: {
  //           name: crsCode
  //         }
  //       };
  //     }
  //   }

  //   rectangle ??= previewed.rectangle;
  //   let { west, south, east, north } = rectangle ?? {};
  //   if (
  //     west === undefined ||
  //     south === undefined ||
  //     east === undefined ||
  //     north === undefined
  //   ) {
  //     return undefined;
  //   }

  //   if (!this.isZoomedToExtent && !crs) {
  //     // When zoomed out, make sure the dataset rectangle is at least 5% of the width and height
  //     // the home view, so that it is actually visible.
  //     const minimumFraction = 0.05;
  //     const homeView = this.getHomeCamera();
  //     const minimumWidth =
  //       CesiumMath.toDegrees(homeView.rectangle.width) * minimumFraction;
  //     if (east - west < minimumWidth) {
  //       const center = (east + west) * 0.5;
  //       west = center - minimumWidth * 0.5;
  //       east = center + minimumWidth * 0.5;
  //     }

  //     const minimumHeight =
  //       CesiumMath.toDegrees(homeView.rectangle.height) * minimumFraction;
  //     if (north - south < minimumHeight) {
  //       const center = (north + south) * 0.5;
  //       south = center - minimumHeight * 0.5;
  //       north = center + minimumHeight * 0.5;
  //     }
  //   }

  //   const rectangleCatalogItem = new GeoJsonCatalogItem(
  //     "__preview-data-extent",
  //     this.terria
  //   );

  //   const geoJsonData = {
  //     crs,
  //     type: "FeatureCollection",
  //     features: [
  //       {
  //         type: "Feature",
  //         properties: {
  //           stroke: "#08ABD5",
  //           "stroke-width": 2,
  //           "stroke-opacity": 1
  //         },
  //         geometry: {
  //           type: "LineString",
  //           coordinates: [
  //             [west, south],
  //             [west, north],
  //             [east, north],
  //             [east, south],
  //             [west, south]
  //           ]
  //         }
  //       }
  //     ]
  //   };

  //   rectangleCatalogItem.setTrait(
  //     CommonStrata.definition,
  //     "geoJsonData",
  //     geoJsonData
  //   );

  //   rectangleCatalogItem.loadMapItems();
  //   return rectangleCatalogItem;
  // }
}
