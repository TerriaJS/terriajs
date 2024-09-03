import { runInAction } from "mobx";
import TerriaError from "../Core/TerriaError";
import filterOutUndefined from "../Core/filterOutUndefined";
import GroupMixin from "../ModelMixins/GroupMixin";
import MappableMixin from "../ModelMixins/MappableMixin";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";
import { BaseModel } from "./Definition/Model";
import Terria from "./Terria";
import Workbench from "./Workbench";

interface LoadResult {
  loadedItems: MappableMixin.Instance[];
  loadErrors: TerriaError[];
}

/**
 * Override workbench with the given items after loading each of them.
 *
 * Initially, all valid items given by `itemIds` are added to the workbench, but
 * only items that were successfully loaded are retained once the promise resolves.

 * If an item is a Group or a Reference, it will be loaded recursively and then
 * replaced by the resolved members.
 *
 * @param terria The Terria instance
 * @param workbench Workbench instance
 * @param itemIds IDs of items to add to the workbench
 * @return Promise that resolves when all the given items have been loaded and added to the workbench, returning the errors encountered while loading the items.
 */
export async function loadWorkbenchItems(
  terria: Terria,
  workbench: Workbench,
  itemIds: string[]
): Promise<TerriaError[]> {
  const idErrors: TerriaError[] = [];
  // Set the new contents of the workbench.
  const items = filterOutUndefined(
    itemIds.map((modelId) => {
      if (typeof modelId !== "string") {
        idErrors.push(
          new TerriaError({
            sender: terria,
            title: "Invalid model ID in workbench",
            message: "A model ID in the workbench list is not a string."
          })
        );
      } else {
        return terria.getModelByIdOrShareKey(BaseModel, modelId);
      }
    })
  );

  // Optimistically add all items to the workbench.
  // Note that this could contain, not just Mappable items, but also Group and Reference items.
  // Further below, we update the workbench again to keep only the Mappable items.
  runInAction(() => {
    workbench.items = items;
  });

  // Load the items
  const results = await Promise.all(
    items.map((item) =>
      loadWorkbenchItem(item, 0).then((result) => ({
        ...result,
        sourceItem: item
      }))
    )
  );

  // Remove failed items from the workbench and accumulate load errors
  const loadErrors: TerriaError[] = [];
  runInAction(() => {
    const updatedWorkbenchItems: BaseModel[] = [];
    workbench.items.forEach((item) => {
      const result = results.find(
        (r) => r.sourceItem === item || r.sourceItem === item.sourceReference
      );
      if (result) {
        updatedWorkbenchItems.push(...result.loadedItems);
        loadErrors.push(...result.loadErrors);
      } else {
        updatedWorkbenchItems.push(item);
      }
    });
    workbench.items = updatedWorkbenchItems;
  });

  const allErrors = [...idErrors, ...loadErrors];
  return allErrors;
}

async function loadWorkbenchItem(
  item: BaseModel,
  depth: number
): Promise<{
  loadedItems: MappableMixin.Instance[];
  loadErrors: TerriaError[];
}> {
  // Avoid expanding Group items to more than 1 level of nesting.
  if (depth > 1) {
    return { loadedItems: [], loadErrors: [] };
  }

  // Load the item based on its type.
  // For share links, the item will most likely be a Mappable item - the simplest case.
  // Directly adding References and Groups to workbench is currently rare and
  // used when an external service like data.gov.au wants to preview a whole group.

  if (ReferenceMixin.isMixedInto(item)) {
    return loadReferenceItem(item, depth);
  } else if (GroupMixin.isMixedInto(item)) {
    // FIXME: Automatically loading all group members is pretty risky. What if the group has 100s of members?
    // Should we avoid loading Groups altogether or should we limit the number of members loaded from the group?
    return loadGroupMembers(item, depth);
  } else if (MappableMixin.isMixedInto(item)) {
    return loadMappableItem(item);
  } else {
    return {
      loadedItems: [],
      loadErrors: [
        TerriaError.from(
          "Can not load an un-mappable item to the map. Item Id: " +
            item.uniqueId
        )
      ]
    };
  }
}

async function loadMappableItem(
  item: MappableMixin.Instance
): Promise<LoadResult> {
  const result = await item.loadMapItems();
  return result.error
    ? { loadedItems: [], loadErrors: [result.error] }
    : { loadedItems: [item], loadErrors: [] };
}

async function loadGroupMembers(
  group: GroupMixin.Instance,
  depth: number
): Promise<LoadResult> {
  const loadedItems: MappableMixin.Instance[] = [];
  const loadErrors: TerriaError[] = [];
  // load group
  (await group.loadMembers()).pushErrorTo(loadErrors);

  // load group members
  const memberResults = await Promise.all(
    group.memberModels.map((member) => loadWorkbenchItem(member, depth + 1))
  );

  // accumulate group member results
  memberResults.forEach((result) => {
    loadErrors.push(...result.loadErrors);
    loadedItems.push(...result.loadedItems);
  });

  return {
    loadedItems,
    loadErrors
  };
}

async function loadReferenceItem(
  item: ReferenceMixin.Instance,
  depth: number
): Promise<LoadResult> {
  const referenceErrors: TerriaError[] = [];
  (await item.loadReference()).pushErrorTo(referenceErrors);
  if (item.target) {
    const { loadErrors, loadedItems } = await loadWorkbenchItem(
      item.target,
      depth
    );
    return {
      loadErrors: [...referenceErrors, ...loadErrors],
      loadedItems
    };
  } else {
    referenceErrors.push(
      TerriaError.from(
        "Reference model has no target. Model Id: " + item.uniqueId
      )
    );
  }
  return {
    loadErrors: referenceErrors,
    loadedItems: []
  };
}
