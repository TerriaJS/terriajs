import { computed, observable, runInAction, trace, action } from "mobx";
import { getObjectId } from "../Traits/ArrayNestedStrataMap";
import { ModelId } from "../Traits/ModelReference";
import ModelTraits from "../Traits/ModelTraits";
import { ObjectArrayTrait } from "../Traits/objectArrayTrait";
import TraitsConstructor from "../Traits/TraitsConstructor";
import addModelStrataView from "./addModelStrataView";
import createStratumInstance from "./createStratumInstance";
import ModelType, {
  ArrayElementTypes,
  BaseModel,
  ModelConstructor,
  ModelInterface
} from "./Model";
import StratumFromTraits from "./StratumFromTraits";
import StratumOrder from "./StratumOrder";
import Terria from "./Terria";

export default function CreateModel<T extends TraitsConstructor<ModelTraits>>(
  Traits: T
): ModelConstructor<ModelType<InstanceType<T>>> {
  type Traits = InstanceType<T>;
  type StratumTraits = StratumFromTraits<Traits>;

  abstract class Model extends BaseModel implements ModelInterface<Traits> {
    abstract get type(): string;
    static readonly TraitsClass = Traits;
    static readonly traits = Traits.traits;
    readonly traits = Traits.traits;
    readonly TraitsClass: TraitsConstructor<InstanceType<T>> = <any>Traits;
    readonly strata: Map<string, StratumTraits>;
    readonly sourceReference: BaseModel | undefined;

    /**
     * Gets the uniqueIds of models that are known to contain this one.
     * This is important because strata sometimes flow from container to
     * containee, so the properties of this model may not be complete
     * if the container isn't loaded yet. It's also important for locating
     * this model in a hierarchical catalog.
     */
    readonly knownContainerUniqueIds: string[] = [];

    constructor(
      id: string | undefined,
      terria: Terria,
      sourceReference: BaseModel | undefined,
      strata: Map<string, StratumTraits> | undefined
    ) {
      super(id, terria, sourceReference);
      this.strata = strata || observable.map<string, StratumTraits>();
    }

    private getOrCreateStratum(id: string): StratumTraits {
      let result = this.strata.get(id);
      if (!result) {
        const newStratum = createStratumInstance(Traits);
        runInAction(() => {
          this.strata.set(id, newStratum);
        });
        result = newStratum;
      }
      return result;
    }

    duplicateModel(newId: ModelId): this {
      const newModel = new (<any>this.constructor)(newId, this.terria);
      this.strata.forEach((strata, stratumId) => {
        newModel.strata.set(stratumId, createStratumInstance(Traits, strata));
      });
      this.terria.addModel(newModel);
      return newModel;
    }

    @computed
    get strataTopToBottom(): ReadonlyMap<string, StratumTraits> {
      trace();
      return StratumOrder.sortTopToBottom(this.strata);
    }

    @computed
    get strataBottomToTop(): ReadonlyMap<string, StratumTraits> {
      return StratumOrder.sortBottomToTop(this.strata);
    }

    @action
    setTrait<Key extends keyof StratumTraits>(
      stratumId: string,
      trait: Key,
      value: StratumTraits[Key]
    ): void {
      this.getOrCreateStratum(stratumId)[trait] = value;
    }

    getTrait<Key extends keyof StratumTraits>(
      stratumId: string,
      trait: Key
    ): StratumTraits[Key] {
      return this.getOrCreateStratum(stratumId)[trait];
    }

    addObject<Key extends keyof ArrayElementTypes<Traits>>(
      stratumId: string,
      traitId: Key,
      objectId: string
    ): ModelType<ArrayElementTypes<Traits>[Key]> | undefined {
      const trait = this.traits[traitId as string] as ObjectArrayTrait<
        ArrayElementTypes<Traits>[Key]
      >;
      const nestedTraitsClass = trait.type;
      const newStratum = createStratumInstance(nestedTraitsClass);
      (<any>newStratum)[trait.idProperty] = objectId;

      const stratum: any = this.getOrCreateStratum(stratumId);
      let array = stratum[traitId];
      if (array === undefined) {
        stratum[traitId] = [];
        array = stratum[traitId];
      }

      array.push(newStratum);

      const models: readonly ModelType<ArrayElementTypes<Traits>[Key]>[] = (<
        any
      >this)[traitId];
      return models.find(
        (o: any, i: number) => getObjectId(trait.idProperty, o, i) === objectId
      );
    }
  }

  addModelStrataView(Model, Traits);
  return <any>Model;
}
