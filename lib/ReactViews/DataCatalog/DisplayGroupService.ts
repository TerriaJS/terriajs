import { runInAction } from "mobx";
import { DataSourceAction } from "../../Core/AnalyticEvents/analyticEvents";
import MappableMixin from "../../ModelMixins/MappableMixin";
import { BaseModel } from "../../Models/Definition/Model";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import toggleItemOnMapFromCatalog, {
  Op as ToggleOnMapOp
} from "./toggleItemOnMapFromCatalog";

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

export function addRemoveButtonClicked(
  previewedGroup: any,
  viewState: ViewState,
  terria: Terria
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
        addOrRemoveMember(memberModel, viewState, forceState);
      }
    });
  });
}

const addOrRemoveMember = async (
  memberModel: BaseModel,
  viewState: ViewState,
  forceState: boolean
) => {
  if (MappableMixin.isMixedInto(memberModel)) {
    await toggleItemOnMapFromCatalog(
      viewState,
      memberModel,
      false,
      {
        [ToggleOnMapOp.Add]: DataSourceAction.addDisplayGroupFromAddAllButton,
        [ToggleOnMapOp.Remove]:
          DataSourceAction.removeDisplayGroupFromRemoveAllButton
      },
      forceState
    );
  }
};
