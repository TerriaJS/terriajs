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

export function generatePathSummaryTxtData(options: {
  geom: MeasurableGeometry;
  name: string;
  kind: MeasurableSummaryKind;
  ellipsoid?: Ellipsoid;
}): { text: string; filename: string } {
  const { geom, name, kind, ellipsoid } = options;
  const pathNotes = (geom.pathNotes ?? "").trim();
  const lines: string[] = [];
  const addLine = (label: string, value: string | undefined) => {
    if (!value) return;
    lines.push(`${label}: ${value}`);
  };
  const addNumberLine = (
    label: string,
    value: number | undefined,
    digits: number,
    unit: string
  ) => {
    const formatted = formatSummaryNumber(value, digits);
    if (!formatted) return;
    addLine(label, `${formatted} ${unit}`);
  };

  addLine("name", name);
  if (pathNotes.length > 0) {
    addLine("path_notes", pathNotes);
  }

  if (kind === "polygon") {
    const geoAreaM2 = geom.geodeticArea ?? 0;
    const airAreaM2 = geom.airArea ?? 0;

    addNumberLine(
      "geodetic_area",
      geoAreaM2 > 0 ? geoAreaM2 / 1_000_000 : 0,
      6,
      "km2"
    );
    addNumberLine(
      "geodetic_area",
      geoAreaM2 > 0 ? geoAreaM2 * 0.0001 : 0,
      4,
      "ha"
    );
    addNumberLine(
      "air_area",
      airAreaM2 > 0 ? airAreaM2 / 1_000_000 : 0,
      6,
      "km2"
    );
    addNumberLine("air_area", airAreaM2 > 0 ? airAreaM2 * 0.0001 : 0, 4, "ha");
    addNumberLine("geodetic_perimeter", geom.geodeticDistance ?? 0, 2, "m");
    addNumberLine("air_perimeter", geom.airDistance ?? 0, 2, "m");
    addNumberLine("ground_perimeter", geom.groundDistance ?? 0, 2, "m");

    return {
      text: lines.join("\n"),
      filename: `${name}_summary.txt`
    };
  }

  const { altMin, altMax } = getAltMinMax(geom.stopPoints);
  const bearing = getBearingDegrees(geom.stopPoints, ellipsoid);
  const altDiff = getAltDiff(geom.stopPoints);

  addNumberLine("alt_min", altMin, 2, "m");
  addNumberLine("alt_max", altMax, 2, "m");
  if (bearing) {
    addLine("bearing", `${bearing}°`);
  }
  if (altDiff) {
    addLine("alt_diff", `${altDiff} m`);
  }

  if (kind === "line") {
    addNumberLine("geodetic_distance", geom.geodeticDistance, 2, "m");
    addNumberLine("air_distance", geom.airDistance, 2, "m");
    addNumberLine("ground_distance", geom.groundDistance, 2, "m");
  }

  return {
    text: lines.join("\n"),
    filename: `${name}_summary.txt`
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
