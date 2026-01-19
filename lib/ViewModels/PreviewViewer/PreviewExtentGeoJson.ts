import GeoJsonCatalogItem from "../../Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import CommonStrata from "../../Models/Definition/CommonStrata";
import Model from "../../Models/Definition/Model";
import Terria from "../../Models/Terria";
import { ProjectedBoundingBoxTraits } from "../../Traits/TraitsClasses/CrsTraits";

interface Rectangle {
  west?: number;
  south?: number;
  east?: number;
  north?: number;
}

export default class PreviewExtentGeoJson {
  /**
   * Create a preview extent item given a rectangle
   */
  static fromRectangle(terria: Terria, rectangle: Rectangle, crsCode?: string) {
    const { west, south, east, north } = rectangle;
    if (
      west === undefined ||
      south === undefined ||
      north === undefined ||
      east === undefined
    ) {
      return;
    }

    const rectangleItem = new GeoJsonCatalogItem(
      "__preview-data-extent",
      terria
    );

    const geoJsonData = {
      crs: crsCode
        ? {
            type: "name",
            properties: {
              name: crsCode
            }
          }
        : undefined,

      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            stroke: "#08ABD5",
            "stroke-width": 2,
            "stroke-opacity": 1
          },
          geometry: {
            type: "LineString",
            coordinates: [
              [west, south],
              [west, north],
              [east, north],
              [east, south],
              [west, south]
            ]
          }
        }
      ]
    };

    rectangleItem.setTrait(CommonStrata.definition, "geoJsonData", geoJsonData);
    rectangleItem.loadMapItems();
    return rectangleItem;
  }

  /**
   * Create a preview extent item given a projected bounding box
   */
  static fromProjectedBoundingBox(
    terria: Terria,
    bbox: Model<ProjectedBoundingBoxTraits>
  ) {
    const crsCode = bbox.crs;
    const rectangle = {
      west: bbox.min.x,
      south: bbox.min.y,
      east: bbox.max.x,
      north: bbox.max.y
    };

    return PreviewExtentGeoJson.fromRectangle(terria, rectangle, crsCode);
  }
}
