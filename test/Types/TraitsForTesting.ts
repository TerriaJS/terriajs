import primitiveTrait from "../../lib/Traits/primitiveTrait";
import objectTrait from "../../lib/Traits/objectTrait";
import objectArrayTrait from "../../lib/Traits/objectArrayTrait";
import ModelTraits from "../../lib/Traits/ModelTraits";
import { JsonObject } from "../../lib/Core/Json";

export class NestedTraits extends ModelTraits {
  @primitiveTrait({
    name: "WithDefault",
    description: "Description",
    type: "number"
  })
  withDefault: number = 10;

  @primitiveTrait({
    name: "WithoutDefault",
    description: "Description",
    type: "number"
  })
  withoutDefault?: number;

  // TODO: Add trait decorator for unknown object
  unknownObject?: JsonObject;
  unknownObjectWithDefault: JsonObject = {};

  // TODO: Add/extend trait for nullable primitive
  withNull?: string | null;
}

export default class TraitsForTesting extends ModelTraits {
  @primitiveTrait({
    name: "WithDefault",
    description: "Description",
    type: "number"
  })
  withDefault: number = 10;

  @primitiveTrait({
    name: "WithoutDefault",
    description: "Description",
    type: "number"
  })
  withoutDefault?: number;

  @primitiveTrait({
    name: "SomeBool",
    description: "Description",
    type: "boolean"
  })
  someBool?: boolean;

  @objectTrait({
    name: "NestedWithDefault",
    description: "Description",
    type: NestedTraits
  })
  nestedWithDefault: NestedTraits = new NestedTraits();

  @objectTrait({
    name: "NestedWithDefault",
    description: "Description",
    type: NestedTraits
  })
  nestedWithoutDefault?: NestedTraits;

  @objectArrayTrait({
    name: "NestedArrayWithDefault",
    description: "Description",
    type: NestedTraits,
    idProperty: "withDefault"
  })
  nestedArrayWithDefault: NestedTraits[] = [];

  @objectArrayTrait({
    name: "NestedArrayWithoutDefault",
    description: "Description",
    type: NestedTraits,
    idProperty: "withDefault"
  })
  nestedArrayWithoutDefault?: NestedTraits[];

  // TODO: Add trait decorator for unknown object
  unknownObject?: JsonObject;
  unknownObjectWithDefault: JsonObject = {};

  // TODO: Add/extend trait for nullable primitive
  withNull?: string | null;
}
