import { sortBy, uniqBy } from "lodash-es";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import defined from "terriajs-cesium/Source/Core/defined";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import SplitDirection from "terriajs-cesium/Source/Scene/SplitDirection";
import {
  Category,
  DataSourceAction
} from "../../../Core/AnalyticEvents/analyticEvents";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import getDereferencedIfExists from "../../../Core/getDereferencedIfExists";
import getPath from "../../../Core/getPath";
import isDefined from "../../../Core/isDefined";
import TerriaError from "../../../Core/TerriaError";
import CatalogMemberMixin, {
  getName
} from "../../../ModelMixins/CatalogMemberMixin";
import DiffableMixin from "../../../ModelMixins/DiffableMixin";
import ExportableMixin from "../../../ModelMixins/ExportableMixin";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import SearchableItemMixin from "../../../ModelMixins/SearchableItemMixin";
import TimeVarying from "../../../ModelMixins/TimeVarying";
import CameraView from "../../../Models/CameraView";
import addUserCatalogMember from "../../../Models/Catalog/addUserCatalogMember";
import SplitItemReference from "../../../Models/Catalog/CatalogReferences/SplitItemReference";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import hasTraits from "../../../Models/Definition/hasTraits";
import Model, { BaseModel } from "../../../Models/Definition/Model";
import getAncestors from "../../../Models/getAncestors";
import { ViewingControl } from "../../../Models/ViewingControls";
import ViewState from "../../../ReactViewModels/ViewState";
import AnimatedSpinnerIcon from "../../../Styled/AnimatedSpinnerIcon";
import Box from "../../../Styled/Box";
import { RawButton } from "../../../Styled/Button";
import Icon, { StyledIcon } from "../../../Styled/Icon";
import Ul from "../../../Styled/List";
import { VectorTraits } from "../../../Traits/TraitsClasses/MappableTraits";
import SplitterTraits from "../../../Traits/TraitsClasses/SplitterTraits";
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
  color: ${(props) => props.theme.textDarker};
  background-color: ${(props) => props.theme.textLight};

  ${StyledIcon} {
    width: 35px;
  }

  svg {
    fill: ${(props) => props.theme.textDarker};
    width: 18px;
    height: 18px;
  }
  & > span {
    // position: absolute;
    // left: 37px;
  }

  border-radius: 0;

  width: 124px;
  // ensure we support long strings
  min-height: 32px;
  display: block;

  &:hover,
  &:focus {
    color: ${(props) => props.theme.textLight};
    background-color: ${(props) => props.theme.colorPrimary};
    svg {
      fill: ${(props) => props.theme.textLight};
    }
  }
`;

interface PropsType {
  viewState: ViewState;
  item: BaseModel;
}

const ViewingControls: React.FC<PropsType> = observer((props) => {
  const { viewState, item } = props;
  const { t } = useTranslation();
  const [isMenuOpen, setIsOpen] = useState(false);
  const [isMapZoomingToCatalogItem, setIsMapZoomingToCatalogItem] =
    useState(false);

  useEffect(() => {
    const hideMenu = () => {
      setIsOpen(false);
    };

    window.addEventListener("click", hideMenu);
    return () => window.removeEventListener("click", hideMenu);
  }, [viewState]);

  const removeFromMap = useCallback(() => {
    const terria = viewState.terria;
    terria.workbench.remove(item);
    terria.removeSelectedFeaturesForModel(item);
    if (TimeVarying.is(item)) viewState.terria.timelineStack.remove(item);
    viewState.terria.analytics?.logEvent(
      Category.dataSource,
      DataSourceAction.removeFromWorkbench,
      getPath(item)
    );
  }, [item, viewState]);

  const zoomTo = useCallback(() => {
    const viewer = viewState.terria.currentViewer;

    if (!MappableMixin.isMixedInto(item)) return;

    let zoomToView: CameraView | Rectangle | MappableMixin.Instance = item;
    function vectorToJson(vector: Model<VectorTraits>) {
      if (
        typeof vector?.x === "number" &&
        typeof vector?.y === "number" &&
        typeof vector?.z === "number"
      ) {
        return {
          x: vector.x,
          y: vector.y,
          z: vector.z
        };
      } else {
        return undefined;
      }
    }

    // camera is likely used more often than lookAt.
    const theWest = item?.idealZoom?.camera?.west;
    const theEast = item?.idealZoom?.camera?.east;
    const theNorth = item?.idealZoom?.camera?.north;
    const theSouth = item?.idealZoom?.camera?.south;

    if (
      isDefined(item.idealZoom?.lookAt?.targetLongitude) &&
      isDefined(item.idealZoom?.lookAt?.targetLatitude) &&
      (item.idealZoom?.lookAt?.range ?? 0) >= 0
    ) {
      // No value checking here. Improper values can lead to unexpected results.
      const lookAt = {
        targetLongitude: item.idealZoom.lookAt.targetLongitude,
        targetLatitude: item.idealZoom.lookAt.targetLatitude,
        targetHeight: item.idealZoom.lookAt.targetHeight,
        heading: item.idealZoom.lookAt.heading,
        pitch: item.idealZoom.lookAt.pitch,
        range: item.idealZoom.lookAt.range
      };

      // In the case of 2D viewer, it zooms to rectangle area approximated by the camera view parameters.
      zoomToView = CameraView.fromJson({ lookAt: lookAt });
    } else if (theWest && theEast && theNorth && theSouth) {
      const thePosition = vectorToJson(item?.idealZoom?.camera?.position);
      const theDirection = vectorToJson(item?.idealZoom?.camera?.direction);
      const theUp = vectorToJson(item?.idealZoom?.camera?.up);

      // No value checking here. Improper values can lead to unexpected results.
      const camera = {
        west: theWest,
        east: theEast,
        north: theNorth,
        south: theSouth,
        position: thePosition,
        direction: theDirection,
        up: theUp
      };

      zoomToView = CameraView.fromJson(camera);
    } else if (
      item.rectangle?.east !== undefined &&
      item.rectangle?.west !== undefined &&
      item.rectangle.east - item.rectangle.west >= 360
    ) {
      zoomToView = viewState.terria.mainViewer.homeCamera;
      console.log("Extent is wider than world so using homeCamera.");
    }

    setIsMapZoomingToCatalogItem(true);
    viewer.zoomTo(zoomToView).finally(() => {
      setIsMapZoomingToCatalogItem(false);
    });
  }, [item, viewState]);

  const splitItem = useCallback(() => {
    const terria = item.terria;
    const splitRef = new SplitItemReference(createGuid(), terria);

    runInAction(async () => {
      if (!hasTraits(item, SplitterTraits, "splitDirection")) return;

      if (item.splitDirection === SplitDirection.NONE) {
        item.setTrait(
          CommonStrata.user,
          "splitDirection",
          SplitDirection.RIGHT
        );
      }

      splitRef.setTrait(CommonStrata.user, "splitSourceItemId", item.uniqueId);
      terria.addModel(splitRef);
      terria.showSplitter = true;

      await splitRef.loadReference();
      runInAction(() => {
        const target = splitRef.target;
        if (target) {
          target.setTrait(
            CommonStrata.user,
            "name",
            t("splitterTool.workbench.copyName", {
              name: getName(item)
            })
          );

          // Set a direction opposite to the original item
          target.setTrait(
            CommonStrata.user,
            "splitDirection",
            item.splitDirection === SplitDirection.LEFT
              ? SplitDirection.RIGHT
              : SplitDirection.LEFT
          );
        }
      });

      // Add it to terria.catalog, which is required so the new item can be shared.
      addUserCatalogMember(terria, splitRef, {
        open: false
      });
    });
  }, [item, t]);

  const openDiffTool = useCallback(() => {
    viewState.openTool({
      toolName: "Difference",
      getToolComponent: () =>
        import("../../Tools/DiffTool/DiffTool").then((m) => m.default),
      params: {
        sourceItem: item
      }
    });
  }, [item, viewState]);

  const searchItem = useCallback(() => {
    runInAction(() => {
      if (!SearchableItemMixin.isMixedInto(item)) return;

      let itemSearchProvider;
      try {
        itemSearchProvider = item.createItemSearchProvider();
      } catch (error) {
        viewState.terria.raiseErrorToUser(error);
        return;
      }
      viewState.openTool({
        toolName: "Search Item",
        getToolComponent: () => LazyItemSearchTool,
        params: {
          item,
          itemSearchProvider,
          viewState
        }
      });
    });
  }, [item, viewState]);

  const previewItem = useCallback(async () => {
    // Open up all the parents (doesn't matter that this sets it to enabled as well because it already is).
    getAncestors(item)
      .map((item) => getDereferencedIfExists(item))
      .forEach((group) => {
        runInAction(() => {
          group.setTrait(CommonStrata.user, "isOpen", true);
        });
      });
    viewState
      .viewCatalogMember(item)
      .then((result) => result.raiseError(viewState.terria));
  }, [item, viewState]);

  const exportDataClicked = useCallback(() => {
    if (!ExportableMixin.isMixedInto(item)) return;

    exportData(item).catch((e) => {
      item.terria.raiseErrorToUser(e);
    });
  }, [item]);

  const viewingControls = useMemo(() => {
    if (!CatalogMemberMixin.isMixedInto(item)) {
      return [];
    }

    // Global viewing controls (usually defined by plugins).
    const globalViewingControls = filterOutUndefined(
      viewState.globalViewingControlOptions.map(
        (generateViewingControlForItem) => {
          try {
            return generateViewingControlForItem(item);
          } catch (err) {
            TerriaError.from(err).log();
            return undefined;
          }
        }
      )
    );
    // Item specific viewing controls
    const itemViewingControls: ViewingControl[] = item.viewingControls;

    // Collate list, unique by id and sorted by name
    return sortBy(
      uniqBy([...itemViewingControls, ...globalViewingControls], "id"),
      "name"
    );
  }, [item, viewState.globalViewingControlOptions]);

  const renderViewingControlsMenu = () => {
    const canSplit =
      !item.terria.configParameters.disableSplitter &&
      hasTraits(item, SplitterTraits, "splitDirection") &&
      hasTraits(item, SplitterTraits, "disableSplitter") &&
      !item.disableSplitter &&
      defined(item.splitDirection) &&
      item.terria.currentViewer.canShowSplitter;

    const handleOnClick = (viewingControl: ViewingControl) => {
      try {
        viewingControl.onClick(viewState);
      } catch (err) {
        viewState.terria.raiseErrorToUser(TerriaError.from(err));
      }
    };

    return (
      <ul>
        {viewingControls.map((viewingControl) => (
          <li key={viewingControl.id}>
            <ViewingControlMenuButton
              onClick={() => handleOnClick(viewingControl)}
              title={viewingControl.iconTitle}
            >
              <BoxViewingControl>
                <StyledIcon {...viewingControl.icon} />
                <span>{viewingControl.name}</span>
              </BoxViewingControl>
            </ViewingControlMenuButton>
          </li>
        ))}
        {canSplit ? (
          <li key={"workbench.splitItem"}>
            <ViewingControlMenuButton
              onClick={splitItem}
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
              onClick={openDiffTool}
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
              onClick={exportDataClicked}
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
              onClick={searchItem}
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
            onClick={removeFromMap}
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
  };

  return (
    <Box>
      <Ul
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
        gap={2}
      >
        <WorkbenchButton
          onClick={zoomTo}
          title={t("workbench.zoomToTitle")}
          disabled={
            // disabled if the item cannot be zoomed to or if a zoom is already in progress
            (MappableMixin.isMixedInto(item) && item.disableZoomTo) ||
            isMapZoomingToCatalogItem === true
          }
          iconElement={() =>
            isMapZoomingToCatalogItem ? (
              <AnimatedSpinnerIcon />
            ) : (
              <Icon glyph={Icon.GLYPHS.search} />
            )
          }
        >
          {t("workbench.zoomTo")}
        </WorkbenchButton>
        <WorkbenchButton
          onClick={previewItem}
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
          onClick={(e) => {
            e.stopPropagation();
            if (isMenuOpen) {
              setIsOpen(false);
            } else {
              setIsOpen(true);
            }
          }}
          title={t("workbench.showMoreActionsTitle")}
          iconOnly
          iconElement={() => <Icon glyph={Icon.GLYPHS.menuDotted} />}
        />
      </Ul>
      {isMenuOpen && (
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
          {renderViewingControlsMenu()}
        </Box>
      )}
    </Box>
  );
});

ViewingControls.displayName = "ViewingControls";

export default ViewingControls;
