import ModelTraits from "./ModelTraits";
import Trait from "./Trait";

export default interface TraitsConstructor<T extends ModelTraits> {
  new (...args: any[]): T;
  prototype: T;
  traits: {
    [key: string]: Trait;
  };
}
