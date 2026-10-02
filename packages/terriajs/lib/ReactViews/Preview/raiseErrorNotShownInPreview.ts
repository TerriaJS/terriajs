import Result from "../../Core/Result";
import GroupMixin from "../../ModelMixins/GroupMixin";
import MappableMixin from "../../ModelMixins/MappableMixin";
import ReferenceMixin from "../../ModelMixins/ReferenceMixin";
import { BaseModel } from "../../Models/Definition/Model";
import ViewState from "../../ReactViewModels/ViewState";

// Keep in sync with the load errors DataPreview, MappablePreview and GroupPreview show.
export function previewShowsLoadErrors(item: BaseModel): boolean {
  if (ReferenceMixin.isMixedInto(item)) {
    return (
      item.nestedTarget === undefined ||
      previewShowsLoadErrors(item.nestedTarget)
    );
  }
  return MappableMixin.isMixedInto(item) || GroupMixin.isMixedInto(item);
}

export default function raiseErrorNotShownInPreview(
  viewState: ViewState,
  item: BaseModel,
  result: Result<unknown>
): void {
  if (result.error && !previewShowsLoadErrors(item)) {
    result.raiseError(viewState.terria);
  }
}
