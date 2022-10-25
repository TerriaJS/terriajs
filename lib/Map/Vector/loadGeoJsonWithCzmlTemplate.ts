import {
  LineString,
  MultiLineString,
  MultiPolygon,
  Point,
  Polygon
} from "@turf/helpers";
import clone from "terriajs-cesium/Source/Core/clone";
import CzmlDataSource from "terriajs-cesium/Source/DataSources/CzmlDataSource";
import isDefined from "../../Core/isDefined";
import { isJsonNumber, JsonObject } from "../../Core/Json";
import { FeatureCollectionWithCrs } from "../../ModelMixins/GeojsonMixin";

/** Apply czmlTemplate to each Feature in a GeoJSON FeatureCollection.
 * For CZML spec see https://github.com/AnalyticalGraphicsInc/czml-writer/wiki/
 *
 * Supported CZML packet types
 *
 * **Polygon**
 * - CZML Polygon (https://github.com/AnalyticalGraphicsInc/czml-writer/wiki/Polygon)
 *
 * **Line**
 * - CZML Polyline volume (https://github.com/AnalyticalGraphicsInc/czml-writer/wiki/PolylineVolume)
 * - CZML Polyline (https://github.com/AnalyticalGraphicsInc/czml-writer/wiki/Polyline)
 * - CZML Wall (https://github.com/AnalyticalGraphicsInc/czml-writer/wiki/Wall)
 * - CZML Corridor (https://github.com/AnalyticalGraphicsInc/czml-writer/wiki/Corridor)
 *
 * **Point**
 * - Supports everything
 */
export function loadGeoJsonWithCzmlTemplate(
  czmlTemplate: JsonObject,
  geoJson: FeatureCollectionWithCrs
): Promise<CzmlDataSource> {
  const rootCzml = [
    {
      id: "document",
      name: "CZML",
      version: "1.0"
    }
  ];

  // Create a czml packet for each geoJson Point/Polygon feature
  // For point: set czml position (CartographicDegrees) to point coordinates
  // For polygon: set czml positions array (CartographicDegreesListValue) for the `polygon` property

  // Set czml properties to feature properties
  for (let i = 0; i < geoJson.features.length; i++) {
    const feature = geoJson.features[i];
    if (feature === null || feature.geometry.type === "Line") {
      continue;
    }

    if (feature.geometry?.type === "Point") {
      const czml = clone(czmlTemplate ?? {}, true);

      const point = feature.geometry as Point;
      const coords = point.coordinates;

      // Add height = 0 if no height provided
      if (coords.length === 2) {
        coords[2] = 0;
      }

      if (isJsonNumber(czmlTemplate?.heightOffset)) {
        coords[2] += czmlTemplate!.heightOffset;
      }

      czml.position = {
        cartographicDegrees: point.coordinates
      };

      czml.properties = Object.assign(
        czml.properties ?? {},
        stringifyFeatureProperties(feature.properties ?? {})
      );
      rootCzml.push(czml);
    } else if (
      feature.geometry?.type === "Polygon" ||
      (feature.geometry?.type === "MultiPolygon" && czmlTemplate?.polygon)
    ) {
      const czml = clone(czmlTemplate ?? {}, true);

      // To handle both Polygon and MultiPolygon - transform Polygon coords into MultiPolygon coords
      const multiPolygonGeom =
        feature.geometry?.type === "Polygon"
          ? [(feature.geometry as Polygon).coordinates]
          : (feature.geometry as MultiPolygon).coordinates;

      // Loop through Polygons in MultiPolygon
      for (let j = 0; j < multiPolygonGeom.length; j++) {
        const geom = multiPolygonGeom[j];
        const positions: number[] = [];
        const holes: number[][] = [];

        geom[0].forEach((coords) => {
          if (isJsonNumber(czmlTemplate?.heightOffset)) {
            coords[2] = (coords[2] ?? 0) + czmlTemplate!.heightOffset;
          }
          positions.push(coords[0], coords[1], coords[2]);
        });

        geom.forEach((ring, idx) => {
          if (idx === 0) return;

          holes.push(
            ring.reduce<number[]>((acc, current) => {
              if (isJsonNumber(czmlTemplate?.heightOffset)) {
                current[2] = (current[2] ?? 0) + czmlTemplate!.heightOffset;
              }

              acc.push(current[0], current[1], current[2]);

              return acc;
            }, [])
          );
        });

        czml.polygon.positions = { cartographicDegrees: positions };
        czml.polygon.holes = { cartographicDegrees: holes };

        czml.properties = Object.assign(
          czml.properties ?? {},
          stringifyFeatureProperties(feature.properties ?? {})
        );
        rootCzml.push(czml);
      }
    } else if (
      feature.geometry?.type === "LineString" ||
      feature.geometry?.type === "MultiLineString"
    ) {
      const czml = clone(czmlTemplate ?? {}, true);

      // To handle both LineString and MultiLineString - transform LineString coords into MultiLineString coords
      const multiLineGeom =
        feature.geometry?.type === "LineString"
          ? [(feature.geometry as LineString).coordinates]
          : (feature.geometry as MultiLineString).coordinates;

      // Loop through Lines in MultiLineString
      for (let j = 0; j < multiLineGeom.length; j++) {
        const geom = multiLineGeom[j];
        const positions: number[] = [];

        geom.forEach((coords) => {
          if (isJsonNumber(czmlTemplate?.heightOffset)) {
            coords[2] = (coords[2] ?? 0) + czmlTemplate!.heightOffset;
          }
          positions.push(coords[0], coords[1], coords[2]);
        });

        if (czml.polylineVolume) {
          czml.polylineVolume.positions = {
            cartographicDegrees: positions
          };
        }

        if (czml.wall) {
          czml.wall.positions = {
            cartographicDegrees: positions
          };
        }

        if (czml.polyline) {
          czml.polyline.positions = {
            cartographicDegrees: positions
          };
        }

        if (czml.corridor) {
          czml.corridor.positions = {
            cartographicDegrees: positions
          };
        }

        czml.properties = Object.assign(
          czml.properties ?? {},
          stringifyFeatureProperties(feature.properties ?? {})
        );
        rootCzml.push(czml);
      }
    }
  }

  return CzmlDataSource.load(rootCzml);
}

function stringifyFeatureProperties(featureProps: JsonObject | undefined) {
  return Object.keys(featureProps ?? {}).reduce<{
    [key: string]: string;
  }>((properties, key) => {
    const featureProp = featureProps![key];
    if (typeof featureProp === "string") {
      properties[key] = featureProp;
    } else if (
      isDefined(featureProp) &&
      featureProp !== null &&
      typeof featureProp.toString === "function"
    )
      properties[key] = featureProp.toString();

    return properties;
  }, {});
}
