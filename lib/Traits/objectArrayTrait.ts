import TerriaError from "../Core/TerriaError";
import StratumFromTraits from "../Models/StratumFromTraits";
import { BaseModel } from "../Models/Model";
import ModelTraits from "./ModelTraits";
import Trait, { TraitOptions } from "./Trait";
import FlattenedFromTraits from "../Models/FlattenedFromTraits";
import createStratumInstance from "../Models/createStratumInstance";
import TraitsConstructor from "./TraitsConstructor";
import { computed } from "mobx";
import addModelStrataView from "../Models/addModelStrataView";
import ModelPropertiesFromTraits from "../Models/ModelPropertiesFromTraits";

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

  constructor(id: string, options: ObjectArrayTraitOptions<T>) {
    super(id, options);
    this.type = options.type;
    this.idProperty = options.idProperty;
  }

  getValue(
    strataTopToBottom: StratumFromTraits<ModelTraits>[]
  ): ReadonlyArray<ModelPropertiesFromTraits<T>> | undefined {
    const objectArrayStrata = strataTopToBottom
      .map((stratum: any) => stratum[this.id])
      .filter(stratumValue => stratumValue !== undefined);
    if (objectArrayStrata.length === 0) {
      return undefined;
    }

    const result: StratumFromTraits<T>[][] = [];
    const idMap: { [id: string]: StratumFromTraits<T>[] } = {};
    const removedIds: { [id: string]: boolean } = {};

    // Find the unique objects and the strata that go into each.
    for (let i = 0; i < objectArrayStrata.length; ++i) {
      const objectArray = objectArrayStrata[i];

      if (objectArray) {
        objectArray.forEach(
          (o: StratumFromTraits<T> & { index?: number }, i: number) => {
            const id =
              this.idProperty === "index"
                ? o.index === undefined
                  ? i.toString()
                  : o.index.toString()
                : <string><unknown>o[this.idProperty];
            if (this.type.isRemoval !== undefined && this.type.isRemoval(o)) {
              // This ID is removed in this stratum.
              removedIds[id] = true;
            } else if (removedIds[id]) {
              // This ID was removed by a stratum above this one, so ignore it.
              return;
            } else if (!idMap[id]) {
              // This is the first time we've seen this ID, so add it
              const newObjectStrata = [o];
              idMap[id] = newObjectStrata;
              result.push(newObjectStrata);
            } else {
              idMap[id].push(o);
            }
          }
        );
      }
    }

    // Flatten each unique object.
    return result.map(strata => {
      const model = {
        strataTopToBottom: strata
      };
      addModelStrataView(model, this.type);
      return <ModelPropertiesFromTraits<T>>(<unknown>model);
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

  isSameType(trait: Trait): boolean {
    return (
      trait instanceof ObjectArrayTrait &&
      trait.type === this.type &&
      trait.idProperty === this.idProperty
    );
  }
}
