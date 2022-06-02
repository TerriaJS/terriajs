import { ModelId } from "../../Traits/ModelReference";
import ModelTraits from "../../Traits/ModelTraits";
import Trait from "../../Traits/Trait";
import TraitsConstructor from "../../Traits/TraitsConstructor";
import Terria from "../Terria";
import ModelPropertiesFromTraits from "./ModelPropertiesFromTraits";
import StratumFromTraits from "./StratumFromTraits";

export interface ModelConstructor<T> {
  new (
    uniqueId: string | undefined,
    terria: Terria,
    sourceReference?: BaseModel,
    strata?: Map<string, StratumFromTraits<ModelTraits>>
  ): T;
  prototype: T;
  TraitsClass: TraitsConstructor<ModelTraits>;
}

export abstract class BaseModel {
  abstract get type(): string;
  abstract get traits(): {
    [id: string]: Trait;
  };
  abstract get TraitsClass(): TraitsConstructor<ModelTraits>;
  abstract get knownContainerUniqueIds(): string[];
  abstract get completeKnownContainerUniqueIds(): string[];
  abstract get strata(): Map<string, StratumFromTraits<ModelTraits>>;

  constructor(
    readonly uniqueId: string | undefined,
    readonly terria: Terria,
    /**
     * The model whose {@link ReferenceMixin} references this model.
     * This instance will also be that model's {@link ReferenceMixin#target}
     * property. If undefined, this model is not the target of a reference.
     */
    readonly sourceReference: BaseModel | undefined
  ) {}

  dispose() {}

  abstract duplicateModel(
    newId: ModelId,
    sourceReference?: BaseModel
  ): BaseModel;

  abstract get strataTopToBottom(): ReadonlyMap<
    string,
    StratumFromTraits<ModelTraits>
  >;
  abstract get strataBottomToTop(): ReadonlyMap<
    string,
    StratumFromTraits<ModelTraits>
  >;

  abstract setTrait(stratumId: string, trait: unknown, value: unknown): void;
  abstract getTrait(stratumId: string, trait: unknown): unknown;
}

export type ArrayElementTypes<T extends ModelTraits> = {
  [P in keyof T]-?: NonNullable<T[P]> extends ArrayLike<infer E>
    ? E extends ModelTraits
      ? E
      : never
    : never;
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
  readonly completeKnownContainerUniqueIds: string[];

  /**
   * The model whose {@link ReferenceMixin} references this model.
   * This instance will also be that model's {@link ReferenceMixin#target}
   * property. If undefined, this model is not the target of a reference.
   */
  readonly sourceReference: BaseModel | undefined;

  readonly strataTopToBottom: ReadonlyMap<string, StratumFromTraits<T>>;
  readonly strataBottomToTop: ReadonlyMap<string, StratumFromTraits<T>>;

  dispose(): void;

  duplicateModel(newId: ModelId, sourceReference?: BaseModel): this;

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
   *
   * If no `objectId` is provided, the object will be placed at the end of the array (across all strata). This will take `isRemoval` and `idProperty="index"`into account.
   *
   * @param stratumId The ID of the stratum in which to add the object.
   * @param trait The name of the {@link objectArrayTrait} property.
   * @param objectId The ID of the new object.
   * @returns The new object, or undefined if the object still does not exist because a stratum above the specified one has removed it.
   */
  addObject<Key extends keyof ArrayElementTypes<T>>(
    stratumId: string,
    trait: Key,
    objectId?: string | undefined
  ): Model<ArrayElementTypes<T>[Key]> | undefined;
}

type Model<T extends ModelTraits> = ModelInterface<T> &
  ModelPropertiesFromTraits<T>;

export default Model;
