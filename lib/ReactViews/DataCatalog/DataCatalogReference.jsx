import createReactClass from "create-react-class";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import addedByUser from "../../Core/addedByUser";
import CatalogGroup from "./CatalogGroup";
import CatalogItem from "./CatalogItem";
import openGroup from "../../Models/openGroup";
import CommonStrata from "../../Models/CommonStrata";
import raiseErrorOnRejectedPromise from "../../Models/raiseErrorOnRejectedPromise";
import addToWorkbench from "../../Models/addToWorkbench";
import defined from "terriajs-cesium/Source/Core/defined";

const DataCatalogReference = observer(
  createReactClass({
    displayName: "DataCatalogReference",

    propTypes: {
      reference: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      onActionButtonClicked: PropTypes.func,
      terria: PropTypes.object,
      ancestors: PropTypes.array,
      isTopLevel: PropTypes.bool
    },

    setPreviewedItem() {
      // raiseErrorOnRejectedPromise(this.props.item.terria, this.props.item.load());
      if (this.props.reference.loadReference) {
        raiseErrorOnRejectedPromise(
          this.props.terria,
          this.props.reference.loadReference()
        );
      }
      this.props.viewState.viewCatalogMember(
        this.props.reference,
        this.props.ancestors
      );
      // mobile switch to nowvewing
      this.props.viewState.switchMobileView(
        this.props.viewState.mobileViewOptions.preview
      );
    },

    add() {
      if (this.props.onActionButtonClicked) {
        this.props.onActionButtonClicked(this.props.reference);
        return;
      }

      if (defined(this.props.viewState.storyShown)) {
        this.props.viewState.storyShown = false;
      }

      if (
        defined(this.props.reference.invoke) ||
        this.props.viewState.useSmallScreenInterface
      ) {
        this.setPreviewedItem();
      } else {
        const addPromise = addToWorkbench(
          this.props.terria.workbench,
          this.props.reference,
          true
        ).then(() => {
          if (
            this.props.terria.workbench.contains(this.props.reference) &&
            !event.shiftKey &&
            !event.ctrlKey
          ) {
            runInAction(() => {
              this.props.viewState.explorerPanelIsVisible = false;
              this.props.viewState.mobileView = null;
            });
          }
        });

        raiseErrorOnRejectedPromise(addPromise);
      }
    },

    open() {
      raiseErrorOnRejectedPromise(
        this.props.terria,
        openGroup(this.props.reference, true, CommonStrata.user)
      );
      this.setPreviewedItem();
    },

    isSelected() {
      return addedByUser(this.props.reference)
        ? this.props.viewState.userDataPreviewedItem === this.props.reference
        : this.props.viewState.previewedItem === this.props.reference;
    },

    render() {
      const reference = this.props.reference;
      const hints = reference.hints || {};

      return (
        <Choose>
          <When condition={hints.isGroup}>
            <CatalogGroup
              text={hints.name || "..."}
              title={this.props.ancestors
                .map(member => member.nameInCatalog)
                .join(" → ")}
              onClick={this.open}
              topLevel={this.props.isTopLevel}
              loading={this.props.reference.isLoadingReference}
              open={this.props.reference.isLoadingReference}
            />
          </When>
          <When condition={hints.isFunction}>
          <CatalogItem
              onTextClick={this.setPreviewedItem}
              selected={this.isSelected()}
              text={hints.name || "..."}
              title={this.props.ancestors
                .map(m => m.nameInCatalog)
                .join(" -> ")}
              btnState={
                this.props.reference.isLoadingReference ? "loading" : "stats"
              }
              onBtnClick={this.setPreviewedItem}
            />
          </When>
          <Otherwise>
            <CatalogItem
              onTextClick={this.setPreviewedItem}
              selected={this.isSelected()}
              text={hints.name || "..."}
              title={this.props.ancestors
                .map(m => m.nameInCatalog)
                .join(" -> ")}
              btnState={
                this.props.reference.isLoadingReference ? "loading" : "add"
              }
              onBtnClick={this.add}
            />
          </Otherwise>
        </Choose>
      );
    }
  })
);

module.exports = DataCatalogReference;
