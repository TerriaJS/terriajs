import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import CatalogMemberTraits from "./CatalogMemberTraits";
import DiscretelyTimeVaryingTraits from "./DiscretelyTimeVaryingTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import StyleTraits from "./StyleTraits";
import UrlTraits from "./UrlTraits";

export class PerPropertyGeoJsonStyleTraits extends ModelTraits {
  @anyTrait({
    name: "Properties",
    description:
      "If the properties of a feature match these properties, then apply the style to that feature"
  })
  properties?: JsonObject;

  @objectTrait({
    name: "Style",
    type: StyleTraits,
    description:
      "Styling rules to apply, following [simplestyle-spec](https://github.com/mapbox/simplestyle-spec)"
  })
  style?: StyleTraits;

  @primitiveTrait({
    name: "Case sensitive",
    type: "boolean",
    description:
      "True if properties should be matched in a case sensitive fashion"
  })
  caseSensitive?: boolean = false;
}
export class GeoJsonTraits extends mixTraits(
  FeatureInfoTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits,
  DiscretelyTimeVaryingTraits
) {
  @objectTrait({
    type: StyleTraits,
    name: "Style",
    description:
      "Styling rules that follow [simplestyle-spec](https://github.com/mapbox/simplestyle-spec)"
  })
  style?: StyleTraits;

  @primitiveTrait({
    type: "boolean",
    name: "Clamp to Ground",
    description:
      "Whether the features in this GeoJSON should be clamped to the terrain surface. If `forceCesiumPrimitives` is false, this will be `true`"
  })
  clampToGround: boolean = true;

  @primitiveTrait({
    type: "boolean",
    name: "Force cesium primitives",
    description:
      "Force rendering GeoJSON features as Cesium primitives. This will be true if you are using `perPropertyStyles`, `timeProperty`, `heightProperty` or `czmlTemplate`. If undefined, it will look at configParameters.enableGeojsonMvt"
  })
  forceCesiumPrimitives?: boolean;

  @objectArrayTrait({
    name: "Per property styles",
    type: PerPropertyGeoJsonStyleTraits,
    description:
      "Override feature styles according to their properties. This is only supported for cesium primitives (see `forceCesiumPrimitives`)",
    idProperty: "index"
  })
  perPropertyStyles: PerPropertyGeoJsonStyleTraits[] = [];

  @primitiveTrait({
    name: "Time property",
    type: "string",
    description:
      "The property of each GeoJSON feature that specifies which point in time that feature is associated with. If not specified, it is assumed that the dataset is constant throughout time. This is only supported for cesium primitives (see `forceCesiumPrimitives`)"
  })
  timeProperty?: string;

  @primitiveTrait({
    name: "Height property",
    type: "string",
    description:
      "The property of each GeoJSON feature that specifies the height. If defined, polygons will be extruded to this property (in meters) above terrain. This is only supported for cesium primitives (see `forceCesiumPrimitives`)"
  })
  heightProperty?: string;

  @anyTrait({
    name: "CZML template",
    description: `CZML template to be used to replace each GeoJSON Point feature. Feature coordinates and properties will automatically be applied to CZML packet, so they can be used as references. If this is defined, \`clampToGround\`, \`style\`, \`perPropertyStyles\`, \`timeProperty\` and \`heightProperty\` will be ignored.

    For example - this will render a cylinder for every point (and use the length and radius feature properties)
      \`\`\`json
      {
        cylinder: {
          length: {
            reference: "#properties.length"
          },
          topRadius: {
            reference: "#properties.radius"
          },
          bottomRadius: {
            reference: "#properties.radius"
          },
          material: {
            solidColor: {
              color: {
                rgba: [0, 200, 0, 20]
              }
            }
          }
        }
      }
      \`\`\``
  })
  czmlTemplate?: JsonObject;
}
