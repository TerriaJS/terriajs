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
  workbenchItems: any,
  groupItems: any,
  terria: { getModelById: (arg0: typeof BaseModel, arg1: any) => any }
) {
  // Check if all the mappable items from our group are already loaded in the workbench
  let checker = (workbenchArr: string | any[], target: any[]) =>
    target.every(
      (member: any) =>
        !MappableMixin.isMixedInto(terria.getModelById(BaseModel, member)) ||
        workbenchArr.includes(member)
    );
  return checker(workbenchItems, groupItems);
}

export function addRemoveButtonClicked(
  previewedGroup: any,
  viewState: ViewState,
  terria: Terria
) {
  runInAction(() => {
    // Force items to be loaded or removed depending on state of entire group.
    // TODO: What happens if we try to load an item in the workbench twice?
    const forceState = !allMappableMembersInWorkbench(
      terria.workbench.itemIds,
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

// TODO: Combine this function into addRemoveButtonClicked or remove unnecessary complexity
const addOrRemoveMember = async (
  memberModel: BaseModel,
  viewState: ViewState,
  forceState: boolean
) => {
  // if (memberModel.isMappable) {
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
