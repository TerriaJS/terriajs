import ModelTraits from "../Traits/ModelTraits";
import Trait from "../Traits/Trait";
import TraitsConstructor from "../Traits/TraitsConstructor";
import ModelPropertiesFromTraits from "./ModelPropertiesFromTraits";
import StratumFromTraits from "./StratumFromTraits";
import Terria from "./Terria";

export interface ModelConstructor<T> {
  new (
    uniqueId: string | undefined,
    terria: Terria,
    strata?: Map<string, StratumFromTraits<ModelTraits>>
  ): T;
  prototype: T;
}

export abstract class BaseModel {
  abstract get type(): string;
  abstract get traits(): {
    [id: string]: Trait;
  };
  abstract get TraitsClass(): TraitsConstructor<ModelTraits>;
  abstract get knownContainerUniqueIds(): string[];
  abstract get strata(): Map<string, StratumFromTraits<ModelTraits>>;
  abstract get topStratum(): StratumFromTraits<ModelTraits>;

  constructor(readonly uniqueId: string | undefined, readonly terria: Terria) {}

  abstract get strataTopToBottom(): StratumFromTraits<ModelTraits>[];
  abstract get strataBottomToTop(): StratumFromTraits<ModelTraits>[];

  abstract setTrait(stratumId: string, trait: unknown, value: unknown): void;
  abstract getTrait(stratumId: string, trait: unknown): unknown;
}

export type ArrayElementTypes<T extends ModelTraits> = {
  [P in keyof T]-?: NonNullable<T[P]> extends ArrayLike<infer E>
    ? E extends ModelTraits
      ? E
      : never
    : never
};

export interface ModelInterface<T extends ModelTraits> {
  readonly type: string;
  readonly traits: {
    [id: string]: Trait;
  };
  readonly TraitsClass: TraitsConstructor<T>;
  readonly strata: Map<string, StratumFromTraits<T>>;
  readonly terria: Terria;
  readonly uniqueId: string | undefined;
  readonly knownContainerUniqueIds: string[];

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

  /**
   * Adds a new object to an {@link objectArrayTrait}.
   * @param stratumId The ID of the stratum in which to add the object.
   * @param trait The name of the {@link objectArrayTrait} property.
   * @param objectId The ID of the new object.
   * @returns The new object, or undefined if the object still does not exist
   *          because a stratum above the specified one has removed it.
   */
  addObject<Key extends keyof ArrayElementTypes<T>>(
    stratumId: string,
    trait: Key,
    objectId: string
  ): Model<ArrayElementTypes<T>[Key]> | undefined;
}

type Model<T extends ModelTraits> = ModelInterface<T> &
  ModelPropertiesFromTraits<T>;

export default Model;
