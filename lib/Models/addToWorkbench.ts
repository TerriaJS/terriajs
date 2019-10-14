import filterOutUndefined from "../Core/filterOutUndefined";
import GroupMixin from "../ModelMixins/GroupMixin";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";
import Chartable from "./Chartable";
import Mappable from "./Mappable";
import { BaseModel } from "./Model";
import Workbench from "./Workbench";

/**
 * Adds or removes a model to/from the workbench. If the model is a reference,
 * it will also be dereferenced. If, after dereferencing, the item turns out not to
 * be {@link Mappable} or {@link Chartable} but it is a {@link GroupMixin}, it will
 * be removed from the workbench. If it is mappable, `loadMapItems` will be called.
 * If it is chartable, `loadChartItems` will be called.
 *
 * @param terria The Terria instance.
 * @param item The item to add to or remove from the workbench.
 * @param add True to add the item to the workbench, false to remove it.
 */
export default function addToWorkbench(
  workbench: Workbench,
  item: BaseModel,
  add: boolean = true
): Promise<void> {
  workbench.add(item);

  if (ReferenceMixin.is(item)) {
    return item.loadReference().then(() => {
      const target = item.target;
      if (
        target &&
        GroupMixin.isMixedInto(target) &&
        !Mappable.is(target) &&
        !Chartable.is(target)
      ) {
        workbench.remove(item);
      } else if (target) {
        return addToWorkbench(workbench, target, add);
      }
    });
  }

  const mappablePromise = Mappable.is(item) ? item.loadMapItems() : undefined;
  const chartablePromise = Chartable.is(item)
    ? item.loadChartItems()
    : undefined;
  return Promise.all(
    filterOutUndefined([mappablePromise, chartablePromise])
  ).then(() => {});
}
