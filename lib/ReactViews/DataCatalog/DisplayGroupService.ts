import { runInAction } from "mobx";
import { DataSourceAction } from "../../Core/AnalyticEvents/analyticEvents";
import MappableMixin from "../../ModelMixins/MappableMixin";
import { BaseModel } from "../../Models/Definition/Model";
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
  previewedGroup: { loadMembers: () => Promise<any>; memberModels: any[] },
  viewState: ViewState
) {
  runInAction(() => {
    previewedGroup.loadMembers().then(() => {
      previewedGroup.memberModels.forEach(async (memberModel: BaseModel) => {
        // if (memberModel.isMappable) {
        if (MappableMixin.isMixedInto(memberModel)) {
          await toggleItemOnMapFromCatalog(viewState, memberModel, false, {
            [ToggleOnMapOp.Add]:
              DataSourceAction.addDisplayGroupFromAddAllButton,
            [ToggleOnMapOp.Remove]:
              DataSourceAction.removeDisplayGroupFromRemoveAllButton
          });
        }
      });
    });
  });
}
