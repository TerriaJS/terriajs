import { comparer, reaction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import addedByUser from "../../Core/addedByUser";
import getPath from "../../Core/getPath";
import removeUserAddedData from "../../Models/Catalog/removeUserAddedData";
import CatalogGroup from "./CatalogGroup";
import DataCatalogMember from "./DataCatalogMember";
import {
  addRemoveButtonClicked,
  allMappableMembersInWorkbench
} from "./DisplayGroupHelper";

@observer
class DataCatalogGroup extends React.Component {
  static propTypes = {
    group: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    /** Overrides whether to get the open state of the group from the group model or manage it internally */
    manageIsOpenLocally: PropTypes.bool,
    userData: PropTypes.bool,
    onActionButtonClicked: PropTypes.func,
    removable: PropTypes.bool,
    terria: PropTypes.object,
    t: PropTypes.func.isRequired,
    isTopLevel: PropTypes.bool
  };

  static defaultProps = {
    manageIsOpenLocally: false,
    userData: false
  };

  _cleanupLoadMembersReaction: any;

  constructor(props: any) {
    super(props);
    this.state = {
      /** Only used if manageIsOpenLocally === true */
      isOpen: false
    };
  }

  isOpen() {
    // @ts-expect-error TS(2339): Property 'manageIsOpenLocally' does not exist on t... Remove this comment to see the full error message
    if (this.props.manageIsOpenLocally) {
      // @ts-expect-error TS(2339): Property 'isOpen' does not exist on type 'Readonly... Remove this comment to see the full error message
      return this.state.isOpen;
    }
    // @ts-expect-error TS(2339): Property 'group' does not exist on type 'Readonly<... Remove this comment to see the full error message
    return this.props.group.isOpen;
  }

  async clickGroup() {
    // @ts-expect-error TS(2339): Property 'manageIsOpenLocally' does not exist on t... Remove this comment to see the full error message
    if (this.props.manageIsOpenLocally) {
      this.setState({
        // @ts-expect-error TS(2339): Property 'isOpen' does not exist on type 'Readonly... Remove this comment to see the full error message
        isOpen: !this.state.isOpen
      });
    }

    (
      await this.props.viewState.viewCatalogMember(
        // @ts-expect-error TS(2339): Property 'group' does not exist on type 'Readonly<... Remove this comment to see the full error message
        this.props.group,
        // @ts-expect-error TS(2339): Property 'group' does not exist on type 'Readonly<... Remove this comment to see the full error message
        !this.props.group.isOpen
      )
    )
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      .raiseError(this.props.viewState.terria);
  }

  isSelected() {
    // @ts-expect-error TS(2339): Property 'group' does not exist on type 'Readonly<... Remove this comment to see the full error message
    return addedByUser(this.props.group)
      ? // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        this.props.viewState.userDataPreviewedItem === this.props.group
      : // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        this.props.viewState.previewedItem === this.props.group;
  }

  getNameOrPrettyUrl() {
    // Grab a name via nameInCatalog, if it's a blank string, try and generate one from the url
    // @ts-expect-error TS(2339): Property 'group' does not exist on type 'Readonly<... Remove this comment to see the full error message
    const group = this.props.group;
    const nameInCatalog = group.nameInCatalog || "";
    if (nameInCatalog !== "") {
      return nameInCatalog;
    }

    const url = group.url || "";
    // strip protocol
    return url.replace(/^https?:\/\//, "");
  }

  componentDidMount() {
    this._cleanupLoadMembersReaction = reaction(
      // @ts-expect-error TS(2339): Property 'group' does not exist on type 'Readonly<... Remove this comment to see the full error message
      () => [this.props.group, this.isOpen()],
      ([group, isOpen]) => {
        if (isOpen) {
          group.loadMembers();
        }
      },
      { equals: comparer.shallow, fireImmediately: true }
    );
  }

  componentWillUnmount() {
    this._cleanupLoadMembersReaction();
  }

  render() {
    // @ts-expect-error TS(2339): Property 'group' does not exist on type 'Readonly<... Remove this comment to see the full error message
    const group = this.props.group;
    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t } = this.props;

    return (
      <CatalogGroup
        text={this.getNameOrPrettyUrl()}
        isPrivate={group.isPrivate}
        // @ts-expect-error TS(2339): Property 'group' does not exist on type 'Readonly<... Remove this comment to see the full error message
        title={getPath(this.props.group, " → ")}
        // @ts-expect-error TS(2339): Property 'isTopLevel' does not exist on type 'Read... Remove this comment to see the full error message
        topLevel={this.props.isTopLevel}
        open={this.isOpen()}
        loading={group.isLoading || group.isLoadingMembers}
        emptyMessage={t("dataCatalog.groupEmpty")}
        onClick={() => this.clickGroup()}
        // @ts-expect-error TS(2339): Property 'removable' does not exist on type 'Reado... Remove this comment to see the full error message
        removable={this.props.removable}
        removeUserAddedData={removeUserAddedData.bind(
          this,
          // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
          this.props.terria,
          // @ts-expect-error TS(2339): Property 'group' does not exist on type 'Readonly<... Remove this comment to see the full error message
          this.props.group
        )}
        selected={this.isSelected()}
        // Pass these next three props down to deal with displayGroup functionality
        displayGroup={group.displayGroup}
        addRemoveButtonFunction={(event) => {
          addRemoveButtonClicked(
            // @ts-expect-error TS(2339): Property 'group' does not exist on type 'Readonly<... Remove this comment to see the full error message
            this.props.group,
            // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
            this.props.viewState,
            // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
            this.props.terria,
            event.shiftKey || event.ctrlKey
          );
        }}
        allItemsLoaded={allMappableMembersInWorkbench(
          // @ts-expect-error TS(2339): Property 'group' does not exist on type 'Readonly<... Remove this comment to see the full error message
          this.props.group.members,
          // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
          this.props.terria
        )}
      >
        {this.isOpen()
          ? group.memberModels.map((item: any) => (
              <DataCatalogMember
                key={item.uniqueId}
                member={item}
                // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
                terria={this.props.terria}
                // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                viewState={this.props.viewState}
                // @ts-expect-error TS(2769): No overload matches this call.
                userData={this.props.userData}
                // @ts-expect-error TS(2339): Property 'manageIsOpenLocally' does not exist on t... Remove this comment to see the full error message
                overrideOpen={this.props.manageIsOpenLocally}
                // @ts-expect-error TS(2339): Property 'onActionButtonClicked' does not exist on... Remove this comment to see the full error message
                onActionButtonClicked={this.props.onActionButtonClicked}
              />
            ))
          : null}
      </CatalogGroup>
    );
  }
}

export default withTranslation()(DataCatalogGroup);
