import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";
import objectTrait from "../Decorators/objectTrait";

export class EditorTraits extends ModelTraits {
  @primitiveTrait({
    type: "boolean",
    name: "Is editable?",
    description:
      "Indicates whether we can edit some aspect of the model item like its visibility or color"
  })
  isEditable = false;

  @primitiveTrait({
    type: "boolean",
    name: "Is transformable?",
    description: "Indicates whether we can rotate/translate/scale the model"
  })
  isTransformable = false;
}

/**
 * Traits for an external tool
 */
export default class PlaceEditorTraits extends ModelTraits {
  @objectTrait({
    type: EditorTraits,
    name: "Editor traits",
    description: "Editor traits"
  })
  editing?: EditorTraits;
}
