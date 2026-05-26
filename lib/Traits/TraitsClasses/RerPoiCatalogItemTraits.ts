import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";
import { traitClass } from "../Trait";
import mixTraits from "../mixTraits";
import ArcGisFeatureServerCatalogItemTraits from "./ArcGisFeatureServerCatalogItemTraits";

@traitClass({
  description: "POI domain style group."
})
export class PoiDomainStyleGroup extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "ID",
    description: "Unique identifier for this style group."
  })
  id: string = "";

  @primitiveTrait({
    type: "string",
    name: "Symbol",
    description: "The Maki icon symbol to use for this group of POI domains."
  })
  symbol: string = "marker";

  @primitiveTrait({
    type: "string",
    name: "Color",
    description:
      "The marker color to use for this group of POI domains. Accepts CSS color strings."
  })
  color?: string;

  @primitiveArrayTrait({
    type: "number",
    name: "Domain IDs",
    description: "The domain IDs that share this POI marker style."
  })
  domainIds: number[] = [];
}

@traitClass({
  description:
    "Level ID to camera height mapping for progressive POI filtering."
})
export class LevelIdCameraHeightMapping extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "Level ID",
    description: "The zoom level ID from the RER3D POI service."
  })
  levelId: number = 0;

  @primitiveTrait({
    type: "number",
    name: "Camera height threshold (meters)",
    description:
      "The camera height threshold in meters at which this zoom level should be displayed. Converted from cartographic scale."
  })
  cameraHeightThreshold: number = 0;
}

@traitClass({
  description: `Creates a single item in the catalog from RER3D POI (Regione Emilia-Romagna 3D Points of Interest) service.

This specialized feature server item provides dynamic viewport-based loading and custom styling for POI layers,
with zoom-level aware filtering and support for domain-based icon/color mapping.`,
  example: {
    url: "https://servizigis.regione.emilia-romagna.it/geoags/rest/services/portale/rer3d_poi/MapServer/0",
    type: "rer-poi",
    name: "RER POI",
    id: "rer-poi"
  }
})
export default class RerPoiCatalogItemTraits extends mixTraits(
  ArcGisFeatureServerCatalogItemTraits
) {
  @primitiveTrait({
    type: "boolean",
    name: "Show debug bounding box",
    description:
      "Whether to display the camera viewport and padded query bounding boxes on the map."
  })
  showDebugBBox: boolean = false;

  @primitiveTrait({
    type: "string",
    name: "Name field",
    description:
      "The name of the feature attribute field that contains the POI name."
  })
  nameField: string = "NOME";

  @primitiveTrait({
    type: "boolean",
    name: "Show labels",
    description: "Whether to show labels for POI markers."
  })
  showLabels: boolean = false;

  @primitiveTrait({
    type: "string",
    name: "Label text color",
    description: "The color of the label text for POI markers."
  })
  labelTextColor: string = "#ffffff";

  @primitiveTrait({
    type: "number",
    name: "Label font size",
    description: "The font size in pixels for POI marker labels."
  })
  labelFontSize: number = 12;

  @primitiveTrait({
    type: "number",
    name: "Label outline width",
    description: "The outline width in pixels for POI marker labels."
  })
  labelOutlineWidth: number = 3;

  @primitiveTrait({
    type: "string",
    name: "Label outline color",
    description: "The outline color for POI marker labels."
  })
  labelOutlineColor: string = "rgba(0, 0, 0, 0.65)";

  @primitiveTrait({
    type: "string",
    name: "Scale field",
    description:
      "The name of the feature attribute field that defines the visibility scale/distance for each POI."
  })
  scaleField: string = "SCALA";

  @primitiveTrait({
    type: "string",
    name: "Level ID field",
    description:
      "The name of the feature attribute field that contains the zoom level ID."
  })
  levelIdField: string = "LEVEL_ID";

  @primitiveTrait({
    type: "string",
    name: "Domain ID field",
    description:
      "The name of the feature attribute field that contains the domain/category ID for styling."
  })
  domainIdField: string = "ID_DOMINIO";

  @primitiveTrait({
    type: "number",
    name: "Minimum level ID",
    description:
      "The minimum zoom level ID to request from the service. Lower values represent farther zoom levels."
  })
  minLevelId: number = 7;

  @primitiveTrait({
    type: "number",
    name: "Maximum level ID",
    description:
      "The maximum zoom level ID to request from the service. Higher values represent closer zoom levels."
  })
  maxLevelId: number = 19;

  @primitiveTrait({
    type: "number",
    name: "Query bbox padding ratio",
    description:
      "The padding ratio to apply to the viewport rectangle when querying features. A value of 0.2 means 20% padding on each side."
  })
  queryBboxPaddingRatio: number = 0.2;

  @primitiveTrait({
    type: "number",
    name: "Dynamic request debounce (ms)",
    description:
      "The debounce time in milliseconds for viewport change requests. Prevents excessive server requests during camera movement."
  })
  dynamicRequestDebounceMs: number = 350;

  @primitiveTrait({
    type: "number",
    name: "Camera tilt limit (degrees)",
    description:
      "The maximum camera tilt angle in degrees. Applied when the RerPoi layer is shown to limit steep viewing angles."
  })
  cameraTiltLimitDegrees: number = 60;

  @primitiveTrait({
    type: "string",
    name: "Default marker color",
    description:
      "The default color for POI markers when no domain-specific color is defined. Accepts CSS color strings."
  })
  defaultMarkerColor: string = "royalblue";

  @primitiveTrait({
    type: "number",
    name: "Marker size (pixels)",
    description: "The size of marker icons in pixels."
  })
  markerSize: number = 48;

  @primitiveTrait({
    type: "number",
    name: "Icon stroke width",
    description: "The width of the stroke around icon symbols in pixels."
  })
  iconStrokeWidth: number = 1;

  @primitiveTrait({
    type: "string",
    name: "Icon stroke color",
    description:
      "The color of the stroke around icon symbols. Accepts CSS color strings."
  })
  iconStrokeColor: string = "#000000";

  @objectArrayTrait({
    type: LevelIdCameraHeightMapping,
    idProperty: "levelId",
    name: "Level ID camera height mappings",
    description:
      "Maps zoom level IDs to camera height thresholds in meters. Used for progressive POI filtering based on camera altitude. Thresholds are derived from cartographic scales and represent the camera altitude at which each level should be displayed."
  })
  levelIdMappings: LevelIdCameraHeightMapping[] = [
    { levelId: 7, cameraHeightThreshold: 46223.24 },
    { levelId: 8, cameraHeightThreshold: 23111.62 },
    { levelId: 9, cameraHeightThreshold: 11555.81 },
    { levelId: 10, cameraHeightThreshold: 5777.9 },
    { levelId: 11, cameraHeightThreshold: 2888.95 },
    { levelId: 12, cameraHeightThreshold: 1444.47 },
    { levelId: 13, cameraHeightThreshold: 722.23 },
    { levelId: 14, cameraHeightThreshold: 361.11 },
    { levelId: 15, cameraHeightThreshold: 180.55 },
    { levelId: 16, cameraHeightThreshold: 90.27 },
    { levelId: 17, cameraHeightThreshold: 45.13 },
    { levelId: 18, cameraHeightThreshold: 22.56 },
    { levelId: 19, cameraHeightThreshold: 11.28 }
  ];

  @objectArrayTrait({
    type: PoiDomainStyleGroup,
    idProperty: "id",
    name: "POI domain style groups",
    description:
      "Defines the mapping between domain IDs and their associated icon symbols and colors."
  })
  poiDomainStyleGroups: PoiDomainStyleGroup[] = [
    {
      id: "group-1",
      symbol: "village",
      domainIds: [1, 2]
    },
    {
      id: "group-2",
      symbol: "industrial",
      domainIds: [3]
    },
    {
      id: "group-3",
      symbol: "village",
      color: "#ff0",
      domainIds: [4]
    },
    {
      id: "group-4",
      symbol: "village",
      color: "#333",
      domainIds: [5]
    },
    {
      id: "group-5",
      symbol: "village",
      color: "#fff",
      domainIds: [6]
    },
    {
      id: "group-6",
      symbol: "square",
      domainIds: [7]
    },
    {
      id: "group-7",
      symbol: "cross",
      domainIds: [8]
    },
    {
      id: "group-8",
      symbol: "mountain",
      color: "#ff00ff",
      domainIds: [9]
    },
    {
      id: "group-9",
      symbol: "triangle",
      domainIds: [10]
    },
    {
      id: "group-10",
      symbol: "triangle-stroked",
      domainIds: [11]
    },
    {
      id: "group-11",
      symbol: "marker",
      domainIds: [12, 15, 19, 20, 21, 22, 24]
    },
    {
      id: "group-12",
      symbol: "water",
      domainIds: [13, 14, 16, 17, 18, 23]
    },
    {
      id: "group-13",
      symbol: "town",
      domainIds: [601]
    },
    {
      id: "group-14",
      symbol: "city",
      domainIds: [602, 603]
    }
  ];
}

export const defaultRerPoiCatalogItemTraits = new RerPoiCatalogItemTraits();
