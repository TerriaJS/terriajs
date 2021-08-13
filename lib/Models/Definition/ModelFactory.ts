import { BaseModel, ModelConstructor } from "./Model";
import Terria from "../Terria";

// TODO: ideally this would be Promise-based so that we can defer loading Model classes until they're needed.

export default class ModelFactory {
  private _constructors = new Map<string, ModelConstructor<BaseModel>>();

  get constructorsArray() {
    return Array.from(this._constructors);
  }

  register(type: string, constructor: ModelConstructor<BaseModel>) {
    this._constructors.set(type, constructor);
  }

  create(
    type: string,
    uniqueId: string | undefined,
    terria: Terria,
    sourceReference?: BaseModel
  ): BaseModel | undefined {
    const Constructor = this._constructors.get(type);
    if (Constructor === undefined) {
      return undefined;
    }
    return new Constructor(uniqueId, terria, sourceReference);
  }

  find(type: string): ModelConstructor<BaseModel> | undefined {
    return this._constructors.get(type);
  }
}
