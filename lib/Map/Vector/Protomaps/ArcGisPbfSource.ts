import Point from "@mapbox/point-geometry";
import { Feature, Position } from "@turf/helpers";
import arcgisPbfDecode from "arcgis-pbf-parser";
import {
  Feature as ProtomapsFeature,
  TileSource,
  Zxy
} from "protomaps-leaflet";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import {
  isLine,
  isMultiLineString,
  isMultiPolygon,
  isPoint,
  isPolygon
} from "../../../ModelMixins/GeojsonMixin";
import ArcGisFeatureServerCatalogItem from "../../../Models/Catalog/Esri/ArcGisFeatureServerCatalogItem";
import { PROTOMAPS_DEFAULT_TILE_SIZE } from "../../ImageryProvider/ProtomapsImageryProvider";
import {
  GEOJSON_SOURCE_LAYER_NAME,
  geomTypeMap
} from "./ProtomapsGeojsonSource";

export class ArcGisPbfSource implements TileSource {
  constructor(
    private featureServerCatalogItem: ArcGisFeatureServerCatalogItem,
    private tilingScheme: WebMercatorTilingScheme
  ) {}

  public async get(c: Zxy): Promise<Map<string, ProtomapsFeature[]>> {
    const uri = this.featureServerCatalogItem.buildEsriJsonUrl();

    const rect = this.tilingScheme.tileXYToNativeRectangle(c.x, c.y, c.z);

    const arcgisExtent = {
      xmin: rect.west,
      ymin: rect.south,
      xmax: rect.east,
      ymax: rect.north
    };
    uri.setQuery("geometry", JSON.stringify(arcgisExtent));
    uri.setQuery("geometryType", "esriGeometryEnvelope");
    uri.setQuery("inSR", "102100");

    uri.setQuery("f", "pbf");
    uri.setQuery("resultType", "tile");

    uri.setQuery("orderByFields", "objectid");
    uri.setQuery("outFields", "objectid");
    uri.setQuery("where", "1=1");

    uri.setQuery("maxRecordCountFactor", "4");
    const maxRecordCount = 8000;
    uri.setQuery("resultRecordCount", maxRecordCount.toString());

    // uri.setQuery("defaultSR", "102100");
    uri.setQuery("outSR", "102100");
    uri.setQuery("spatialRel", "esriSpatialRelIntersects");

    const precision = 8;
    const mapWidth = arcgisExtent.xmax - arcgisExtent.xmin;
    const tolerance = mapWidth / PROTOMAPS_DEFAULT_TILE_SIZE;

    uri.setQuery("maxAllowableOffset", tolerance.toString());

    const quantizationParameters = {
      extent: arcgisExtent,
      spatialReference: { wkid: 102100, latestWkid: 3857 },
      mode: "view",
      originPosition: "upperLeft",
      tolerance
    };
    uri.setQuery(
      "quantizationParameters",
      JSON.stringify(quantizationParameters)
    );
    uri.setQuery("outSpatialReference", "102100");
    uri.setQuery("precision", precision.toString());

    // returnZ: false,
    // returnM: false,

    const arcgisFeatures: Feature[] = [];

    let offset = 0;
    let fetching = true;

    while (fetching) {
      uri.setQuery("resultOffset", offset.toString());

      const response = await fetch(uri.toString());
      const arrayBuffer = await response.arrayBuffer();

      const arcgisResponse = arcgisPbfDecode(new Uint8Array(arrayBuffer));

      arcgisFeatures.push(...arcgisResponse.featureCollection.features);

      if (arcgisResponse.featureCollection.features.length >= maxRecordCount) {
        offset = offset + maxRecordCount;
      } else {
        fetching = false;
      }

      if (offset > 100000) {
        console.error("too many features");
        fetching = false;
      }
    }

    const protomapsFeatures: ProtomapsFeature[] = [];

    for (const f of arcgisFeatures) {
      const geomType = geomTypeMap(f.geometry?.type);

      if (geomType === null) {
        continue;
      }

      const transformedGeom: Point[][] = [];
      let numVertices = 0;

      // Calculate bbox
      const bbox = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity
      };

      let points: Position[][];

      if (isPoint(f)) {
        points = [[f.geometry.coordinates]];
      } else if (isMultiLineString(f)) {
        points = f.geometry.coordinates;
      } else if (isPolygon(f)) {
        points = f.geometry.coordinates;
      } else if (isMultiPolygon(f) && f.geometry.coordinates.length > 0) {
        throw new Error("MultiPolygon not supported");
      } else if (isLine(f)) {
        points = [f.geometry.coordinates];
      } else {
        throw new Error("GeometryCollection not supported");
      }

      for (const g1 of points) {
        const transformedG1: Point[] = [];
        for (const g2 of g1) {
          const transformedG2 = [
            ((g2[0] - arcgisExtent.xmin) / mapWidth) *
              PROTOMAPS_DEFAULT_TILE_SIZE,
            (1 - (g2[1] - arcgisExtent.ymin) / mapWidth) *
              PROTOMAPS_DEFAULT_TILE_SIZE
          ];
          if (bbox.minX > transformedG2[0]) {
            bbox.minX = transformedG2[0];
          }

          if (bbox.maxX < transformedG2[0]) {
            bbox.maxX = transformedG2[0];
          }

          if (bbox.minY > transformedG2[1]) {
            bbox.minY = transformedG2[1];
          }

          if (bbox.maxY < transformedG2[1]) {
            bbox.maxY = transformedG2[1];
          }
          transformedG1.push(new Point(transformedG2[0], transformedG2[1]));
          numVertices++;
        }
        transformedGeom.push(transformedG1);
      }

      protomapsFeatures.push({
        props: f.properties ?? {},
        bbox,
        geomType,
        geom: transformedGeom,
        numVertices
      });
    }

    const result = new Map<string, ProtomapsFeature[]>();
    result.set(GEOJSON_SOURCE_LAYER_NAME, protomapsFeatures);

    return result;
  }
}
