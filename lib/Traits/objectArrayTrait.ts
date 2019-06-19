import { computed } from "mobx";
import TerriaError from "../Core/TerriaError";
import addModelStrataView from "../Models/addModelStrataView";
import CommonStrata from "../Models/CommonStrata";
import Model, { BaseModel, ModelConstructor } from "../Models/Model";
import ModelPropertiesFromTraits from "../Models/ModelPropertiesFromTraits";
import saveStratumToJson from "../Models/saveStratumToJson";
import StratumFromTraits from "../Models/StratumFromTraits";
import ModelTraits from "./ModelTraits";
import Trait, { TraitOptions } from "./Trait";
import traitsClassToModelClass from "./traitsClassToModelClass";
import TraitsConstructor from "./TraitsConstructor";
import StratumOrder from "../Models/StratumOrder";

interface TraitsConstructorWithRemoval<T extends ModelTraits>
  extends TraitsConstructor<T> {
  isRemoval?: (instance: StratumFromTraits<T>) => boolean;
}

export interface ObjectArrayTraitOptions<T extends ModelTraits>
  extends TraitOptions {
  type: TraitsConstructorWithRemoval<T>;
  idProperty: keyof T | "index";
}

export default function objectArrayTrait<T extends ModelTraits>(
  options: ObjectArrayTraitOptions<T>
) {
  return function(target: any, propertyKey: string) {
    const constructor = target.constructor;
    if (!constructor.traits) {
      constructor.traits = {};
    }
    constructor.traits[propertyKey] = new ObjectArrayTrait(
      propertyKey,
      options
    );
  };
}

export class ObjectArrayTrait<T extends ModelTraits> extends Trait {
  readonly type: TraitsConstructorWithRemoval<T>;
  readonly idProperty: keyof T | "index";
  readonly decoratorForFlattened = computed.struct;
  readonly ModelClass: ModelConstructor<Model<T>>;

  constructor(id: string, options: ObjectArrayTraitOptions<T>) {
    super(id, options);
    this.type = options.type;
    this.idProperty = options.idProperty;
    this.ModelClass = traitsClassToModelClass(this.type);
  }

  getValue(model: BaseModel): readonly Model<T>[] | undefined {
    const strataTopToBottom: Map<string, any> = StratumOrder.sortTopToBottom(
      model.strata
    );

    // const objectArrayStrata = strataTopToBottom
    //   .map((stratum: any) => stratum && stratum[this.id])
    //   .filter(stratumValue => stratumValue !== undefined);
    // if (objectArrayStrata.length === 0) {
    //   return undefined;
    // }

    const result: Map<string, StratumFromTraits<T>>[] = [];
    const idMap: { [id: string]: Map<string, StratumFromTraits<T>> } = {};
    const removedIds: { [id: string]: boolean } = {};

    // Find the unique objects and the strata that go into each.
    for (let stratumId of strataTopToBottom.keys()) {
      const stratum = strataTopToBottom.get(stratumId);
      const objectArray = stratum[this.id];

      if (!objectArray) {
        continue;
      }

      objectArray.forEach(
        (o: StratumFromTraits<T> & { index?: number }, i: number) => {
          const id =
            this.idProperty === "index"
              ? o.index === undefined
                ? i.toString()
                : o.index.toString()
              : <string>(<unknown>o[this.idProperty]);
          if (this.type.isRemoval !== undefined && this.type.isRemoval(o)) {
            // This ID is removed in this stratum.
            removedIds[id] = true;
          } else if (removedIds[id]) {
            // This ID was removed by a stratum above this one, so ignore it.
            return;
          } else if (!idMap[id]) {
            // This is the first time we've seen this ID, so add it
            const strataMap = new Map<string, StratumFromTraits<T>>();
            strataMap.set(stratumId, o);
            idMap[id] = strataMap;
            result.push(strataMap);
          } else {
            idMap[id].set(stratumId, o);
          }
        }
      );
    }

    // Flatten each unique object.
    return result.map(modelSource => {
      const result = new this.ModelClass(model.uniqueId, model.terria);
      modelSource.forEach((stratum: any, stratumId) => {
        result.strata.set(stratumId, stratum);
      });
      return result;
    });
  }

  fromJson(
    model: BaseModel,
    stratumName: string,
    jsonValue: any
  ): ReadonlyArray<StratumFromTraits<T>> {
    // TODO: support removals

    if (!Array.isArray(jsonValue)) {
      throw new TerriaError({
        title: "Invalid property",
        message: `Property ${
          this.id
        } is expected to be an array but instead it is of type ${typeof jsonValue}.`
      });
    }

    return jsonValue.map(jsonElement => {
      const ResultType = this.type;
      const result: any = new ResultType();

      Object.keys(jsonElement).forEach(propertyName => {
        const trait = ResultType.traits[propertyName];
        if (trait === undefined) {
          throw new TerriaError({
            title: "Unknown property",
            message: `${propertyName} is not a valid sub-property of elements of ${
              this.id
            }.`
          });
        }

        const subJsonValue = jsonElement[propertyName];
        if (subJsonValue === undefined) {
          result[propertyName] = subJsonValue;
        } else {
          result[propertyName] = trait.fromJson(
            model,
            stratumName,
            subJsonValue
          );
        }
      });

      return result;
    });
  }

  toJson(value: readonly StratumFromTraits<T>[] | undefined): any {
    if (value === undefined) {
      return undefined;
    }

    return value.map(element => saveStratumToJson(this.type.traits, element));
  }

  isSameType(trait: Trait): boolean {
    return (
      trait instanceof ObjectArrayTrait &&
      trait.type === this.type &&
      trait.idProperty === this.idProperty
    );
  }
}
