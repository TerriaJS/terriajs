import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";

export const SUPPORTED_CRS_3857 = ["EPSG:3857", "EPSG:900913"];
export const SUPPORTED_CRS_4326 = ["EPSG:4326", "CRS:84", "EPSG:4283"];

export class PointTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "X",
    description: "X coordinate"
  })
  x?: number;

  @primitiveTrait({
    type: "number",
    name: "Y",
    description: "Y coordinate"
  })
  y?: number;
}

export class ProjectedBoundingBoxTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "CRS",
    description: "The CRS in which this boundibg box is defined"
  })
  crs?: string;

  @objectTrait({
    type: PointTraits,
    name: "min",
    description: "Bounding box min point"
  })
  min?: PointTraits;

  @objectTrait({
    type: PointTraits,
    name: "max",
    description: "Bounding box max point"
  })
  max?: PointTraits;
}

export default class CrsTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "CRS",
    description: `CRS to use with WMS layers. We support Web Mercator (${SUPPORTED_CRS_3857.join(
      ", "
    )}) and WGS 84 (${SUPPORTED_CRS_4326.join(", ")})`
  })
  crs?: string;

  @primitiveTrait({
    type: "string",
    name: "Preview CRS",
    description: `CRS to use with WMS layers. We support Web Mercator (${SUPPORTED_CRS_3857.join(
      ", "
    )}) and WGS 84 (${SUPPORTED_CRS_4326.join(", ")})`
  })
  previewCrs?: string;

  @primitiveTrait({
    type: "string",
    name: "Tiling scheme generator",
    description: `Name of a registered tiling scheme generator to use. Plugins may set this to custom tiling scheme generator.`
  })
  tilingSchemeGenerator?: string = "default";

  @primitiveArrayTrait({
    type: "string",
    name: "Available CRS",
    description:
      "A list of valid CRS for this dataset. This should be automatically discovered from the service metadata if available."
  })
  availableCrs?: string[];

  @objectArrayTrait({
    type: ProjectedBoundingBoxTraits,
    idProperty: "crs",
    name: "Bounding boxes",
    description: "Native bounding boxes for supported CRS."
  })
  boundingBoxes?: ProjectedBoundingBoxTraits[];
}
