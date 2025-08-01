import { IReactionDisposer, onBecomeObserved, onBecomeUnobserved } from "mobx";

/**
 * Starts the given reaction when the property becomes observed and destroys it when
 * it becomes unobserved.
 *
 * @param obj Any object
 * @param prop An observable property belonging to object
 * @param startReaction The reaction to run when the `prop` is observed.
 */
export default function runWhenObserved<T extends object, P extends keyof T>(
  obj: T,
  prop: P,
  startReaction: () => IReactionDisposer
) {
  let reactionDisposer: IReactionDisposer | undefined;
  onBecomeObserved(obj, prop, () => {
    reactionDisposer = startReaction();
  });

  onBecomeUnobserved(obj, prop, () => {
    reactionDisposer?.();
    reactionDisposer = undefined;
  });
}
