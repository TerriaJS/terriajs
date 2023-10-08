import { runInAction } from "mobx";
import { DataSourceAction } from "../../Core/AnalyticEvents/analyticEvents";
import MappableMixin from "../../ModelMixins/MappableMixin";
import { BaseModel } from "../../Models/Definition/Model";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import toggleItemOnMapFromCatalog, {
  Op as ToggleOnMapOp
} from "./toggleItemOnMapFromCatalog";

/**
 * Summary. A collection of functions related to displayGroups. These functions called in multiple places e.g. `GroupPreview` and `DataCatalogGroup`.
 */

/**
 * A check to see if all members of a group are already loaded in the workbench. Only checks for mappable items.
 */
export function allMappableMembersInWorkbench(
  groupItemsArray: string[],
  terria: Terria
) {
  const workbenchItemsArray = terria.workbench.itemIds;
  // If groupItemsArray is empty, groupItemsArray.every(...) will always return true.
  if (groupItemsArray.length === 0) {
    return false;
  } else {
    return groupItemsArray.every(
      (member: any) =>
        !MappableMixin.isMixedInto(terria.getModelById(BaseModel, member)) ||
        workbenchItemsArray.includes(member)
    );
  }
}

/**
 * Function to handle adding or removing of group items.
 * Will first check to see if all remebers are currently loaded.
 * If they are, button will remove all.
 * If any items are missing from the workbench, it will add those that are missing, up to and including all items
 */
export function addRemoveButtonClicked(
  previewedGroup: any,
  viewState: ViewState,
  terria: Terria,
  keepCatalogOpen: boolean
) {
  runInAction(() => {
    const allItemsLoaded = allMappableMembersInWorkbench(
      previewedGroup.members,
      terria
    );
    previewedGroup.loadMembers().then(() => {
      for (
        let index = previewedGroup.memberModels.length - 1;
        index >= 0;
        index--
      ) {
        const memberModel = previewedGroup.memberModels[index];
        const itemLoaded = terria.workbench.contains(memberModel);

        if (allItemsLoaded) {
          // If all items are loaded, then we can just call the toggle function for all
          // they will all be removed
          addOrRemoveMember(memberModel, viewState, keepCatalogOpen);
        } else if (!allItemsLoaded && !itemLoaded) {
          // If we have a partially loaded group, and our current item of interest is not loaded,
          // then we toggle it, which will add it
          addOrRemoveMember(memberModel, viewState, keepCatalogOpen);
        }
        // All other cases we do nothing. There is only one other case not accounted for:
        // !allItemsLoaded && itemLoaded - thats fine, do nothing
      }
    });
  });
}

const addOrRemoveMember = async (
  memberModel: BaseModel,
  viewState: ViewState,
  keepCatalogOpen: boolean
) => {
  if (MappableMixin.isMixedInto(memberModel)) {
    await toggleItemOnMapFromCatalog(viewState, memberModel, keepCatalogOpen, {
      [ToggleOnMapOp.Add]: DataSourceAction.addDisplayGroupFromAddAllButton,
      [ToggleOnMapOp.Remove]:
        DataSourceAction.removeDisplayGroupFromRemoveAllButton
    });
  }
};
