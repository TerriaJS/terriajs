import StratumFromTraits from "../Models/Definition/StratumFromTraits";
import ModelTraits from "./ModelTraits";
import TraitsConstructor from "./TraitsConstructor";

export default interface Stratified<T extends ModelTraits> {
  readonly TraitsClass: TraitsConstructor<T>;
  readonly strata: Map<string, StratumFromTraits<T>>;
  readonly strataTopToBottom: ReadonlyMap<string, StratumFromTraits<T>>;
}
