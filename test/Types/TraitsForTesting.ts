import primitiveTrait from "../../lib/Traits/Decorators/primitiveTrait";
import objectTrait from "../../lib/Traits/Decorators/objectTrait";
import objectArrayTrait from "../../lib/Traits/Decorators/objectArrayTrait";
import ModelTraits from "../../lib/Traits/ModelTraits";
import { JsonObject } from "../../lib/Core/Json";
import enumTrait from "../../lib/Traits/decorators/enumTrait";

export enum MyEnum {
  foo,
  bar
}

export enum MyEnumString {
  foo = "test",
  bar = "baz"
}

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

  @primitiveTrait({
    name: "another",
    description: "another",
    type: "string"
  })
  another?: string;

  @primitiveTrait({
    name: "another with default",
    description: "another with default",
    type: "string"
  })
  anotherWithDefault?: string = "default";

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

  @enumTrait({
    enum: MyEnum,
    name: "Enum trait",
    description: "enumTrait"
  })
  enumTraitWithDefault: MyEnum = 0;

  @enumTrait({
    enum: MyEnum,
    name: "Enum trait",
    description: "enumTrait"
  })
  enumTraitWithoutDefault?: MyEnum;

  @enumTrait({
    enum: MyEnumString,
    name: "Enum trait",
    description: "enumTrait"
  })
  enumTraitStringWithDefault: MyEnumString = MyEnumString.foo;

  @enumTrait({
    enum: MyEnum,
    name: "Enum trait",
    description: "enumTrait"
  })
  enumTraitStringWithoutDefault?: MyEnumString;

  // TODO: Add trait decorator for unknown object
  unknownObject?: JsonObject;
  unknownObjectWithDefault: JsonObject = {};

  // TODO: Add/extend trait for nullable primitive
  withNull?: string | null;
}
