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
  //comma separated list of supported capabilities - e.g. "Map,Query,Data,TilesOnly,Tilemap"
  capabilities?: string;
  mapName?: string;
  timeInfo?: TimeInfo;
  fullExtent: Extent;
  maxScale?: number;
}
