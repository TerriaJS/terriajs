import React from "react";

import createReactClass from "create-react-class";

import PropTypes from "prop-types";

import Description from "./Description";
import ObserveModelMixin from "../ObserveModelMixin";
import Styles from "./mappable-preview.scss";

/**
 * CatalogItem preview that is mappable (as opposed to say, an analytics item that can't be displayed on a map without
 * configuration of other parameters.
 */
const MappablePreview = createReactClass({
  displayName: "MappablePreview",
  mixins: [ObserveModelMixin],

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
      workbench.add(catalogItem);
    }

    if (workbench.contains(catalogItem) && !event.shiftKey && !event.ctrlKey) {
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
        <If condition={catalogItem.isMappable && !catalogItem.disablePreview}>
          {/* <DataPreviewMap terria={this.props.terria}
                                    previewedCatalogItem={catalogItem}
                                    showMap={!this.props.viewState.explorerPanelAnimating || this.props.viewState.useSmallScreenInterface} /> */}
        </If>
        <button
          type="button"
          onClick={this.toggleOnMap}
          className={Styles.btnAdd}
        >
          {this.props.previewed.terria.workbench.contains(this.props.previewed)
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
});

export default MappablePreview;
