import createReactClass from "create-react-class";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import defined from "terriajs-cesium/Source/Core/defined";
import addedByUser from "../../Core/addedByUser";
import addToWorkbench from "../../Models/addToWorkbench";
import raiseErrorOnRejectedPromise from "../../Models/raiseErrorOnRejectedPromise";
import removeUserAddedData from "../../Models/removeUserAddedData";
import CatalogItem from "./CatalogItem";
import { withTranslation } from "react-i18next";

// Individual dataset
export const DataCatalogItem = observer(
  createReactClass({
    displayName: "DataCatalogItem",

    propTypes: {
      item: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      overrideState: PropTypes.string,
      onActionButtonClicked: PropTypes.func,
      removable: PropTypes.bool,
      terria: PropTypes.object,
      t: PropTypes.func.isRequired,
      ancestors: PropTypes.array
    },

    onBtnClicked(event) {
      runInAction(() => {
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
      });
    },

    onTrashClicked() {
      removeUserAddedData(this.props.terria, this.props.item);
    },

    toggleEnable(event) {
      runInAction(() => {
        const keepCatalogOpen = event.shiftKey || event.ctrlKey;
        const toAdd = !this.props.terria.workbench.contains(this.props.item);

        if (toAdd) {
          this.props.terria.timelineStack.addToTop(this.props.item);
        } else {
          this.props.terria.timelineStack.remove(this.props.item);
        }

        const addPromise = addToWorkbench(
          this.props.terria.workbench,
          this.props.item,
          toAdd
        ).then(() => {
          if (
            this.props.terria.workbench.contains(this.props.item) &&
            !keepCatalogOpen
          ) {
            runInAction(() => {
              this.props.viewState.explorerPanelIsVisible = false;
              this.props.viewState.mobileView = null;
            });
          }
        });

        raiseErrorOnRejectedPromise(addPromise);
      });
    },

    setPreviewedItem() {
      // raiseErrorOnRejectedPromise(this.props.item.terria, this.props.item.load());
      if (this.props.item.loadMetadata) {
        runInAction(() => {
          this.props.item.loadMetadata();
        });
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
      const { t } = this.props;
      const STATE_TO_TITLE = {
        loading: t("catalogItem.loading"),
        remove: t("catalogItem.removeFromMap"),
        add: t("catalogItem.add"),
        trash: t("catalogItem.trash")
      };
      return (
        <CatalogItem
          onTextClick={this.setPreviewedItem}
          selected={this.isSelected()}
          text={item.nameInCatalog}
          title={this.props.ancestors.map(m => m.nameInCatalog).join(" -> ")}
          btnState={this.getState()}
          onBtnClick={this.onBtnClicked}
          // All things are "removable" - meaning add and remove from workbench,
          //    but only user data is "trashable"
          trashable={this.props.removable}
          onTrashClick={
            this.props.removable
              ? () => {
                  this.onTrashClicked();
                }
              : undefined
          }
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

export default withTranslation()(DataCatalogItem);
