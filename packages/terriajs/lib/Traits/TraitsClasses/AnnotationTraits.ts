import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";
import { traitClass } from "../Trait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import MappableTraits from "./MappableTraits";

export class AnnotationTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "ID",
    description: "The unique identifier of the annotation."
  })
  id?: string;

  @primitiveTrait({
    type: "number",
    name: "Longitude",
    description: "The longitude of the annotation in degrees."
  })
  longitude?: number;

  @primitiveTrait({
    type: "number",
    name: "Latitude",
    description: "The latitude of the annotation in degrees."
  })
  latitude?: number;

  @primitiveTrait({
    type: "number",
    name: "Height",
    description:
      "The height of the annotation in metres. If undefined, the annotation is clamped to the ground."
  })
  height?: number;

  @primitiveTrait({
    type: "string",
    name: "Title",
    description:
      "An optional plain-text title, shown as the annotation's name in the feature info panel."
  })
  title?: string;

  @primitiveTrait({
    type: "string",
    name: "Text",
    description: "The rich-text (HTML) content of the annotation."
  })
  text?: string;

  @primitiveTrait({
    type: "boolean",
    name: "Open",
    description:
      "Whether the annotation's floating popup is currently open on the map. Persisted so open popups are restored in share links and story scenes."
  })
  open?: boolean;
}

@traitClass({
  description: `Creates a set of user-authored annotations - a marker plus rich text
  placed at a point on the map. Annotations render in both 2D (Leaflet) and 3D (Cesium)
  and persist in share links.`,
  example: {
    type: "annotations",
    name: "Annotations",
    id: "some unique ID",
    annotations: [
      {
        id: "annotation-1",
        longitude: 133.0,
        latitude: -25.0,
        text: "<p>Hello <strong>world</strong></p>"
      }
    ]
  }
})
export default class AnnotationCatalogItemTraits extends mixTraits(
  CatalogMemberTraits,
  MappableTraits
) {
  @objectArrayTrait({
    type: AnnotationTraits,
    idProperty: "id",
    name: "Annotations",
    description: "The list of annotations."
  })
  annotations: AnnotationTraits[] = [];
}
