import { computed, observable, runInAction, trace } from "mobx";
import { ModelId } from "../Traits/ModelReference";
import ModelTraits from "../Traits/ModelTraits";
import TraitsConstructor from "../Traits/TraitsConstructor";
import addModelStrataView from "./addModelStrataView";
import createStratumInstance from "./createStratumInstance";
import Model, { BaseModel, ModelConstructor, ModelInterface } from "./Model";
import StratumFromTraits from "./StratumFromTraits";
import StratumOrder from "./StratumOrder";
import Terria from "./Terria";

export default function CreateModel<T extends TraitsConstructor<ModelTraits>>(
  Traits: T
): ModelConstructor<Model<InstanceType<T>>> {
  type Traits = InstanceType<T>;
  type StratumTraits = StratumFromTraits<Traits>;

  abstract class Model extends BaseModel implements ModelInterface<Traits> {
    abstract get type(): string;
    static readonly traits = Traits.traits;
    readonly traits = Traits.traits;
    readonly strata = observable.map<string, StratumTraits>();

    /**
     * Gets the uniqueIds of models that are known to contain this one.
     * This is important because strata sometimes flow from container to
     * containee, so the properties of this model may not be complete
     * if the container isn't loaded yet. It's also important for locating
     * this model in a hierarchical catalog.
     */
    readonly knownContainerUniqueIds: string[] = [];

    constructor(id: string | undefined, terria: Terria) {
      super(id, terria);
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
    get strataTopToBottom(): StratumTraits[] {
      trace();
      return Array.from(StratumOrder.sortTopToBottom(this.strata).values());
    }

    @computed
    get strataBottomToTop() {
      return Array.from(StratumOrder.sortBottomToTop(this.strata).values());
    }

    @computed
    get topStratum() {
      return this.strataTopToBottom[0];
    }

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
  }

  addModelStrataView(Model, Traits);
  return <any>Model;
}
