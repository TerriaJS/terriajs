"use strict";
import classNames from "classnames";
import createReactClass from "create-react-class";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import styled from "styled-components";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import defined from "terriajs-cesium/Source/Core/defined";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import when from "terriajs-cesium/Source/ThirdParty/when";
import getDereferencedIfExists from "../../../Core/getDereferencedIfExists";
import getPath from "../../../Core/getPath";
import TerriaError from "../../../Core/TerriaError";
import PickedFeatures from "../../../Map/PickedFeatures";
import ExportableMixin from "../../../ModelMixins/ExportableMixin";
import SearchableItemMixin from "../../../ModelMixins/SearchableItemMixin";
import CommonStrata from "../../../Models/CommonStrata";
import getAncestors from "../../../Models/getAncestors";
import AnimatedSpinnerIcon from "../../../Styled/AnimatedSpinnerIcon";
import Box from "../../../Styled/Box";
import { RawButton } from "../../../Styled/Button";
import Icon, { StyledIcon } from "../../../Styled/Icon";
import { exportData } from "../../Preview/ExportData";
import WorkbenchButton from "../WorkbenchButton";
import Styles from "./viewing-controls.scss";
import { isComparableItem } from "../../../Models/Comparable.ts";

const BoxViewingControl = styled(Box).attrs({
  centered: true,
  left: true,
  justifySpaceBetween: true
})``;

const ViewingControlMenuButton = styled(RawButton).attrs({
  // primaryHover: true
})`
  color: ${props => props.theme.textDarker};
  background-color: ${props => props.theme.textLight};

  ${StyledIcon} {
    width: 35px;
  }

  svg {
    fill: ${props => props.theme.textDarker};
    width: 18px;
    height: 18px;
  }
  & > span {
    // position: absolute;
    // left: 37px;
  }

  border-radius: 0;

  width: 114px;
  // ensure we support long strings
  min-height: 32px;
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

    getInitialState() {
      return {
        isMapZoomingToCatalogItem: false
      };
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
      const terria = this.props.viewState.terria;
      terria.workbench.remove(this.props.item);
      terria.removeSelectedFeaturesForModel(this.props.item);
      this.props.viewState.terria.timelineStack.remove(this.props.item);
      this.props.viewState.terria.analytics?.logEvent(
        "dataSource",
        "removeFromWorkbench",
        getPath(this.props.item)
      );
    },

    zoomTo() {
      runInAction(() => {
        const viewer = this.props.viewState.terria.currentViewer;
        const item = this.props.item;
        let zoomToView = item;
        if (
          item.rectangle !== undefined &&
          item.rectangle.east - item.rectangle.west >= 360
        ) {
          zoomToView = this.props.viewState.terria.mainViewer.homeCamera;
          console.log("Extent is wider than world so using homeCamera.");
        }
        this.setState({ isMapZoomingToCatalogItem: true });
        viewer.zoomTo(zoomToView).finally(() => {
          this.setState({ isMapZoomingToCatalogItem: false });
        });
      });
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

    compareItem() {
      runInAction(() => {
        this.props.viewState.terria.compareLeftItemId = this.props.item.uniqueId;
        this.props.viewState.terria.showSplitter = true;
      });
    },

    openDiffTool() {
      // Disable timeline
      // Should we do this? Difference is quite a specific use case
      this.props.item.terria.timelineStack.removeAll();
      this.props.viewState.openTool({
        toolName: "Difference",
        getToolComponent: () =>
          import("../../Tools/DiffTool/DiffTool").then(m => m.default),
        showCloseButton: true,
        params: {
          sourceItem: this.props.item
        }
      });
    },

    searchItem() {
      const { item, viewState } = this.props;
      let itemSearchProvider;
      try {
        itemSearchProvider = item.createItemSearchProvider();
      } catch (error) {
        viewState.terria.raiseErrorToUser(error);
        return;
      }
      this.props.viewState.openTool({
        toolName: "Search Item",
        getToolComponent: () =>
          import("../../Tools/ItemSearchTool/ItemSearchTool").then(
            m => m.default
          ),
        showCloseButton: false,
        params: {
          item,
          itemSearchProvider,
          viewState
        }
      });
    },

    previewItem() {
      let item = this.props.item;
      // If this is a chartable item opened from another catalog item, get the info of the original item.
      if (defined(item.sourceCatalogItem)) {
        item = item.sourceCatalogItem;
      }
      // Open up all the parents (doesn't matter that this sets it to enabled as well because it already is).
      getAncestors(this.props.item)
        .map(item => getDereferencedIfExists(item))
        .forEach(group => {
          runInAction(() => {
            group.setTrait(CommonStrata.user, "isOpen", true);
          });
        });
      this.props.viewState.viewCatalogMember(item);
      this.props.viewState.switchMobileView(
        this.props.viewState.mobileViewOptions.preview
      );
    },

    exportDataClicked() {
      const item = this.props.item;

      exportData(item).catch(e => {
        if (e instanceof TerriaError) {
          this.props.item.terria.raiseErrorToUser(e);
        }
      });
    },

    renderViewingControlsMenu() {
      const { t, item, viewState } = this.props;
      const canCompareItem =
        !item.terria.configParameters.disableSplitter &&
        item.terria.currentViewer.canShowSplitter &&
        isComparableItem(item);
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
                <BoxViewingControl>
                  <StyledIcon glyph={Icon.GLYPHS.upload} />
                  <span>{t("workbench.openFeature")}</span>
                </BoxViewingControl>
              </ViewingControlMenuButton>
            </li>
          </If>
          <If condition={canCompareItem}>
            <li>
              <ViewingControlMenuButton
                onClick={this.compareItem}
                title={t("workbench.splitItemTitle")}
              >
                <BoxViewingControl>
                  <StyledIcon glyph={Icon.GLYPHS.compare} />
                  <span>{t("workbench.splitItem")}</span>
                </BoxViewingControl>
              </ViewingControlMenuButton>
            </li>
          </If>
          <If
            condition={
              viewState.useSmallScreenInterface === false &&
              !item.isShowingDiff &&
              item.canDiffImages
            }
          >
            <li className={classNames(Styles.split)}>
              <ViewingControlMenuButton
                onClick={this.openDiffTool}
                title={t("workbench.diffImageTitle")}
              >
                <BoxViewingControl>
                  <StyledIcon glyph={Icon.GLYPHS.difference} />
                  <span>{t("workbench.diffImage")}</span>
                </BoxViewingControl>
              </ViewingControlMenuButton>
            </li>
          </If>
          <If
            condition={ExportableMixin.isMixedInto(item) && item.canExportData}
          >
            <li className={classNames(Styles.info)}>
              <ViewingControlMenuButton
                onClick={this.exportDataClicked}
                title={t("workbench.exportDataTitle")}
              >
                <BoxViewingControl>
                  <StyledIcon glyph={Icon.GLYPHS.upload} />
                  <span>{t("workbench.exportData")}</span>
                </BoxViewingControl>
              </ViewingControlMenuButton>
            </li>
          </If>
          <If
            condition={SearchableItemMixin.isMixedInto(item) && item.canSearch}
          >
            <li className={classNames(Styles.info)}>
              <ViewingControlMenuButton
                onClick={() => runInAction(() => this.searchItem())}
                title={t("workbench.searchItemTitle")}
              >
                <BoxViewingControl>
                  <StyledIcon glyph={Icon.GLYPHS.search} />
                  <span>{t("workbench.searchItem")}</span>
                </BoxViewingControl>
              </ViewingControlMenuButton>
            </li>
          </If>
          <li className={classNames(Styles.removez)}>
            <ViewingControlMenuButton
              onClick={this.removeFromMap}
              title={t("workbench.removeFromMapTitle")}
            >
              <BoxViewingControl>
                <StyledIcon glyph={Icon.GLYPHS.cancel} />
                <span>{t("workbench.removeFromMap")}</span>
              </BoxViewingControl>
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
      const classList = {
        [Styles.noZoom]: !canZoom,
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
              disabled={
                // disabled if the item cannot be zoomed to or if a zoom is already in progress
                item.canZoomTo === false ||
                this.state.isMapZoomingToCatalogItem === true
              }
              iconElement={() =>
                this.state.isMapZoomingToCatalogItem ? (
                  <AnimatedSpinnerIcon />
                ) : (
                  <Icon glyph={Icon.GLYPHS.search} />
                )
              }
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
                  if (viewState.workbenchWithOpenControls === item.uniqueId) {
                    viewState.workbenchWithOpenControls = undefined;
                  } else {
                    viewState.workbenchWithOpenControls = item.uniqueId;
                  }
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
                top: 32px;
                top: 42px;

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
