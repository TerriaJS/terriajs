import ModelTraits from "./ModelTraits";
import Trait from "./Trait";
import { JsonObject } from "../Core/Json";

export default interface TraitsConstructor<T extends ModelTraits> {
  new (...args: any[]): T;
  prototype: T;
  traits: {
    [key: string]: Trait;
  };
  description?: string;
  example?: JsonObject;
}
