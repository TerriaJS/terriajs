import { BaseModel, ModelConstructor } from "./Model";
import Terria from "../Terria";

// TODO: ideally this would be Promise-based so that we can defer loading Model classes until they're needed.

export interface ModelRegistrationOptions {
  /**
   * Saved JSON for models of this type is marked `isOptionalModel`, so a map
   * that doesn't know the type skips it instead of making a stub item and
   * reporting an error.
   */
  optional?: boolean;
}

interface ModelRegistration {
  constructor: ModelConstructor<BaseModel>;
  options: ModelRegistrationOptions;
}

export default class ModelFactory {
  private _registrations = new Map<string, ModelRegistration>();

  get constructorsArray(): [string, ModelConstructor<BaseModel>][] {
    return Array.from(this._registrations, ([type, { constructor }]) => [
      type,
      constructor
    ]);
  }

  register(
    type: string,
    constructor: ModelConstructor<BaseModel>,
    options: ModelRegistrationOptions = {}
  ) {
    this._registrations.set(type, { constructor, options });
  }

  create(
    type: string | undefined,
    uniqueId: string | undefined,
    terria: Terria,
    sourceReference?: BaseModel
  ): BaseModel | undefined {
    if (!type) return undefined;
    const Constructor = this.find(type);
    if (Constructor === undefined) {
      return undefined;
    }
    return new Constructor(uniqueId, terria, sourceReference);
  }

  find(type: string): ModelConstructor<BaseModel> | undefined {
    return this._registrations.get(type)?.constructor;
  }

  isOptional(type: string): boolean {
    return this._registrations.get(type)?.options.optional === true;
  }
}
