import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import addedByUser from "../../Core/addedByUser";
import CatalogGroup from "./CatalogGroup";
import CatalogItem from "./CatalogItem";

const DataCatalogReference = observer(
  createReactClass({
    displayName: "DataCatalogReference",

    propTypes: {
      reference: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      onActionButtonClicked: PropTypes.func,
      terria: PropTypes.object,
      ancestors: PropTypes.array
    },

    setPreviewedItem() {
      // raiseErrorOnRejectedPromise(this.props.item.terria, this.props.item.load());
      if (this.props.reference.loadReference) {
        this.props.reference.loadReference();
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
              onClick={this.onClick}
            />
          </When>
          <When condition={hints.isFunction}>Function!</When>
          <Otherwise>
            <CatalogItem
              onTextClick={this.setPreviewedItem}
              selected={this.isSelected()}
              text={hints.name || "..."}
              title={this.props.ancestors
                .map(m => m.nameInCatalog)
                .join(" -> ")}
              btnState="add"
              onBtnClick={this.onClick}
            />
          </Otherwise>
        </Choose>
      );
    }
  })
);

module.exports = DataCatalogReference;
