//@ts-check

import React from "react";

import createReactClass from "create-react-class";

import PropTypes from "prop-types";

import Description from "./Description";
import DataPreviewMap from "./DataPreviewMap";
import Styles from "./mappable-preview.scss";
import Mappable from "../../Models/Mappable";
import { observer } from "mobx-react";

/**
 * CatalogItem preview that is mappable (as opposed to say, an analytics item that can't be displayed on a map without
 * configuration of other parameters.
 */
const MappablePreview = observer(
  createReactClass({
    displayName: "MappablePreview",

    propTypes: {
      previewed: PropTypes.object.isRequired,
      terria: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired
    },

    toggleOnMap(event) {
      const catalogItem = this.props.previewed;
      if (catalogItem.loadReference) {
        // TODO: handle promise rejection
        catalogItem.loadReference();
      }
      const workbench = this.props.terria.workbench;
      if (workbench.contains(catalogItem)) {
        // catalogItem.ancestors = undefined;
        workbench.remove(catalogItem);
      } else {
        // catalogItem.ancestors = this.props.ancestors;
        if (catalogItem.loadMapItems) {
          // TODO: handle promise rejection.
          catalogItem.loadMapItems();
        }

        workbench.add(catalogItem);
      }

      if (
        workbench.contains(catalogItem) &&
        !event.shiftKey &&
        !event.ctrlKey
      ) {
        this.props.viewState.explorerPanelIsVisible = false;
        this.props.viewState.mobileView = null;
      }
    },

    backToMap() {
      this.props.viewState.explorerPanelIsVisible = false;
    },

    render() {
      const catalogItem =
        this.props.previewed.nowViewingCatalogItem || this.props.previewed;
      return (
        <div className={Styles.root}>
          <If
            condition={Mappable.is(catalogItem) && !catalogItem.disablePreview}
          >
            <DataPreviewMap
              terria={this.props.terria}
              previewed={catalogItem}
              showMap={
                !this.props.viewState.explorerPanelAnimating ||
                this.props.viewState.useSmallScreenInterface
              }
            />
          </If>
          <button
            type="button"
            onClick={this.toggleOnMap}
            className={Styles.btnAdd}
          >
            {this.props.terria.workbench.contains(this.props.previewed)
              ? "Remove from the map"
              : "Add to the map"}
          </button>
          <div className={Styles.previewedInfo}>
            <h3 className={Styles.h3}>{catalogItem.name}</h3>
            <Description item={catalogItem} />
          </div>
        </div>
      );
    }
  })
);

export default MappablePreview;
