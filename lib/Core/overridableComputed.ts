import { computed, IComputedValue } from "mobx";

/**
 * Store for overridable computed getters
 */
const computedProps: WeakMap<
  any,
  WeakMap<Function, IComputedValue<any>>
> = new WeakMap();

export default function overridableComputed(
  classPrototype: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor | undefined {
  const { get: getter } = descriptor;
  if (!getter) {
    return;
  }
  return {
    get: function () {
      let thisComputedProps = computedProps.get(this);
      if (!thisComputedProps) {
        thisComputedProps = new WeakMap();
        computedProps.set(this, thisComputedProps);
      }

      let computedProp = thisComputedProps.get(getter);
      if (!computedProp) {
        computedProp = computed(() => getter?.apply(this));
        thisComputedProps.set(getter, computedProp);
      }

      const computedValue = computedProp.get();
      return computedValue;
    }
  };
}
