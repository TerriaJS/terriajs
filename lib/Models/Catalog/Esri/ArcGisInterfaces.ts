import { JsonObject } from "../../../Core/Json";

interface DocumentInfo {
  Title?: string;
  Author?: string;
}

interface SpatialReference {
  wkid?: number;
  latestWkid?: number;
}

export interface Extent {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  spatialReference?: SpatialReference;
}

interface TimeInfo {
  timeExtent: [number, number];
}

interface TileInfo {
  rows: number;
  cols: number;
  dpi: number;
  format: string;
  compressionQuality?: number;
  origin: {
    x: number;
    y: number;
  };
  storageInfo?: {
    storageFormat: string;
    packetSize: number;
  };
  spatialReference: SpatialReference;
  lods: {
    level: number;
    resolution: number;
    scale: number;
  }[];
}

export interface Legend {
  label?: string;
  contentType: string;
  imageData: string;
  width: number;
  height: number;
}

export interface Legends {
  layers?: { layerId: number; layerName: string; legend?: Legend[] }[];
}

export interface Layer {
  id: number;
  name?: string;
  parentLayerId: number;
  // The following is pulled from <mapservice-url>/layers or <mapservice-url>/<layerOrTableId>
  description?: string;
  copyrightText?: string;
  type?: string;
  subLayerIds?: number[] | null;
  maxScale: number;
  extent?: Extent;
}

export interface MapServer {
  documentInfo?: DocumentInfo;
  name?: string;
  serviceDescription?: string;
  description?: string;
  copyrightText?: string;
  layers?: Layer[];
  subLayers?: Layer[];
  /** A single fused cache contains image tiles that are created by grouping all the layers together at each scale, or level of detail.
   * If this is true, and `capabilities` states `TilesOnly` - we are unable to request individual layers in a MapServer.
   * So instead we create a single item in the group called "All layers" (models.arcGisMapServerCatalogGroup.singleFusedMapCacheLayerName)
   */
  singleFusedMapCache?: boolean;
  tileInfo?: TileInfo;
  //comma separated list of supported capabilities - e.g. "Map,Query,Data,TilesOnly,Tilemap"
  capabilities?: string;
  mapName?: string;
  timeInfo?: TimeInfo;
  fullExtent: Extent;
  maxScale?: number;
}

export interface ImageServer {
  name?: string;
  serviceDescription?: string;
  description?: string;
  copyrightText?: string;
  timeInfo?: TimeInfo;
  fullExtent: Extent;

  singleFusedMapCache: boolean; //Indicates the existence of tile resource
  tileInfo?: TileInfo;
  //comma separated list of supported capabilities - e.g. "Image,Metadata..."
  capabilities?: string;
  spatialReference?: SpatialReference;

  maxScale?: number;
  minScale?: number;

  allowRasterFunction: boolean; //Indicates whether the service allows raster functions in request
  rasterFunctionInfos: [
    //Optional. Specifies the supported raster function templates the client can invoke. The first one is applied to exportImage request by default
    {
      name: string;
      description: string;
      help: string;
    }
  ];

  hasColormap: boolean;
  hasMultidimensions: boolean;

  bandNames?: string[];
  bandCount?: number;
}

export interface ImageServerIdentifyResult {
  objectId: number;
  name: string;
  /** CSV of pixel values per band */
  value: string;
  location: {
    x: number;
    y: number;
    spatialReference: SpatialReference;
  };
  properties: JsonObject | null;
  /** catalogItems are returned only when the image service source is a mosaic dataset */
  catalogItems?: null | {
    objectIdFieldName: string;
    spatialReference: SpatialReference;
    geometryType: string;
    features: unknown[];
  };
  catalogItemVisibilities?: number[];
}
