export type ModelId = string;

export interface RemovedModelId {
  removed: ModelId;
}

/**
 * Represents either a reference to a particular model ID or the _lack_ of a reference
 * to a model ID. A removed model ID only makes sense in the context of merging strata.
 */
type ModelReference = ModelId | RemovedModelId;

namespace ModelReference {
  export function isRemoved(
    reference: ModelReference
  ): reference is RemovedModelId {
    return reference
      ? (<RemovedModelId>reference).removed !== undefined
      : false;
  }
}

export default ModelReference;
