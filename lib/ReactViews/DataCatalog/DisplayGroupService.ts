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
  groupItems: string[],
  terria: Terria
) {
  // Check if all the mappable items from our group are already loaded in the workbench
  const checkAllMappablesInWorkbench = (
    workbenchArr: readonly string[],
    groupItemsArray: string[]
  ) =>
    groupItemsArray.every(
      (member: any) =>
        !MappableMixin.isMixedInto(terria.getModelById(BaseModel, member)) ||
        workbenchArr.includes(member)
    );
  return checkAllMappablesInWorkbench(terria.workbench.itemIds, groupItems);
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
    // Force items to be loaded or removed depending on state of entire group.
    const forceState = !allMappableMembersInWorkbench(
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
        addOrRemoveMember(memberModel, viewState, forceState, keepCatalogOpen);
      }
    });
  });
}

const addOrRemoveMember = async (
  memberModel: BaseModel,
  viewState: ViewState,
  forceState: boolean,
  keepCatalogOpen: boolean
) => {
  if (MappableMixin.isMixedInto(memberModel)) {
    await toggleItemOnMapFromCatalog(
      viewState,
      memberModel,
      keepCatalogOpen,
      {
        [ToggleOnMapOp.Add]: DataSourceAction.addDisplayGroupFromAddAllButton,
        [ToggleOnMapOp.Remove]:
          DataSourceAction.removeDisplayGroupFromRemoveAllButton
      },
      forceState
    );
  }
};
