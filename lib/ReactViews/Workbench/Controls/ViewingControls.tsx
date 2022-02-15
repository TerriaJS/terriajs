import { runInAction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import styled from "styled-components";
import defined from "terriajs-cesium/Source/Core/defined";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import {
  Category,
  DataSourceAction
} from "../../../Core/AnalyticEvents/analyticEvents";
import getDereferencedIfExists from "../../../Core/getDereferencedIfExists";
import getPath from "../../../Core/getPath";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import DiffableMixin from "../../../ModelMixins/DiffableMixin";
import ExportableMixin from "../../../ModelMixins/ExportableMixin";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import SearchableItemMixin from "../../../ModelMixins/SearchableItemMixin";
import TimeVarying from "../../../ModelMixins/TimeVarying";
import CameraView from "../../../Models/CameraView";
import {
  createCompareConfig,
  isComparableItem
} from "../../../Models/Comparable";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import hasTraits from "../../../Models/Definition/hasTraits";
import { BaseModel } from "../../../Models/Definition/Model";
import getAncestors from "../../../Models/getAncestors";
import { default as ViewingControlsModel } from "../../../Models/ViewingControls";
import ViewState from "../../../ReactViewModels/ViewState";
import AnimatedSpinnerIcon from "../../../Styled/AnimatedSpinnerIcon";
import Box from "../../../Styled/Box";
import { RawButton } from "../../../Styled/Button";
import Icon, { StyledIcon } from "../../../Styled/Icon";
import MappableTraits from "../../../Traits/TraitsClasses/MappableTraits";
import { exportData } from "../../Preview/ExportData";
import LazyItemSearchTool from "../../Tools/ItemSearchTool/LazyItemSearchTool";
import WorkbenchButton from "../WorkbenchButton";

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

interface PropsType extends WithTranslation {
  viewState: ViewState;
  item: BaseModel;
}

@observer
class ViewingControls extends React.Component<
  PropsType,
  { isMapZoomingToCatalogItem: boolean }
> {
  constructor(props: any) {
    // Required step: always call the parent class' constructor
    super(props);

    // Set the state directly. Use props if necessary.
    this.state = {
      isMapZoomingToCatalogItem: false
    };
  }

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    window.addEventListener("click", this.hideMenu.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener("click", this.hideMenu.bind(this));
  }

  hideMenu() {
    runInAction(() => {
      this.props.viewState.workbenchWithOpenControls = undefined;
    });
  }

  removeFromMap() {
    const terria = this.props.viewState.terria;
    terria.workbench.remove(this.props.item);
    terria.removeSelectedFeaturesForModel(this.props.item);
    if (TimeVarying.is(this.props.item))
      this.props.viewState.terria.timelineStack.remove(this.props.item);
    this.props.viewState.terria.analytics?.logEvent(
      Category.dataSource,
      DataSourceAction.removeFromWorkbench,
      getPath(this.props.item)
    );
  }

  zoomTo() {
    runInAction(() => {
      const viewer = this.props.viewState.terria.currentViewer;
      const item = this.props.item;
      let zoomToView: CameraView | Rectangle | MappableMixin.Instance;

      if (MappableMixin.isMixedInto(item)) {
        zoomToView = item;
        if (
          isDefined(item.rectangle) &&
          isDefined(item.rectangle.east) &&
          isDefined(item.rectangle.west) &&
          item.rectangle.east - item.rectangle.west >= 360
        ) {
          zoomToView = this.props.viewState.terria.mainViewer.homeCamera;
          console.log("Extent is wider than world so using homeCamera.");
        }
        this.setState({ isMapZoomingToCatalogItem: true });
        viewer.zoomTo(zoomToView).finally(() => {
          this.setState({ isMapZoomingToCatalogItem: false });
        });
      }
    });
  }

  compareItem() {
    runInAction(() => {
      const terria = this.props.viewState.terria;
      terria.compareConfig = createCompareConfig({
        showCompare: true,
        leftPanelItemId: this.props.item.uniqueId,
        isUserTriggered: true
      });

      // Disable all other workbench items before launching compare workflow.
      terria.workbench.items.forEach(
        item =>
          item !== this.props.item &&
          hasTraits(item, MappableTraits, "show") &&
          item.setTrait(CommonStrata.user, "show", false)
      );
    });
  }

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
  }

  searchItem() {
    runInAction(() => {
      const { item, viewState } = this.props;
      if (!SearchableItemMixin.isMixedInto(item)) return;

      let itemSearchProvider;
      try {
        itemSearchProvider = item.createItemSearchProvider();
      } catch (error) {
        viewState.terria.raiseErrorToUser(error);
        return;
      }
      this.props.viewState.openTool({
        toolName: "Search Item",
        getToolComponent: () => LazyItemSearchTool,
        showCloseButton: false,
        params: {
          item,
          itemSearchProvider,
          viewState
        }
      });
    });
  }

  async previewItem() {
    let item = this.props.item;
    // Open up all the parents (doesn't matter that this sets it to enabled as well because it already is).
    getAncestors(this.props.item)
      .map(item => getDereferencedIfExists(item))
      .forEach(group => {
        runInAction(() => {
          group.setTrait(CommonStrata.user, "isOpen", true);
        });
      });
    this.props.viewState.viewCatalogMember(item);
  }

  exportDataClicked() {
    const item = this.props.item;

    if (!ExportableMixin.isMixedInto(item)) return;

    exportData(item).catch(e => {
      this.props.item.terria.raiseErrorToUser(e);
    });
  }

  renderViewingControlsMenu() {
    const { t, item, viewState } = this.props;
    const canCompareItem =
      !item.terria.configParameters.disableSplitter &&
      item.terria.currentViewer.canShowSplitter &&
      isComparableItem(item) &&
      !item.disableSplitter &&
      defined(item.splitDirection);

    return (
      <ul>
        {ViewingControlsModel.is(item)
          ? item.viewingControls.map(viewingControl => (
              <li key={viewingControl.id}>
                <ViewingControlMenuButton
                  onClick={() => viewingControl.onClick(this.props.viewState)}
                  title={viewingControl.iconTitle}
                >
                  <BoxViewingControl>
                    <StyledIcon {...viewingControl.icon} />
                    <span>{viewingControl.name}</span>
                  </BoxViewingControl>
                </ViewingControlMenuButton>
              </li>
            ))
          : null}
        {canCompareItem ? (
          <li key={"workbench.splitItem"}>
            <ViewingControlMenuButton
              onClick={this.compareItem.bind(this)}
              title={t("workbench.splitItemTitle")}
            >
              <BoxViewingControl>
                <StyledIcon glyph={Icon.GLYPHS.compare} />
                <span>{t("workbench.splitItem")}</span>
              </BoxViewingControl>
            </ViewingControlMenuButton>
          </li>
        ) : null}
        {viewState.useSmallScreenInterface === false &&
        DiffableMixin.isMixedInto(item) &&
        !item.isShowingDiff &&
        item.canDiffImages ? (
          <li key={"workbench.diffImage"}>
            <ViewingControlMenuButton
              onClick={this.openDiffTool.bind(this)}
              title={t("workbench.diffImageTitle")}
            >
              <BoxViewingControl>
                <StyledIcon glyph={Icon.GLYPHS.difference} />
                <span>{t("workbench.diffImage")}</span>
              </BoxViewingControl>
            </ViewingControlMenuButton>
          </li>
        ) : null}
        {viewState.useSmallScreenInterface === false &&
        ExportableMixin.isMixedInto(item) &&
        item.canExportData ? (
          <li key={"workbench.exportData"}>
            <ViewingControlMenuButton
              onClick={this.exportDataClicked.bind(this)}
              title={t("workbench.exportDataTitle")}
            >
              <BoxViewingControl>
                <StyledIcon glyph={Icon.GLYPHS.upload} />
                <span>{t("workbench.exportData")}</span>
              </BoxViewingControl>
            </ViewingControlMenuButton>
          </li>
        ) : null}
        {viewState.useSmallScreenInterface === false &&
        SearchableItemMixin.isMixedInto(item) &&
        item.canSearch ? (
          <li key={"workbench.searchItem"}>
            <ViewingControlMenuButton
              onClick={this.searchItem.bind(this)}
              title={t("workbench.searchItemTitle")}
            >
              <BoxViewingControl>
                <StyledIcon glyph={Icon.GLYPHS.search} />
                <span>{t("workbench.searchItem")}</span>
              </BoxViewingControl>
            </ViewingControlMenuButton>
          </li>
        ) : null}
        <li key={"workbench.removeFromMap"}>
          <ViewingControlMenuButton
            onClick={this.removeFromMap.bind(this)}
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
  }

  render() {
    const viewState = this.props.viewState;
    const item = this.props.item;
    const { t } = this.props;
    const showMenu = item.uniqueId === viewState.workbenchWithOpenControls;
    return (
      <Box>
        <ul
          css={`
            list-style: none;
            padding-left: 0;
            margin: 0;
            width: 100%;
            position: relative;
            display: flex;
            justify-content: space-between;

            li {
              display: block;
              float: left;
              box-sizing: border-box;
            }
            & > button:last-child {
              margin-right: 0;
            }
          `}
        >
          <WorkbenchButton
            onClick={this.zoomTo.bind(this)}
            title={t("workbench.zoomToTitle")}
            disabled={
              // disabled if the item cannot be zoomed to or if a zoom is already in progress
              (MappableMixin.isMixedInto(item) && item.disableZoomTo) ||
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
          <WorkbenchButton
            onClick={this.previewItem.bind(this)}
            title={t("workbench.previewItemTitle")}
            iconElement={() => <Icon glyph={Icon.GLYPHS.about} />}
            disabled={
              CatalogMemberMixin.isMixedInto(item) && item.disableAboutData
            }
          >
            {t("workbench.previewItem")}
          </WorkbenchButton>
          <WorkbenchButton
            css="flex-grow:0;"
            onClick={e => {
              e.stopPropagation();
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
            iconElement={() => <Icon glyph={Icon.GLYPHS.menuDotted} />}
          />
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
}

export default withTranslation()(ViewingControls);
