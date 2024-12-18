import Point from "@mapbox/point-geometry";
import { Feature, Position } from "@turf/helpers";
import arcGisPbfDecode from "arcgis-pbf-parser";
import {
  Feature as ProtomapsFeature,
  TileSource,
  Zxy
} from "protomaps-leaflet";
import Request from "terriajs-cesium/Source/Core/Request";
import Resource from "terriajs-cesium/Source/Core/Resource";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import {
  isGeometryCollection,
  isLine,
  isMultiLineString,
  isMultiPolygon,
  isPoint,
  isPolygon
} from "../../../ModelMixins/GeojsonMixin";
import { PROTOMAPS_TILE_BUFFER } from "../../ImageryProvider/ProtomapsImageryProvider";
import {
  GEOJSON_SOURCE_LAYER_NAME,
  geomTypeMap
} from "./ProtomapsGeojsonSource";

interface ArcGisPbfSourceOptions {
  url: string;
  outFields: string[];
  maxRecordCountFactor: number;
  featuresPerTileRequest: number;
  maxTiledFeatures: number;
  tilingScheme: WebMercatorTilingScheme;
}

export class ArcGisPbfSource implements TileSource {
  private readonly baseResource: Resource;
  private readonly tilingScheme: WebMercatorTilingScheme;
  private readonly outFields: string[];
  private readonly maxRecordCountFactor: number;
  private readonly featuresPerTileRequest: number;
  private readonly maxTiledFeatures: number;

  constructor(options: ArcGisPbfSourceOptions) {
    this.baseResource = new Resource(options.url);
    this.baseResource.appendForwardSlash();
    this.tilingScheme = options.tilingScheme;

    this.outFields = options.outFields;
    this.maxRecordCountFactor = options.maxRecordCountFactor;
    this.featuresPerTileRequest = options.featuresPerTileRequest;
    this.maxTiledFeatures = options.maxTiledFeatures;
  }

  public async get(
    c: Zxy,
    tileSizePixels: number,
    request?: Request
  ): Promise<Map<string, ProtomapsFeature[]>> {
    const rect = this.tilingScheme.tileXYToNativeRectangle(c.x, c.y, c.z);

    const tileExtent = {
      xmin: rect.west,
      ymin: rect.south,
      xmax: rect.east,
      ymax: rect.north
    };

    const tileWidthNative = tileExtent.xmax - tileExtent.xmin;
    const nativePixelSize = tileWidthNative / tileSizePixels;

    const tileExtentWithBuffer = {
      xmin: rect.west - PROTOMAPS_TILE_BUFFER * nativePixelSize,
      ymin: rect.south - PROTOMAPS_TILE_BUFFER * nativePixelSize,
      xmax: rect.east + PROTOMAPS_TILE_BUFFER * nativePixelSize,
      ymax: rect.north + PROTOMAPS_TILE_BUFFER * nativePixelSize
    };

    const arcGisFeatures: Feature[] = [];

    let offset = 0;
    let fetching = true;

    while (fetching) {
      if (request && "cancelled" in request && request.cancelled) {
        console.log("CANCELLED");
        fetching = false;
        continue;
      }
      const tileResource = this.baseResource.getDerivedResource({
        // Not sure how to handle request here - as we are making multiple requests
        // request: request
      });
      tileResource.setQueryParameters({
        f: "pbf",
        resultType: "tile",
        inSR: "102100",
        geometry: JSON.stringify(tileExtentWithBuffer),
        geometryType: "esriGeometryEnvelope",
        outFields: this.outFields.join(","),
        where: "1=1",
        maxRecordCountFactor: this.maxRecordCountFactor,
        resultRecordCount: this.featuresPerTileRequest,
        outSR: "102100",
        spatialRel: "esriSpatialRelIntersects",
        maxAllowableOffset: nativePixelSize,
        quantizationParameters: JSON.stringify({
          extent: tileExtentWithBuffer,
          spatialReference: { wkid: 102100, latestWkid: 3857 },
          mode: "view",
          originPosition: "upperLeft",
          tolerance: nativePixelSize
        }),
        outSpatialReference: "102100",
        precision: "8",
        resultOffset: offset
      });

      const arrayBufferPromise = tileResource.fetchArrayBuffer();

      const arrayBuffer = await arrayBufferPromise;

      if (!arrayBuffer) {
        console.error("No data for URL: " + tileResource.url);
        fetching = false;
        continue;
      }

      const arcGisResponse = arcGisPbfDecode(new Uint8Array(arrayBuffer));
      arcGisFeatures.push(...arcGisResponse.featureCollection.features);

      if (arcGisResponse.featureCollection.features.length === 0) {
        fetching = false;
        continue;
      }

      if (
        arcGisResponse.featureCollection.features.length <=
        this.maxTiledFeatures
      ) {
        offset = offset + this.featuresPerTileRequest;
      } else {
        fetching = false;
      }

      if (offset > this.maxTiledFeatures) {
        console.warn(`ArcGisPbfSource: maxTiledFeatures exceeded`);
        fetching = false;
      }
    }

    const protomapsFeatures: ProtomapsFeature[] = [];

    for (const f of arcGisFeatures) {
      processFeature(f, tileExtentWithBuffer, tileSizePixels).forEach((pf) =>
        protomapsFeatures.push(pf)
      );
    }

    const result = new Map<string, ProtomapsFeature[]>();
    result.set(GEOJSON_SOURCE_LAYER_NAME, protomapsFeatures);

    return result;
  }

  public async pickFeatures(
    _x: number,
    _y: number,
    level: number,
    longitude: number,
    latitude: number
  ): Promise<ImageryLayerFeatureInfo[]> {
    return [];
  }
}

function processFeature(
  feature: Feature,
  tileExtentWithBuffer: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  },
  tileWidthPixels: number
): ProtomapsFeature[] {
  const tileWidthWithBuffer =
    tileExtentWithBuffer.xmax - tileExtentWithBuffer.xmin;
  const tileWidthWithBufferPixels = tileWidthPixels + 2 * PROTOMAPS_TILE_BUFFER;

  const geomType = geomTypeMap(feature.geometry?.type);

  if (geomType === null) {
    return [];
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

  if (isPoint(feature)) {
    points = [[feature.geometry.coordinates]];
  } else if (isMultiLineString(feature)) {
    points = feature.geometry.coordinates;
  } else if (isPolygon(feature)) {
    points = feature.geometry.coordinates;
  } else if (
    isMultiPolygon(feature) &&
    feature.geometry.coordinates.length > 0
  ) {
    return feature.geometry.coordinates.flatMap((polygon) =>
      processFeature(
        {
          type: "Feature",
          properties: feature.properties,
          geometry: { type: "Polygon", coordinates: polygon }
        },
        tileExtentWithBuffer,
        tileWidthPixels
      )
    );
  } else if (isLine(feature)) {
    points = [feature.geometry.coordinates];
  } else if (isGeometryCollection(feature)) {
    return feature.geometry.geometries.flatMap((geometry) =>
      processFeature(
        {
          type: "Feature",
          properties: feature.properties,
          geometry
        },
        tileExtentWithBuffer,
        tileWidthPixels
      )
    );
  } else {
    return [];
  }

  for (const g1 of points) {
    const transformedG1: Point[] = [];
    for (const g2 of g1) {
      const transformedG2 = [
        ((g2[0] - tileExtentWithBuffer.xmin) / tileWidthWithBuffer) *
          tileWidthWithBufferPixels -
          PROTOMAPS_TILE_BUFFER,
        (1 - (g2[1] - tileExtentWithBuffer.ymin) / tileWidthWithBuffer) *
          tileWidthWithBufferPixels -
          PROTOMAPS_TILE_BUFFER
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

  return [
    {
      props: feature.properties ?? {},
      bbox,
      geomType,
      geom: transformedGeom,
      numVertices
    }
  ];
}
