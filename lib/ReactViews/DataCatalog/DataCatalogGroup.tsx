import React, { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { comparer, reaction } from "mobx";
import { observer } from "mobx-react";

import addedByUser from "../../Core/addedByUser";
import getPath from "../../Core/getPath";

import { getName } from "../../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../../ModelMixins/GroupMixin";

import removeUserAddedData from "../../Models/Catalog/removeUserAddedData";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";

import CatalogGroup from "./CatalogGroup";
import { DataCatalogMember } from "./DataCatalogMember";
import AccessControlMixin from "../../ModelMixins/AccessControlMixin";

interface IDataCatalogGroupProps {
  viewState: ViewState;
  terria: Terria;

  group: GroupMixin.Instance;

  isTopLevel: boolean;
  manageIsOpenLocally: boolean;
  removable: boolean;
  onActionButtonClicked?: (member: IDataCatalogGroupProps["group"]) => void;
}

export const DataCatalogGroup: FC<IDataCatalogGroupProps> = observer(
  ({
    viewState,
    terria,
    group,
    isTopLevel,
    manageIsOpenLocally = false,
    removable,
    onActionButtonClicked
  }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const isGroupOpen = manageIsOpenLocally ? isOpen : group.isOpen;

    const isSelected = addedByUser(group)
      ? viewState.userDataPreviewedItem === group
      : viewState.previewedItem === group;

    useEffect(() => {
      const cleanupLoadMembersReaction = reaction(
        (): [GroupMixin.Instance, boolean] => [group, isGroupOpen],
        ([group, isOpen]) => {
          if (isOpen) {
            group.loadMembers();
          }
        },
        { equals: comparer.shallow, fireImmediately: true }
      );
      return () => {
        cleanupLoadMembersReaction();
      };
    });

    const onTrashClicked = () => removeUserAddedData(viewState.terria, group);

    const clickGroup = async () => {
      if (manageIsOpenLocally) {
        setIsOpen((isOpen) => !isOpen);
      }
      (await viewState.viewCatalogMember(group, !group.isOpen)).raiseError(
        terria
      );
    };

    return (
      <CatalogGroup
        text={getName(group)}
        isPrivate={
          AccessControlMixin.isMixedInto(group) ? group.isPrivate : false
        }
        title={getPath(group, " → ")}
        topLevel={isTopLevel}
        open={isGroupOpen}
        loading={(group as any).isLoading || group.isLoadingMembers}
        emptyMessage={t("dataCatalog.groupEmpty")}
        onClick={clickGroup}
        trashable={removable}
        onTrashClick={onTrashClicked}
        selected={isSelected}
      >
        {isGroupOpen &&
          group.memberModels.map((item) => (
            <DataCatalogMember
              key={item.uniqueId}
              member={item as any}
              terria={terria}
              viewState={viewState}
              manageIsOpenLocally={manageIsOpenLocally}
              onActionButtonClicked={onActionButtonClicked as any}
              removable={removable}
              isTopLevel={false}
            />
          ))}
      </CatalogGroup>
    );
  }
);
