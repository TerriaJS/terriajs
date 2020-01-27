"use strict";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import defined from "terriajs-cesium/Source/Core/defined";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import Icon from "../../Icon.jsx";
import ObserveModelMixin from "../../ObserveModelMixin";
import PickedFeatures from "../../../Map/PickedFeatures";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import when from "terriajs-cesium/Source/ThirdParty/when";
import classNames from "classnames";
import Styles from "./viewing-controls.scss";
import { withTranslation } from "react-i18next";

import duplicateItem from "../../../Models/duplicateItem";
import addUserCatalogMember from "../../../Models/addUserCatalogMember";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";

const ViewingControls = createReactClass({
  displayName: "ViewingControls",
  mixins: [ObserveModelMixin],

  propTypes: {
    item: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  },

  removeFromMap() {
    this.props.item.isEnabled = false;
  },

  zoomTo() {
    this.props.item.zoomToAndUseClock();
  },

  openFeature() {
    const item = this.props.item;
    const pickedFeatures = new PickedFeatures();
    pickedFeatures.features.push(item.tableStructure.sourceFeature);
    pickedFeatures.allFeaturesAvailablePromise = when();
    pickedFeatures.isLoading = false;
    const xyzPosition = item.tableStructure.sourceFeature.position.getValue(
      item.terria.clock.currentTime
    );
    const ellipsoid = Ellipsoid.WGS84;
    // Code replicated from GazetteerSearchProviderViewModel.
    const bboxRadians = 0.1; // GazetterSearchProviderViewModel uses 0.2 degrees ~ 0.0035 radians. 1 degree ~ 110km. 0.1 radian ~ 700km.

    const latLonPosition = Cartographic.fromCartesian(xyzPosition, ellipsoid);
    const south = latLonPosition.latitude + bboxRadians / 2;
    const west = latLonPosition.longitude - bboxRadians / 2;
    const north = latLonPosition.latitude - bboxRadians / 2;
    const east = latLonPosition.longitude + bboxRadians / 2;
    const rectangle = new Rectangle(west, south, east, north);
    const flightDurationSeconds = 1;
    // TODO: This is bad. How can we do it better?
    setTimeout(function() {
      item.terria.pickedFeatures = pickedFeatures;
      item.terria.currentViewer.zoomTo(rectangle, flightDurationSeconds);
    }, 50);
  },

  splitItem() {
    const { t } = this.props;
    const item = this.props.item;

    item.splitDirection = ImagerySplitDirection.RIGHT;
    const newItem = duplicateItem(
      item,
      undefined,
      t("splitterTool.workbench.copyName", {
        name: item.name
      })
    );
    newItem.splitDirection = ImagerySplitDirection.LEFT;
    if (newItem.useOwnClock === false) {
      newItem.useOwnClock = true;
    }

    // newItem is added to terria.nowViewing automatically by the "isEnabled" observable on CatalogItem (see isEnabledChanged).
    // However, nothing adds it to terria.catalog automatically, which is required so the new item can be shared.
    addUserCatalogMember(item.terria, newItem, { open: false, zoomTo: false });
    item.terria.showSplitter = true;
  },

  previewItem() {
    let item = this.props.item;
    // If this is a chartable item opened from another catalog item, get the info of the original item.
    if (defined(item.sourceCatalogItem)) {
      item = item.sourceCatalogItem;
    }
    // Open up all the parents (doesn't matter that this sets it to enabled as well because it already is).
    item.enableWithParents();
    this.props.viewState.viewCatalogMember(item);
    this.props.viewState.switchMobileView(
      this.props.viewState.mobileViewOptions.preview
    );
  },

  exportData() {
    const item = this.props.item;
    item.exportData();
  },

  openDeltaTool() {
    this.props.viewState.currentTool = { type: "delta", item: this.props.item };
  },

  render() {
    const item = this.props.item;
    const canZoom =
      item.canZoomTo ||
      (item.tableStructure && item.tableStructure.sourceFeature);
    const canSplit =
      !item.terria.configParameters.disableSplitter &&
      item.supportsSplitting &&
      defined(item.splitDirection) &&
      item.terria.currentViewer.canShowSplitter;
    const classList = {
      [Styles.noZoom]: !canZoom,
      [Styles.noSplit]: !canSplit,
      [Styles.noInfo]: !item.showsInfo
    };
    const { t, viewState } = this.props;
    return (
      <ul className={Styles.control}>
        <If condition={item.canZoomTo}>
          <li className={classNames(Styles.zoom, classList)}>
            <button
              type="button"
              onClick={this.zoomTo}
              title={t("workbench.zoomToTitle")}
              className={Styles.btn}
            >
              {t("workbench.zoomTo")}
            </button>
          </li>
          <span className={Styles.separator} />
        </If>
        <If
          condition={item.tableStructure && item.tableStructure.sourceFeature}
        >
          <li className={classNames(Styles.zoom, classList)}>
            <button
              type="button"
              onClick={this.openFeature}
              title={t("workbench.openFeatureTitle")}
              className={Styles.btn}
            >
              {t("workbench.openFeature")}
            </button>
          </li>
          <span className={Styles.separator} />
        </If>
        <If condition={item.showsInfo}>
          <li className={classNames(Styles.info, classList)}>
            <button
              type="button"
              onClick={this.previewItem}
              className={Styles.btn}
              title={t("workbench.previewItemTitle")}
            >
              {t("workbench.previewItem")}
            </button>
          </li>
          <span className={Styles.separator} />
        </If>
        <If condition={canSplit}>
          <li className={classNames(Styles.split, classList)}>
            <button
              type="button"
              onClick={this.splitItem}
              title={t("workbench.splitItemTitle")}
              className={Styles.btn}
            >
              {t("workbench.splitItem")}
            </button>
          </li>
          <span className={Styles.separator} />
        </If>
        <If condition={defined(item.linkedWcsUrl)}>
          <li className={classNames(Styles.info, classList)}>
            <button
              type="button"
              onClick={this.exportData}
              className={Styles.btn}
              title={t("workbench.exportDataTitle")}
            >
              {t("workbench.exportData")}
            </button>
          </li>
          <span className={Styles.separator} />
        </If>
        <If
          condition={
            item.supportsDeltaComparison &&
            viewState.useSmallScreenInterface === false
          }
        >
          <li className={classNames(Styles.delta, classList)}>
            <button
              type="button"
              onClick={this.openDeltaTool}
              className={Styles.btn}
              title="Compare imagery from two dates"
            >
              Delta
            </button>
          </li>
          <span className={Styles.separator} />
        </If>
        <li className={classNames(Styles.remove, classList)}>
          <button
            type="button"
            onClick={this.removeFromMap}
            title={t("workbench.removeFromMapTitle")}
            className={Styles.btn}
          >
            {t("workbench.removeFromMap")} <Icon glyph={Icon.GLYPHS.remove} />
          </button>
        </li>
      </ul>
    );
  }
});
module.exports = withTranslation()(ViewingControls);
