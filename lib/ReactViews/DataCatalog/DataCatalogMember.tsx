import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import GroupMixin from "../../ModelMixins/GroupMixin";
import ReferenceMixin from "../../ModelMixins/ReferenceMixin";
import DataCatalogGroup from "./DataCatalogGroup";
import DataCatalogItem from "./DataCatalogItem";
import DataCatalogReference from "./DataCatalogReference";

/**
 * Component that is either a {@link CatalogItem} or a {@link DataCatalogMember} and encapsulated this choosing logic.
 */
@observer
class DataCatalogMember extends React.Component {
  static propTypes = {
    member: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    manageIsOpenLocally: PropTypes.bool,
    onActionButtonClicked: PropTypes.func,
    removable: PropTypes.bool,
    terria: PropTypes.object,
    isTopLevel: PropTypes.bool
  };

  render() {
    const member =
      // @ts-expect-error TS(2339): Property 'member' does not exist on type 'Readonly... Remove this comment to see the full error message
      ReferenceMixin.isMixedInto(this.props.member) &&
      // @ts-expect-error TS(2339): Property 'member' does not exist on type 'Readonly... Remove this comment to see the full error message
      this.props.member.nestedTarget !== undefined
        ? // @ts-expect-error TS(2339): Property 'member' does not exist on type 'Readonly... Remove this comment to see the full error message
          this.props.member.nestedTarget
        : // @ts-expect-error TS(2339): Property 'member' does not exist on type 'Readonly... Remove this comment to see the full error message
          this.props.member;

    if (ReferenceMixin.isMixedInto(member)) {
      return (
        <DataCatalogReference
          // @ts-expect-error TS(2322): Type 'Instance' is not assignable to type 'Referen... Remove this comment to see the full error message
          reference={member}
          // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
          viewState={this.props.viewState}
          // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
          terria={this.props.terria}
          // @ts-expect-error TS(2339): Property 'onActionButtonClicked' does not exist on... Remove this comment to see the full error message
          onActionButtonClicked={this.props.onActionButtonClicked}
          // @ts-expect-error TS(2339): Property 'isTopLevel' does not exist on type 'Read... Remove this comment to see the full error message
          isTopLevel={this.props.isTopLevel}
        />
      );
    } else if (GroupMixin.isMixedInto(member)) {
      return (
        <DataCatalogGroup
          group={member}
          // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
          viewState={this.props.viewState}
          // @ts-expect-error TS(2339): Property 'manageIsOpenLocally' does not exist on t... Remove this comment to see the full error message
          manageIsOpenLocally={this.props.manageIsOpenLocally}
          // @ts-expect-error TS(2339): Property 'onActionButtonClicked' does not exist on... Remove this comment to see the full error message
          onActionButtonClicked={this.props.onActionButtonClicked}
          // @ts-expect-error TS(2339): Property 'removable' does not exist on type 'Reado... Remove this comment to see the full error message
          removable={this.props.removable}
          // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
          terria={this.props.terria}
          // @ts-expect-error TS(2339): Property 'isTopLevel' does not exist on type 'Read... Remove this comment to see the full error message
          isTopLevel={this.props.isTopLevel}
        />
      );
    } else {
      return (
        <DataCatalogItem
          item={member}
          // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
          viewState={this.props.viewState}
          // @ts-expect-error TS(2339): Property 'onActionButtonClicked' does not exist on... Remove this comment to see the full error message
          onActionButtonClicked={this.props.onActionButtonClicked}
          // @ts-expect-error TS(2339): Property 'removable' does not exist on type 'Reado... Remove this comment to see the full error message
          removable={this.props.removable}
          // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
          terria={this.props.terria}
        />
      );
    }
  }
}

export default DataCatalogMember;
