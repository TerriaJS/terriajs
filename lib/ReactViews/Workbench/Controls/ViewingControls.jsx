"use strict";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";
import React from "react";
import styled from "styled-components";
import classNames from "classnames";
import createReactClass from "create-react-class";
import { withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import { observer } from "mobx-react";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import when from "terriajs-cesium/Source/ThirdParty/when";

import CommonStrata from "../../../Models/CommonStrata";
import Icon from "../../Icon";
import PickedFeatures from "../../../Map/PickedFeatures";
import PropTypes from "prop-types";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Styles from "./viewing-controls.scss";
import addUserCatalogMember from "../../../Models/addUserCatalogMember";
import getAncestors from "../../../Models/getAncestors";
import { runInAction } from "mobx";

import Box from "../../../Styled/Box";
import { RawButton } from "../../../Styled/Button";
import WorkbenchButton from "../WorkbenchButton";

const ViewingControlMenuButton = styled(RawButton).attrs({
  // primaryHover: true
})`
  color: ${props => props.theme.textDarker};
  background-color: ${props => props.theme.textLight};
  svg {
    fill: ${props => props.theme.textDarker};
  }
  border-radius: none;

  width: 114px;
  height: 35px;
  display: block;

  &:hover,
  &:focus {
    color: ${props => props.theme.textLight};
    background-color: ${props => props.theme.colorPrimary};
    svg {
      fill: ${props => props.theme.textLight};
    }
  }
`;

const ViewingControls = observer(
  createReactClass({
    displayName: "ViewingControls",

    propTypes: {
      item: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      t: PropTypes.func.isRequired
    },

    /* eslint-disable-next-line camelcase */
    UNSAFE_componentWillMount() {
      window.addEventListener("click", this.hideMenu);
    },

    componentWillUnmount() {
      window.removeEventListener("click", this.hideMenu);
    },

    hideMenu() {
      runInAction(() => {
        this.props.viewState.workbenchWithOpenControls = undefined;
      });
    },

    removeFromMap() {
      const workbench = this.props.viewState.terria.workbench;
      workbench.remove(this.props.item);
      this.props.viewState.terria.timelineStack.remove(this.props.item);
    },

    zoomTo() {
      const viewer = this.props.viewState.terria.currentViewer;
      viewer.zoomTo(this.props.item);
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
      const terria = item.terria;

      const newItemId = createGuid();
      const newItem = item.duplicateModel(newItemId);

      runInAction(() => {
        item.setTrait(
          CommonStrata.user,
          "splitDirection",
          ImagerySplitDirection.RIGHT
        );
        newItem.setTrait(
          CommonStrata.user,
          "name",
          t("splitterTool.workbench.copyName", {
            name: item.name
          })
        );
        newItem.setTrait(
          CommonStrata.user,
          "splitDirection",
          ImagerySplitDirection.LEFT
        );

        terria.showSplitter = true;
      });

      // Add it to terria.catalog, which is required so the new item can be shared.
      addUserCatalogMember(terria, newItem, { open: false, zoomTo: false });
    },

    previewItem() {
      let item = this.props.item;
      // If this is a chartable item opened from another catalog item, get the info of the original item.
      if (defined(item.sourceCatalogItem)) {
        item = item.sourceCatalogItem;
      }
      // Open up all the parents (doesn't matter that this sets it to enabled as well because it already is).
      getAncestors(this.props.item.terria, this.props.item).forEach(group => {
        runInAction(() => {
          group.setTrait(CommonStrata.user, "isOpen", true);
        });
      });
      this.props.viewState.viewCatalogMember(item);
      this.props.viewState.switchMobileView(
        this.props.viewState.mobileViewOptions.preview
      );
    },

    exportData() {
      const item = this.props.item;
      item.exportData();
    },

    renderViewingControlsMenu() {
      const { t, item } = this.props;
      const canSplit =
        !item.terria.configParameters.disableSplitter &&
        item.supportsSplitting &&
        defined(item.splitDirection) &&
        item.terria.currentViewer.canShowSplitter;
      return (
        <ul ref={e => (this.menuRef = e)}>
          <If
            condition={item.tableStructure && item.tableStructure.sourceFeature}
          >
            <li className={classNames(Styles.zoom)}>
              <ViewingControlMenuButton
                onClick={this.openFeature}
                title={t("workbench.openFeatureTitle")}
              >
                {t("workbench.openFeature")}
              </ViewingControlMenuButton>
            </li>
          </If>
          <If condition={canSplit}>
            <li className={classNames(Styles.split)}>
              <ViewingControlMenuButton
                onClick={this.splitItem}
                title={t("workbench.splitItemTitle")}
              >
                {t("workbench.splitItem")}
              </ViewingControlMenuButton>
            </li>
          </If>
          <If condition={defined(item.linkedWcsUrl)}>
            <li className={classNames(Styles.info)}>
              <ViewingControlMenuButton
                onClick={this.exportData}
                title={t("workbench.exportDataTitle")}
              >
                {t("workbench.exportData")}
              </ViewingControlMenuButton>
            </li>
          </If>
          <li className={classNames(Styles.remove)}>
            <ViewingControlMenuButton
              onClick={this.removeFromMap}
              title={t("workbench.removeFromMapTitle")}
            >
              {t("workbench.removeFromMap")}
              {/* <Icon glyph={Icon.GLYPHS.remove} /> */}
            </ViewingControlMenuButton>
          </li>
        </ul>
      );
    },

    render() {
      const viewState = this.props.viewState;
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
      const { t } = this.props;
      const showMenu = item.uniqueId === viewState.workbenchWithOpenControls;
      return (
        <Box>
          <ul
            className={Styles.control}
            css={`
              & > button:last-child {
                margin-right: 0;
              }
            `}
          >
            {/* <If condition={item.canZoomTo}> */}
            <WorkbenchButton
              className={classNames(Styles.zoom, classList)}
              onClick={this.zoomTo}
              title={t("workbench.zoomToTitle")}
              // className={Styles.btn}
              disabled={!item.canZoomTo}
              iconElement={() => <Icon glyph={Icon.GLYPHS.search} />}
            >
              {t("workbench.zoomTo")}
            </WorkbenchButton>
            {/* </If> */}
            {/* <If condition={item.showsInfo}> */}
            <WorkbenchButton
              onClick={this.previewItem}
              title={t("workbench.previewItemTitle")}
              iconElement={() => <Icon glyph={Icon.GLYPHS.about} />}
              disabled={!item.showsInfo}
              className={classNames(Styles.info, classList)}
            >
              {t("workbench.previewItem")}
            </WorkbenchButton>
            <WorkbenchButton
              css="flex-grow:0;"
              onClick={e => {
                event.stopPropagation();
                runInAction(() => {
                  viewState.workbenchWithOpenControls = item.uniqueId;
                });
              }}
              title={t("workbench.showMoreActionsTitle")}
              iconOnly
              className={classNames(Styles.info, classList)}
              iconElement={() => <Icon glyph={Icon.GLYPHS.menuDotted} />}
            />
            {/* </If> */}
          </ul>
          {showMenu && (
            <Box
              css={`
                position: absolute;
                z-index: 100;
                right: 0;
                top: 0;

                padding: 0;
                margin: 0;

                ul {
                  list-style: none;
                }
              `}
            >
              {this.renderViewingControlsMenu()}
            </Box>
          )}
        </Box>
      );
    }
  })
);
module.exports = withTranslation()(ViewingControls);
