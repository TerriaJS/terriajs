import React from "react";

import createReactClass from "create-react-class";

import PropTypes from "prop-types";
import defined from "terriajs-cesium/Source/Core/defined";
import DataPreviewMap from "./DataPreviewMap";
import Description from "./Description";
import measureElement from "../measureElement";
import ObserveModelMixin from "../ObserveModelMixin";
import Styles from "./mappable-preview.scss";
import SharePanel from "../Map/Panels/SharePanel/SharePanel.jsx";
import { withTranslation } from "react-i18next";

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
    viewState: PropTypes.object.isRequired,
    widthFromMeasureElementHOC: PropTypes.number,
    t: PropTypes.func.isRequired
  },

  toggleOnMap(event) {
    this.props.previewed.toggleEnabled();
    this.props.terria.checkNowViewingForTimeWms();
    if (defined(this.props.viewState.storyShown)) {
      this.props.viewState.storyShown = false;
    }
    if (
      this.props.previewed.isEnabled === true &&
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
    const { t } = this.props;
    const catalogItem =
      this.props.previewed.nowViewingCatalogItem || this.props.previewed;
    return (
      <div className={Styles.root}>
        <If condition={catalogItem.isMappable && !catalogItem.disablePreview}>
          <DataPreviewMap
            terria={this.props.terria}
            previewedCatalogItem={catalogItem}
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
          {this.props.previewed.isEnabled
            ? t("preview.removeFromMap")
            : t("preview.addToMap")}
        </button>
        <div className={Styles.previewedInfo}>
          <div
            className={Styles.titleAndShareWrapper}
            ref={component => (this.refToMeasure = component)}
          >
            <h3 className={Styles.h3}>{catalogItem.name}</h3>
            <If
              condition={
                catalogItem.dataUrlType !== "local" &&
                !this.props.viewState.useSmallScreenInterface
              }
            >
              <div className={Styles.shareLinkWrapper}>
                <SharePanel
                  catalogShare
                  catalogShareWithoutText
                  modalWidth={this.props.widthFromMeasureElementHOC}
                  terria={this.props.terria}
                  viewState={this.props.viewState}
                />
              </div>
            </If>
          </div>
          <Description item={catalogItem} />
        </div>
      </div>
    );
  }
});

export default withTranslation()(measureElement(MappablePreview));
