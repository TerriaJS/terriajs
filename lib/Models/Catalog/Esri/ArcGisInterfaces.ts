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

export interface ImageServerMultidimensionInfo {
  multidimensionalInfo: {
    variables: [
      {
        name: string;
        description: string;
        unit: string;
        dimensions: [
          {
            name: string;
            description: string;
            unit: string;
            field: string;
            /** the extent of dimension values, the element type depends on the dimension's field type, can be time, or double */
            extent: [number, number];
            /** indicates whether one dimension value has both lower and upper bounds. */
            hasRanges: boolean;
            /** If hasRanges=false, each element is one single value; if hasRanges=true, each element is an array of lower/upper bounds */
            values: number[] | [number, number][];
            hasRegularIntervals?: boolean;
            interval?: number;
            intervalUnit?: string;
          }
        ];
      }
    ];
  };
}

export const ImageServerWellKnownRasterFunctions = [
  "ArgStatistics",
  "Arithmetic",
  "Aspect",
  "BandArithmetic",
  "Classify",
  "Clip",
  "Colormap",
  "ColormapToRGB",
  "Complex",
  "CompositeBand",
  "ContrastBrightness",
  "Convolution",
  "CreateColorComposite",
  "Curvature",
  "ElevationVoidFill",
  "ExtractBand",
  "Geometric",
  "Greyscale",
  "Identity",
  "Hillshade",
  "Local",
  "Mask",
  "MLClassify",
  "NDVI",
  "Pansharpening",
  "RasterCalculator",
  "Recast",
  "Remap",
  "Resample",
  "SegmentMeanShift",
  "ShadedRelief",
  "Slope",
  "Statistics",
  "StatisticsHistogram",
  "Stretch",
  "SurfaceParamFunction",
  "TasseledCap",
  "Threshold",
  "TransposeBits",
  "UnitConversion",
  "Vectorfield",
  "VectorFieldRenderer",
  "WeightedSum",
  "WeightedOverlay"
];

export const ImageServerBuiltInColorRamps = [
  "Black to White",
  "Blue Bright",
  "Blue Light to Dark",
  "Blue-Green Bright",
  "Blue-Green Light to Dark",
  "Brown Light to Dark",
  "Brown to Blue Green Diverging, Bright",
  "Brown to Blue Green Diverging, Dark",
  "Coefficient Bias",
  "Cold to Hot Diverging",
  "Condition Number",
  "Cyan to Purple",
  "Cyan-Light to Blue-Dark Distance",
  "Elevation #1",
  "Elevation #2",
  "Errors",
  "Gray Light to Dark",
  "Green Bright",
  "Green Light to Dark",
  "Green to Blue",
  "Orange Bright",
  "Orange Light to Dark",
  "Partial Spectrum",
  "Partial Spectrum 1 Diverging",
  "Partial Spectrum 2 Diverging",
  "Pink to YellowGreen Diverging, Bright",
  "Pink to YellowGreen Diverging, Dark",
  "Precipitation",
  "Prediction",
  "Purple Bright",
  "Purple to Green Diverging, Bright",
  "Purple to Green Diverging, Dark",
  "Purple-Blue Bright",
  "Purple-Blue Light to Dark",
  "Purple-Red Bright",
  "Purple-Red Light to Dark",
  "Red Bright",
  "Red Light to Dark",
  "Red to Blue Diverging, Bright",
  "Red to Blue Diverging, Dark",
  "Red to Green",
  "Red to Green Diverging, Bright",
  "Red to Green Diverging, Dark",
  "Slope",
  "Spectrum-Full Bright",
  "Spectrum-Full Dark",
  "Spectrum-Full Light",
  "Surface",
  "Temperature",
  "White to Black",
  "Yellow to Dark Red",
  "Yellow to Green to Dark Blue",
  "Yellow to Red",
  "Yellow-Green Bright",
  "Yellow-Green Light to Dark"
];
