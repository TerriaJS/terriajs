import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import EllipsoidGeodesic from "terriajs-cesium/Source/Core/EllipsoidGeodesic";
import { MeasurableGeometry } from "./MeasurableGeometryManager";

export type MeasurableSummaryKind = "points" | "line" | "polygon";

export function getSummaryKind(options: {
  geom: MeasurableGeometry;
  activeToolIsPolygon: boolean;
}): MeasurableSummaryKind {
  const { geom, activeToolIsPolygon } = options;
  if (activeToolIsPolygon || geom.hasArea || geom.isClosed) return "polygon";
  if (geom.onlyPoints) return "points";
  return "line";
}

export function generatePathSummaryCsvData(options: {
  geom: MeasurableGeometry;
  name: string;
  kind: MeasurableSummaryKind;
  ellipsoid?: Ellipsoid;
}): { csv: string; filename: string } {
  const { geom, name, kind, ellipsoid } = options;
  const pathNotes = geom.pathNotes ?? "";

  if (kind === "polygon") {
    const geoAreaM2 = geom.geodeticArea ?? 0;
    const airAreaM2 = geom.airArea ?? 0;

    const headers = [
      "name",
      "path_notes",
      "geodetic_area",
      "geodetic_area",
      "air_area",
      "air_area",
      "geodetic_perimeter",
      "air_perimeter",
      "ground_perimeter"
    ].join(",");

    const units = ["", "", "km2", "ha", "km2", "ha", "m", "m", "m"].join(",");

    const values = [
      name,
      pathNotes,
      formatSummaryNumber(geoAreaM2 > 0 ? geoAreaM2 / 1_000_000 : 0, 6),
      formatSummaryNumber(geoAreaM2 > 0 ? geoAreaM2 * 0.0001 : 0, 4),
      formatSummaryNumber(airAreaM2 > 0 ? airAreaM2 / 1_000_000 : 0, 6),
      formatSummaryNumber(airAreaM2 > 0 ? airAreaM2 * 0.0001 : 0, 4),
      formatSummaryNumber(geom.geodeticDistance ?? 0, 2),
      formatSummaryNumber(geom.airDistance ?? 0, 2),
      formatSummaryNumber(geom.groundDistance ?? 0, 2)
    ].join(",");

    return {
      csv: [headers, units, values].join("\n"),
      filename: `${name}_path.csv`
    };
  }

  const { altMin, altMax } = getAltMinMax(geom.stopPoints);
  const bearing = getBearingDegrees(geom.stopPoints, ellipsoid);
  const altDiff = getAltDiff(geom.stopPoints);

  if (kind === "line") {
    const headers = [
      "name",
      "path_notes",
      "alt_min",
      "alt_max",
      "bearing",
      "alt_diff",
      "geodetic_distance",
      "air_distance",
      "ground_distance"
    ].join(",");

    const units = ["", "", "m", "m", "deg", "m", "m", "m", "m"].join(",");

    const values = [
      name,
      pathNotes,
      formatSummaryNumber(altMin, 2),
      formatSummaryNumber(altMax, 2),
      bearing,
      altDiff,
      formatSummaryNumber(geom.geodeticDistance, 2),
      formatSummaryNumber(geom.airDistance, 2),
      formatSummaryNumber(geom.groundDistance, 2)
    ].join(",");

    return {
      csv: [headers, units, values].join("\n"),
      filename: `${name}_path.csv`
    };
  }

  // points
  const headers = [
    "name",
    "path_notes",
    "alt_min",
    "alt_max",
    "bearing",
    "alt_diff"
  ].join(",");

  const units = ["", "", "m", "m", "deg", "m"].join(",");

  const values = [
    name,
    pathNotes,
    formatSummaryNumber(altMin, 2),
    formatSummaryNumber(altMax, 2),
    bearing,
    altDiff
  ].join(",");

  return {
    csv: [headers, units, values].join("\n"),
    filename: `${name}_path.csv`
  };
}

function formatSummaryNumber(
  value: number | undefined,
  digits: number
): string {
  if (typeof value !== "number" || !isFinite(value)) return "";
  return value.toFixed(digits);
}

function getAltMinMax(stopPoints: MeasurableGeometry["stopPoints"]) {
  const heights = (stopPoints ?? [])
    .map((p) => p.height)
    .filter((h) => isFinite(h));
  const altMin = heights.length > 0 ? Math.min(...heights) : undefined;
  const altMax = heights.length > 0 ? Math.max(...heights) : undefined;
  return { altMin, altMax };
}

function getAltDiff(stopPoints: MeasurableGeometry["stopPoints"]) {
  const start = stopPoints?.[0];
  const end = stopPoints?.at(-1);
  if (!start || !end) return "";
  if (!isFinite(start.height) || !isFinite(end.height)) return "";
  return (end.height - start.height).toFixed(2);
}

function getBearingDegrees(
  stopPoints: MeasurableGeometry["stopPoints"],
  ellipsoid?: Ellipsoid
): string {
  if (!ellipsoid) return "";
  if (!stopPoints || stopPoints.length < 2) return "";
  const start = stopPoints[0];
  const end = stopPoints.at(-1);
  if (!end) return "";
  const geo = new EllipsoidGeodesic(start, end, ellipsoid);
  return ((CesiumMath.toDegrees(geo.startHeading) + 360) % 360).toFixed(1);
}
