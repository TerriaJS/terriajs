"use strict";

import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React, { FC } from "react";
import GroupMixin from "../../ModelMixins/GroupMixin";
import ReferenceMixin from "../../ModelMixins/ReferenceMixin";
import { DataCatalogGroup } from "./DataCatalogGroup";
import DataCatalogItem from "./DataCatalogItem";
import DataCatalogReference from "./DataCatalogReference";
import ViewState from "../../ReactViewModels/ViewState";
import Terria from "../../Models/Terria";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";

interface IDataCatalogMemberProps {
  viewState: ViewState;
  terria: Terria;
  member:
    | ReferenceMixin.Instance
    | GroupMixin.Instance
    | CatalogMemberMixin.Instance;

  manageIsOpenLocally: boolean;
  removable: boolean;
  isTopLevel: boolean;

  onActionButtonClicked?: (member: IDataCatalogMemberProps["member"]) => void;
}

/**
 * Component that is either a {@link CatalogItem} or a {@link DataCatalogMember} and encapsulated this choosing logic.
 */
export const DataCatalogMember: FC<IDataCatalogMemberProps> = observer(
  ({
    viewState,
    terria,
    member,
    manageIsOpenLocally,
    removable,
    isTopLevel,
    onActionButtonClicked
  }) => {
    if (ReferenceMixin.isMixedInto(member)) {
      const catalogMember: any =
        member.nestedTarget !== undefined ? member.nestedTarget : member;
      return (
        <DataCatalogReference
          reference={catalogMember}
          viewState={viewState}
          terria={terria}
          onActionButtonClicked={onActionButtonClicked}
          isTopLevel={isTopLevel}
        />
      );
    }
    if (GroupMixin.isMixedInto(member)) {
      return (
        <DataCatalogGroup
          group={member}
          viewState={viewState}
          manageIsOpenLocally={manageIsOpenLocally}
          onActionButtonClicked={onActionButtonClicked}
          removable={removable}
          terria={terria}
          isTopLevel={isTopLevel}
        />
      );
    }
    return (
      <DataCatalogItem
        item={member}
        viewState={viewState}
        onActionButtonClicked={onActionButtonClicked}
        removable={removable}
        terria={terria}
      />
    );
  }
);
