import { GeoPackageAPI } from "@ngageoint/geopackage";
import { FeatureCollectionWithCrs } from "./GeoJson";
import TerriaError from "./TerriaError";

export interface GeoPackageLayerInfo {
  name: string;
  featureCount: number;
  geometryType?: string;
  minX?: number;
  minY?: number;
  maxX?: number;
  maxY?: number;
}

/**
 * Opens a GeoPackage from a Blob or ArrayBuffer and returns the GeoPackage instance
 */
export async function openGeoPackage(data: Blob | ArrayBuffer): Promise<any> {
  try {
    const buffer = data instanceof Blob ? await data.arrayBuffer() : data;
    const uint8Array = new Uint8Array(buffer);

    // Check for SQLite magic number (SQLite format 3)
    const magicNumber = new TextDecoder().decode(uint8Array.slice(0, 15));
    if (!magicNumber.startsWith("SQLite format 3")) {
      throw new Error(
        `Invalid GeoPackage file: Expected SQLite format 3 header, got: ${magicNumber}`
      );
    }

    // Open the GeoPackage using the library
    const geoPackage = await GeoPackageAPI.open(uint8Array);
    return geoPackage;
  } catch (error) {
    throw TerriaError.from(error, {
      title: "Error opening GeoPackage",
      message:
        "Failed to open the GeoPackage file. The file may be corrupted or invalid."
    });
  }
}

/**
 * Gets a list of all vector feature tables in the GeoPackage
 */
export function getFeatureTables(geoPackage: any): GeoPackageLayerInfo[] {
  try {
    const featureTables: GeoPackageLayerInfo[] = [];
    const tableNames = geoPackage.getFeatureTables();

    for (const tableName of tableNames) {
      const featureDao = geoPackage.getFeatureDao(tableName);
      const bbox = featureDao.getBoundingBox();

      featureTables.push({
        name: tableName,
        featureCount: featureDao.count(),
        geometryType: featureDao.geometryColumns?.geometryType,
        minX: bbox?.minX,
        minY: bbox?.minY,
        maxX: bbox?.maxX,
        maxY: bbox?.maxY
      });
    }

    return featureTables;
  } catch (error) {
    throw TerriaError.from(error, {
      title: "Error reading GeoPackage contents",
      message: "Failed to read the feature tables from the GeoPackage."
    });
  }
}

/**
 * Extracts features from a specific table as a GeoJSON FeatureCollection
 */
export async function extractGeoJsonFromTable(
  geoPackage: any,
  tableName: string
): Promise<FeatureCollectionWithCrs> {
  try {
    // queryForGeoJSONFeaturesInTable returns an array of features, not a FeatureCollection
    // We need to wrap it in a FeatureCollection structure
    const features = geoPackage.queryForGeoJSONFeaturesInTable(tableName);

    if (!features || !Array.isArray(features) || features.length === 0) {
      throw new Error(`No features found in table "${tableName}"`);
    }

    // Wrap the features array in a proper GeoJSON FeatureCollection
    const featureCollection: FeatureCollectionWithCrs = {
      type: "FeatureCollection",
      features: features
    };

    return featureCollection;
  } catch (error) {
    throw TerriaError.from(error, {
      title: `Error extracting features from table "${tableName}"`,
      message: `Failed to extract features from the GeoPackage table "${tableName}".`
    });
  }
}

/**
 * Parses a GeoPackage file and returns GeoJSON for all tables or a specific table
 *
 * @param data - The GeoPackage file as a Blob or ArrayBuffer
 * @param tableName - Optional: specific table to extract. If not provided, extracts all tables
 * @returns A single FeatureCollection (if one table) or an array of FeatureCollections with layer info
 */
export async function parseGeoPackage(
  data: Blob | ArrayBuffer,
  tableName?: string
): Promise<
  | FeatureCollectionWithCrs
  | Array<{ name: string; data: FeatureCollectionWithCrs }>
> {
  const geoPackage = await openGeoPackage(data);

  try {
    const tables = getFeatureTables(geoPackage);

    if (tables.length === 0) {
      throw TerriaError.from(
        "No vector feature tables found in the GeoPackage."
      );
    }

    // If a specific table is requested
    if (tableName) {
      const table = tables.find((t) => t.name === tableName);
      if (!table) {
        throw TerriaError.from(
          `Table "${tableName}" not found in GeoPackage. Available tables: ${tables
            .map((t) => t.name)
            .join(", ")}`
        );
      }
      return await extractGeoJsonFromTable(geoPackage, tableName);
    }

    // If only one table, return it directly
    if (tables.length === 1) {
      return await extractGeoJsonFromTable(geoPackage, tables[0].name);
    }

    // Multiple tables: return array with layer info
    const results: Array<{ name: string; data: FeatureCollectionWithCrs }> = [];
    for (const table of tables) {
      const featureCollection = await extractGeoJsonFromTable(
        geoPackage,
        table.name
      );
      results.push({
        name: table.name,
        data: featureCollection
      });
    }

    return results;
  } finally {
    // Clean up: close the GeoPackage
    if (geoPackage && typeof geoPackage.close === "function") {
      geoPackage.close();
    }
  }
}

/**
 * Gets information about all layers in a GeoPackage without fully parsing them
 */
export async function getGeoPackageInfo(
  data: Blob | ArrayBuffer
): Promise<GeoPackageLayerInfo[]> {
  const geoPackage = await openGeoPackage(data);

  try {
    return getFeatureTables(geoPackage);
  } finally {
    if (geoPackage && typeof geoPackage.close === "function") {
      geoPackage.close();
    }
  }
}
