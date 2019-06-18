import { ObservableMap } from "mobx";
import { ModelId } from "../Traits/ModelReference";
import ModelTraits from "../Traits/ModelTraits";
import Trait from "../Traits/Trait";
import ModelPropertiesFromTraits from "./ModelPropertiesFromTraits";
import StratumFromTraits from "./StratumFromTraits";
import Terria from "./Terria";

export interface ModelConstructor<T> {
  new (globalId: string, terria: Terria): T;
  prototype: T;
}

export abstract class BaseModel {
  abstract get type(): string;
  abstract get traits(): {
    [id: string]: Trait;
  };
  abstract get strata(): ObservableMap<string, StratumFromTraits<ModelTraits>>;
  abstract get topStratum(): StratumFromTraits<ModelTraits>;

  constructor(readonly globalId: ModelId, readonly terria: Terria) {}

  abstract get strataTopToBottom(): StratumFromTraits<ModelTraits>[];
  abstract get strataBottomToTop(): StratumFromTraits<ModelTraits>[];

  abstract setTrait(stratumId: string, trait: unknown, value: unknown): void;
  abstract getTrait(stratumId: string, trait: unknown): unknown;
}

export interface ModelInterface<T extends ModelTraits> {
  readonly type: string;
  readonly traits: {
    [id: string]: Trait;
  };
  readonly strata: ObservableMap<string, StratumFromTraits<T>>;
  readonly terria: Terria;
  readonly globalId: string;

  readonly strataTopToBottom: StratumFromTraits<T>[];
  readonly strataBottomToTop: StratumFromTraits<T>[];
  readonly topStratum: StratumFromTraits<T>;

  setTrait<Key extends keyof StratumFromTraits<T>>(
    stratumId: string,
    trait: Key,
    value: StratumFromTraits<T>[Key]
  ): void;
  getTrait<Key extends keyof StratumFromTraits<T>>(
    stratumId: string,
    trait: Key
  ): StratumFromTraits<T>[Key];
}

type Model<T extends ModelTraits> = ModelInterface<T> &
  ModelPropertiesFromTraits<T>;

export default Model;
