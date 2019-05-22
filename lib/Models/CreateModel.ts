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

    constructor(id: ModelId, terria: Terria) {
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

    @computed
    get strataTopToBottom(): StratumTraits[] {
      trace();
      return StratumOrder.sortTopToBottom(this.strata);
    }

    @computed
    get strataBottomToTop() {
      return StratumOrder.sortBottomToTop(this.strata);
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
