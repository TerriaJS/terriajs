import { runInAction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import defined from "terriajs-cesium/Source/Core/defined";
import addedByUser from "../../Core/addedByUser";
import { DataSourceAction } from "../../Core/AnalyticEvents/analyticEvents";
import getPath from "../../Core/getPath";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import ReferenceMixin from "../../ModelMixins/ReferenceMixin";
import CommonStrata from "../../Models/Definition/CommonStrata";
import Model from "../../Models/Definition/Model";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import CatalogMemberReferenceTraits from "../../Traits/TraitsClasses/CatalogMemberReferenceTraits";
import CatalogGroup from "./CatalogGroup";
import CatalogItem, { ButtonState } from "./CatalogItem";
import toggleItemOnMapFromCatalog, {
  Op as ToggleOnMapOp
} from "./toggleItemOnMapFromCatalog";

interface Props {
  reference: ReferenceMixin.Instance &
    CatalogMemberMixin.Instance &
    Model<CatalogMemberReferenceTraits>;
  viewState: ViewState;
  terria: Terria;
  onActionButtonClicked?: (item: Props["reference"]) => void;
  isTopLevel: boolean;
}

export default observer(function DataCatalogReference({
  reference,
  viewState,
  terria,
  onActionButtonClicked,
  isTopLevel
}: Props) {
  const setPreviewedItem = () =>
    viewState.viewCatalogMember(reference, true, CommonStrata.user);

  const add = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const keepCatalogOpen = event.shiftKey || event.ctrlKey;

    if (onActionButtonClicked) {
      onActionButtonClicked(reference);
      return;
    }

    if (defined(viewState.storyShown)) {
      runInAction(() => {
        viewState.storyShown = false;
      });
    }

    if (
      defined((reference as any).invoke) ||
      viewState.useSmallScreenInterface
    ) {
      await setPreviewedItem();
    } else {
      await toggleItemOnMapFromCatalog(viewState, reference, keepCatalogOpen, {
        [ToggleOnMapOp.Add]: DataSourceAction.addFromCatalogue,
        [ToggleOnMapOp.Remove]: DataSourceAction.removeFromCatalogue
      });
    }
  };

  const isSelected = addedByUser(reference)
    ? viewState.userDataPreviewedItem === reference
    : viewState.previewedItem === reference;

  const path = getPath(reference, " -> ");

  return (
    <>
      {reference.isGroup ? (
        <CatalogGroup
          text={reference.name || "..."}
          isPrivate={reference.isPrivate}
          title={path}
          onClick={setPreviewedItem}
          topLevel={isTopLevel}
          loading={reference.isLoadingReference}
          open={reference.isLoadingReference}
        />
      ) : null}
      <CatalogItem
        onTextClick={setPreviewedItem}
        selected={isSelected}
        text={reference.name || "..."}
        isPrivate={reference.isPrivate}
        title={path}
        btnState={
          reference.isLoadingReference
            ? ButtonState.Loading
            : reference.isFunction
            ? ButtonState.Stats
            : ButtonState.Add
        }
        onBtnClick={reference.isFunction ? setPreviewedItem : add}
      />
    </>
  );
});
