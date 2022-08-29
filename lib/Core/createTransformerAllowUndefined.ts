import { createTransformer, ITransformer } from "mobx-utils";

const undefinedObjectSymbol = Symbol("isUndefinedObject");

class UndefinedObject {
  readonly [undefinedObjectSymbol]: true = true;
}

function isUndefinedObject(x: any): x is UndefinedObject {
  return typeof x === "object" && undefinedObjectSymbol in x;
}

const undefinedObject = new UndefinedObject();

/**
 * This function is identical to the MobX `createTransformer` function except that it allows `undefined` to be used as a transformed value.
 * @param transformer The transformer function.
 * @param onCleanup A function called when a memoized result is no longer needed.
 */
export default function createTransformerAllowUndefined<A, B>(
  transformer: ITransformer<A | undefined, B>,
  onCleanup?: (resultObject: B | undefined, sourceObject?: A) => void
): ITransformer<A | undefined, B> {
  function unwrap(object: A | UndefinedObject): B {
    return transformer(isUndefinedObject(object) ? undefined : object);
  }
  Object.defineProperty(unwrap, "name", {
    value: (transformer.name || "anonymous") + "-allowUndefined"
  });
  const unwrapOnCleanup =
    onCleanup == undefined
      ? undefined
      : function (
          resultObject: B | undefined,
          sourceObject?: A | UndefinedObject
        ): void {
          const unwrapped = isUndefinedObject(sourceObject)
            ? undefined
            : sourceObject;
          return onCleanup(resultObject, unwrapped);
        };
  const transformed: ITransformer<A | UndefinedObject, B> = createTransformer<
    A | UndefinedObject,
    B
  >(unwrap, unwrapOnCleanup);
  return function wrap(object: A | undefined): B {
    return transformed(object === undefined ? undefinedObject : object);
  };
}
