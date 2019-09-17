import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import defined from "terriajs-cesium/Source/Core/defined";
import addedByUser from "../../Core/addedByUser";
import removeUserAddedData from "../../Models/removeUserAddedData";
import CatalogItem from "./CatalogItem";
import { runInAction } from "mobx";

const STATE_TO_TITLE = {
  loading: "Loading...",
  remove: "Remove from map",
  add: 'Add this item. Hold down "shift" to keep the data catalogue open.',
  trash: "Remove from catalogue"
};

// Individual dataset
const DataCatalogItem = observer(
  createReactClass({
    displayName: "DataCatalogItem",

    propTypes: {
      item: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      overrideState: PropTypes.string,
      onActionButtonClicked: PropTypes.func,
      removable: PropTypes.bool,
      terria: PropTypes.object,
      ancestors: PropTypes.array
    },

    onBtnClicked(event) {
      if (this.props.onActionButtonClicked) {
        this.props.onActionButtonClicked(this.props.item);
        return;
      }

      if (defined(this.props.viewState.storyShown)) {
        this.props.viewState.storyShown = false;
      }

      if (
        defined(this.props.item.invoke) ||
        this.props.viewState.useSmallScreenInterface
      ) {
        this.setPreviewedItem();
      } else if (this.props.removable) {
        removeUserAddedData(this.props.terria, this.props.item);
      } else {
        this.toggleEnable(event);
      }
    },

    toggleEnable(event) {
      const catalogItem = this.props.item;
      if (catalogItem.loadReference) {
        // TODO: handle promise rejection
        catalogItem.loadReference();
      }
      const workbench = catalogItem.terria.workbench;
      if (workbench.contains(catalogItem)) {
        workbench.remove(catalogItem);
      } else {
        if (catalogItem.loadMapItems) {
          // TODO: handle promise rejection.
          catalogItem.loadMapItems();
        }

        workbench.add(catalogItem);
      }

      // set preview as well
      this.setPreviewedItem();

      if (
        workbench.contains(catalogItem) &&
        !event.shiftKey &&
        !event.ctrlKey
      ) {
        runInAction(() => {
          this.props.viewState.explorerPanelIsVisible = false;
          this.props.viewState.mobileView = null;
        });
      }
    },

    setPreviewedItem() {
      // raiseErrorOnRejectedPromise(this.props.item.terria, this.props.item.load());
      if (this.props.item.loadMetadata) {
        this.props.item.loadMetadata();
      }
      if (this.props.item.loadReference) {
        this.props.item.loadReference();
      }
      this.props.viewState.viewCatalogMember(
        this.props.item,
        this.props.ancestors
      );
      // mobile switch to nowvewing
      this.props.viewState.switchMobileView(
        this.props.viewState.mobileViewOptions.preview
      );
    },

    isSelected() {
      return addedByUser(this.props.item)
        ? this.props.viewState.userDataPreviewedItem === this.props.item
        : this.props.viewState.previewedItem === this.props.item;
    },

    render() {
      const item = this.props.item;
      return (
        <CatalogItem
          onTextClick={this.setPreviewedItem}
          selected={this.isSelected()}
          text={item.nameInCatalog}
          title={this.props.ancestors.map(m => m.nameInCatalog).join(" -> ")}
          btnState={this.getState()}
          onBtnClick={this.onBtnClicked}
          titleOverrides={STATE_TO_TITLE}
        />
      );
    },

    getState() {
      if (this.props.overrideState) {
        return this.props.overrideState;
      } else if (this.props.item.isLoading) {
        return "loading";
      } else if (this.props.viewState.useSmallScreenInterface) {
        return "preview";
      } else if (this.props.removable) {
        return "trash";
      } else if (addedByUser(this.props.item)) {
        return null;
      } else if (this.props.item.terria.workbench.contains(this.props.item)) {
        return "remove";
      } else if (!defined(this.props.item.invoke)) {
        return "add";
      } else {
        return "stats";
      }
    }
  })
);

module.exports = DataCatalogItem;
