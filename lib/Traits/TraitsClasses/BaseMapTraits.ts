import CatalogMemberFactory from "../../Models/Catalog/CatalogMemberFactory";
import modelReferenceTrait from "../Decorators/modelReferenceTrait";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelReference from "../ModelReference";
import ModelTraits from "../ModelTraits";

export class LeafletPointTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "x",
    description: "X coordinate of the point"
  })
  x?: number;

  @primitiveTrait({
    type: "number",
    name: "y",
    description: "Y coordinate of the point"
  })
  y?: number;
}

export class LeafletBoundsTraits extends ModelTraits {
  @objectTrait({
    type: LeafletPointTraits,
    name: "min",
    description: "Top left corner point"
  })
  min?: LeafletPointTraits;

  @objectTrait({
    type: LeafletPointTraits,
    name: "min",
    description: "Bottom right corner point"
  })
  max?: LeafletPointTraits;
}

export class LeafletCrsTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "EPSG code",
    description: "The EPSG code for the projection"
  })
  epsgCode?: string;

  @primitiveTrait({
    type: "string",
    name: "PROJ4 definition",
    description: "The PROJ4 definition string for the EPSG code"
  })
  proj4Definition?: string;

  @objectTrait({
    type: LeafletPointTraits,
    name: "Origin",
    description: "Tile origin in projected coordinates."
  })
  origin?: LeafletPointTraits;

  @primitiveArrayTrait({
    type: "number",
    name: "Resolutions",
    description: "Projection units per pixel for zoom levels (eg meters/pixel)"
  })
  resolutions?: number[];

  @objectTrait({
    type: LeafletBoundsTraits,
    name: "Bounds",
    description: "Bounds of the CRS in projected coordinates"
  })
  bounds?: LeafletBoundsTraits;
}

export class LeafletOptionsTraits extends ModelTraits {
  @objectTrait({
    type: LeafletCrsTraits,
    name: "CRS",
    description: "CRS definition for Leaflet viewer"
  })
  crs?: LeafletCrsTraits;

  @primitiveTrait({
    type: "number",
    name: "maxZoom",
    description: "Max zoom to apply to layers"
  })
  maxZoom?: number;
}

export class BaseMapViewerTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Viewer mode",
    description: "This can be 'cesium' or 'leaflet'."
  })
  mode?: string; // should match ViewerMode

  @objectTrait({
    type: LeafletOptionsTraits,
    name: "Leaflet options",
    description: "Options for the Leaflet viewer"
  })
  leafletOptions?: LeafletOptionsTraits;
}

export class BaseMapTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Image",
    description: "Path to the basemap image"
  })
  image?: string;

  @primitiveTrait({
    type: "string",
    name: "Contrast color",
    description:
      "Color which should be used to contrast with basemap (eg for region mapping feature borders)"
  })
  contrastColor?: string = "#ffffff";

  @modelReferenceTrait({
    factory: CatalogMemberFactory,
    name: "Base map item",
    description:
      'Catalog item definition to be used for the base map. It is also possible to reference an existing catalog item using its id (i.e. `"//Surface Geology"`).'
  })
  item?: ModelReference;

  @objectTrait({
    type: BaseMapViewerTraits,
    name: "The viewer to use for this basemap",
    description:
      "Optional configuration for the viewer mode when using this basemap."
  })
  viewer?: BaseMapViewerTraits;
}

export class BaseMapsTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "defaultBaseMapId",
    description:
      "The id of the baseMap user will see on the first mapLoad. This wil be used **before** `defaultBaseMapName`"
  })
  defaultBaseMapId?: string;

  @primitiveTrait({
    type: "string",
    name: "defaultBaseMapName",
    description: "Name of the base map to use as default"
  })
  defaultBaseMapName?: string;

  @primitiveTrait({
    type: "string",
    name: "previewBaseMapId",
    description:
      "The id of the baseMap to be used as the base map in data preview. "
  })
  previewBaseMapId?: string = "basemap-natural-earth-II";

  @objectArrayTrait<BaseMapTraits>({
    type: BaseMapTraits,
    idProperty: "item",
    name: "items",
    description:
      "Array of catalog items definitions that can be used as a Base map."
  })
  items?: BaseMapTraits[];

  @primitiveArrayTrait({
    type: "string",
    name: "enabledBaseMaps",
    description:
      "Array of base maps ids that is available to user. Use this do define order of the base maps in settings panel. Leave undefined to show all basemaps."
  })
  enabledBaseMaps?: string[];
}
