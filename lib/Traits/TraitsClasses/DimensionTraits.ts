import ModelTraits from "../ModelTraits";
import {
  EnumDimension,
  EnumDimensionOption
} from "../../Models/SelectableDimensions/SelectableDimensions";
import primitiveTrait from "../Decorators/primitiveTrait";
import anyTrait from "../Decorators/anyTrait";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import { JsonObject } from "../../Core/Json";

export class DimensionOptionTraits
  extends ModelTraits
  implements EnumDimensionOption
{
  @primitiveTrait({
    type: "string",
    name: "ID",
    description: "Option ID"
  })
  id?: string;

  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "Option name (human-readable)"
  })
  name?: string;

  @anyTrait({
    name: "Value",
    description: "Value (if this is undefined, `id` will be used)"
  })
  value?: JsonObject;
}

export default class EnumDimensionTraits
  extends ModelTraits
  implements EnumDimension
{
  @primitiveTrait({
    type: "string",
    name: "ID",
    description: "Dimension ID"
  })
  id?: string;

  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "Dimension name (human-readable)"
  })
  name?: string;

  @objectArrayTrait({
    type: DimensionOptionTraits,
    idProperty: "id",
    name: "Options",
    description: "Dimension options"
  })
  options?: DimensionOptionTraits[];

  @primitiveTrait({
    type: "string",
    name: "Selected ID",
    description: "Selected Option's ID"
  })
  selectedId?: string;

  @primitiveTrait({
    type: "boolean",
    name: "Allow undefined",
    description: "Allow dimension to be undefined"
  })
  allowUndefined?: boolean;

  @primitiveTrait({
    type: "boolean",
    name: "Disable dimension",
    description: "Hides dimension"
  })
  disable?: boolean;
}
