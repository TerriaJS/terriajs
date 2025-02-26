import { runInAction } from "mobx";
import React from "react";
import AugmentedVirtuality from "../../../Models/AugmentedVirtuality";
import ViewerMode from "../../../Models/ViewerMode";
import ViewState from "../../../ReactViewModels/ViewState";
import { GLYPHS } from "../../../Styled/Icon";
import { GenericMapNavigationItemController } from "../../../ViewModels/MapNavigation/MapNavigationItemController";
import {
  FeedbackButtonController,
  FEEDBACK_TOOL_ID
} from "../../Feedback/FeedbackButtonController";
import PedestrianMode, {
  PEDESTRIAN_MODE_ID
} from "../../Tools/PedestrianMode/PedestrianMode";
import { ToolButtonController } from "../../Tools/Tool";
import {
  AR_TOOL_ID,
  AugmentedVirtualityController,
  AugmentedVirtualityHoverController,
  AugmentedVirtualityRealign,
  AugmentedVirtualityRealignController,
  CloseToolButton,
  Compass,
  COMPASS_TOOL_ID,
  MyLocation,
  ToggleSplitterController,
  ZoomControl,
  ZOOM_CONTROL_ID
} from "./Items";
import { TogglePickInfoController } from "./Items/TogglePickInfoTool";
import KeyboardMode, {
  KEYBOARD_MODE_ID
} from "../../Tools/KeyboardMode/KeyboardMode";
import {
  MeasureLineTool,
  MeasurePolygonTool,
  MeasureAngleTool,
  MeasurePointTool,
  MeasureToolsController
} from "./Items/MeasureTools";
import MeasureTools from "../../../Models/MeasureTools";

export const CLOSE_TOOL_ID = "close-tool";

export const registerMapNavigations = (viewState: ViewState) => {
  const terria = viewState.terria;
  const mapNavigationModel = terria.mapNavigationModel;

  const compassController = new GenericMapNavigationItemController({
    viewerMode: ViewerMode.Cesium,
    icon: GLYPHS.compassInnerArrows
  });
  compassController.pinned = true;
  mapNavigationModel.addItem({
    id: COMPASS_TOOL_ID,
    name: "translate#compass",
    controller: compassController,
    location: "TOP",
    order: 1,
    screenSize: "medium",
    render: <Compass terria={terria} viewState={viewState} />
  });

  const zoomToolController = new GenericMapNavigationItemController({
    viewerMode: undefined,
    icon: GLYPHS.zoomIn
  });
  zoomToolController.pinned = true;
  mapNavigationModel.addItem({
    id: ZOOM_CONTROL_ID,
    name: "translate#zoom",
    controller: zoomToolController,
    location: "TOP",
    order: 2,
    screenSize: undefined,
    render: <ZoomControl terria={terria} viewState={viewState} />
  });

  const myLocation = new MyLocation({ terria });
  mapNavigationModel.addItem({
    id: MyLocation.id,
    name: "translate#location.location",
    title: "translate#location.centreMap",
    location: "TOP",
    controller: myLocation,
    screenSize: undefined,
    order: 3
  });

  const toggleSplitterController = new ToggleSplitterController(viewState);
  mapNavigationModel.addItem({
    id: ToggleSplitterController.id,
    name: "translate#splitterTool.toggleSplitterToolTitle",
    title: runInAction(() =>
      toggleSplitterController.disabled
        ? "translate#splitterTool.toggleSplitterToolDisabled"
        : "translate#splitterTool.toggleSplitterTool"
    ),
    location: "TOP",
    controller: toggleSplitterController,
    screenSize: undefined,
    order: 4
  });

  const measureTools = new MeasureTools(terria);
  const measureToolsController = new MeasureToolsController({
    terria: terria,
    viewState: viewState,
    measureTools: measureTools,
    onClose: () => {
      runInAction(() => {
        viewState.panel = undefined;
        viewState.measurablePanelIsVisible = false;
        viewState.measurableChartIsVisible = false;
        [
          MeasureLineTool.id,
          MeasurePolygonTool.id,
          MeasurePointTool.id,
          MeasureAngleTool.id
        ].forEach((id) => {
          const item =
            viewState.terria.mapNavigationModel.findItem(id)?.controller;
          if (item && item.active) {
            item.deactivate();
          }
          viewState.terria.mapNavigationModel.enable(id);
        });
      });
    }
  });
  mapNavigationModel.addItem({
    id: MeasureToolsController.id,
    name: "translate#measure.measureToolTitle",
    title: "translate#measure.measureTool",
    location: "TOP",
    screenSize: undefined,
    controller: measureToolsController,
    order: 5
  });

  const measureAngleToolController = new MeasureAngleTool({
    terria: terria,
    viewState: viewState,
    measureTools: measureTools,
    onClose: () => {
      runInAction(() => {
        viewState.terria.mapNavigationModel.enable(MeasurePolygonTool.id);
        viewState.terria.mapNavigationModel.enable(MeasureLineTool.id);
        viewState.terria.mapNavigationModel.enable(MeasurePointTool.id);
        viewState.panel = undefined;
        viewState.measurablePanelIsVisible = false;
        viewState.measurableChartIsVisible = false;
      });
    },
    onOpen: () => {
      runInAction(() => {
        [
          MeasureLineTool.id,
          MeasurePolygonTool.id,
          MeasurePointTool.id
        ].forEach((id) => {
          const item =
            viewState.terria.mapNavigationModel.findItem(id)?.controller;
          if (item && item.active) {
            item.deactivate();
          }
          viewState.terria.mapNavigationModel.disable(id);
        });
      });
    }
  });
  mapNavigationModel.addItem({
    id: MeasureAngleTool.id,
    name: "translate#measure.measureAngleToolTitle",
    title: "translate#measure.measureAngle",
    location: "TOP",
    screenSize: undefined,
    controller: measureAngleToolController,
    order: 6
  });

  const measurePolygonToolController = new MeasurePolygonTool({
    terria: terria,
    viewState: viewState,
    measureTools: measureTools,
    onClose: () => {
      runInAction(() => {
        viewState.terria.mapNavigationModel.enable(MeasureAngleTool.id);
        viewState.terria.mapNavigationModel.enable(MeasureLineTool.id);
        viewState.terria.mapNavigationModel.enable(MeasurePointTool.id);
        viewState.panel = undefined;
        viewState.measurablePanelIsVisible = false;
        viewState.measurableChartIsVisible = false;
      });
    },
    onOpen: () => {
      runInAction(() => {
        [MeasureLineTool.id, MeasureAngleTool.id, MeasurePointTool.id].forEach(
          (id) => {
            const item =
              viewState.terria.mapNavigationModel.findItem(id)?.controller;
            if (item && item.active) {
              item.deactivate();
            }
            viewState.terria.mapNavigationModel.disable(id);
          }
        );
        if (viewState.terria.measurableGeom) {
          viewState.terria.measurableGeom.filename = "";
          viewState.terria.measurableGeom.pathNotes = "";
          viewState.terria.measurableGeom.pointDescriptions = [];
        }
      });
    }
  });
  mapNavigationModel.addItem({
    id: MeasurePolygonTool.id,
    name: "translate#measure.measurePolygonToolTitle",
    title: "translate#measure.measureArea",
    location: "TOP",
    screenSize: undefined,
    controller: measurePolygonToolController,
    order: 6
  });

  const measureLineToolController = new MeasureLineTool({
    terria: terria,
    viewState: viewState,
    measureTools: measureTools,
    onClose: () => {
      runInAction(() => {
        viewState.terria.mapNavigationModel.enable(MeasureAngleTool.id);
        viewState.terria.mapNavigationModel.enable(MeasurePolygonTool.id);
        viewState.terria.mapNavigationModel.enable(MeasurePointTool.id);
        viewState.panel = undefined;
        viewState.measurablePanelIsVisible = false;
        viewState.measurableChartIsVisible = false;
      });
    },
    onOpen: () => {
      runInAction(() => {
        [
          MeasurePolygonTool.id,
          MeasureAngleTool.id,
          MeasurePointTool.id
        ].forEach((id) => {
          const item =
            viewState.terria.mapNavigationModel.findItem(id)?.controller;
          if (item && item.active) {
            item.deactivate();
          }
          viewState.terria.mapNavigationModel.disable(id);
        });
        if (viewState.terria.measurableGeom) {
          viewState.terria.measurableGeom.filename = "";
          viewState.terria.measurableGeom.pathNotes = "";
          viewState.terria.measurableGeom.pointDescriptions = [];
        }
      });
    }
  });
  mapNavigationModel.addItem({
    id: MeasureLineTool.id,
    name: "translate#measure.measureLineToolTitle",
    title: "translate#measure.measureDistance",
    location: "TOP",
    screenSize: undefined,
    controller: measureLineToolController,
    order: 6
  });

  const measurePointTool = new MeasurePointTool({
    terria: terria,
    viewState: viewState,
    measureTools: measureTools,
    onClose: () => {
      runInAction(() => {
        viewState.terria.mapNavigationModel.enable(MeasureAngleTool.id);
        viewState.terria.mapNavigationModel.enable(MeasurePolygonTool.id);
        viewState.terria.mapNavigationModel.enable(MeasureLineTool.id);
        viewState.panel = undefined;
        viewState.measurablePanelIsVisible = false;
      });
    },
    onOpen: () => {
      runInAction(() => {
        [
          MeasureLineTool.id,
          MeasureAngleTool.id,
          MeasurePolygonTool.id
        ].forEach((id) => {
          const item =
            viewState.terria.mapNavigationModel.findItem(id)?.controller;
          if (item && item.active) {
            item.deactivate();
          }
          viewState.terria.mapNavigationModel.disable(id);
        });
        if (viewState.terria.measurableGeom) {
          viewState.terria.measurableGeom.filename = "";
          viewState.terria.measurableGeom.pathNotes = "";
          viewState.terria.measurableGeom.pointDescriptions = [];
        }
      });
    }
  });
  mapNavigationModel.addItem({
    id: MeasurePointTool.id,
    name: "translate#measure.measurePointToolTitle",
    title: "translate#measure.measureDistance",
    location: "TOP",
    controller: measurePointTool,
    screenSize: undefined,
    order: 6
  });

  const toggleInfoController = new TogglePickInfoController(viewState);
  mapNavigationModel.addItem({
    id: TogglePickInfoController.id,
    name: "translate#pickInfo.toolName",
    title: "translate#pickInfo.title",
    location: "TOP",
    controller: toggleInfoController,
    screenSize: undefined,
    order: 7
  });

  const pedestrianModeToolController = new ToolButtonController({
    toolName: PEDESTRIAN_MODE_ID,
    viewState: viewState,
    getToolComponent: () => PedestrianMode as any,
    icon: GLYPHS.pedestrian
  });
  mapNavigationModel.addItem({
    id: PEDESTRIAN_MODE_ID,
    name: "translate#pedestrianMode.toolButtonTitle",
    title: "translate#pedestrianMode.toolButtonTitle",
    location: "TOP",
    screenSize: "medium",
    controller: pedestrianModeToolController,
    order: 5
  });

  const closeToolButtonController = new GenericMapNavigationItemController({
    handleClick: () => {
      viewState.closeTool();
    },
    icon: GLYPHS.closeLight
  });
  mapNavigationModel.addItem({
    id: CLOSE_TOOL_ID,
    name: "translate#close",
    location: "TOP",
    screenSize: undefined,
    controller: closeToolButtonController,
    render: <CloseToolButton />,
    order: 7
  });
  closeToolButtonController.setVisible(false);

  const augmentedVirtuality = new AugmentedVirtuality(terria);
  const arController = new AugmentedVirtualityController({
    terria: terria,
    viewState: viewState,
    augmentedVirtuality: augmentedVirtuality
  });
  mapNavigationModel.addItem({
    id: AR_TOOL_ID,
    name: "translate#AR.arTool",
    location: "TOP",
    screenSize: "small",
    controller: arController,
    order: 0,
    noExpand: true
  });

  const arControllerHover = new AugmentedVirtualityHoverController({
    augmentedVirtuality: augmentedVirtuality
  });
  mapNavigationModel.addItem({
    id: `${AR_TOOL_ID}_hover`,
    name: "translate#AR.btnHover",
    location: "TOP",
    screenSize: "small",
    controller: arControllerHover,
    order: 1,
    noExpand: true
  });

  const arRealignController = new AugmentedVirtualityRealignController({
    terria: terria,
    viewState: viewState,
    augmentedVirtuality: augmentedVirtuality
  });
  mapNavigationModel.addItem({
    id: `${AR_TOOL_ID}_realign`,
    name: runInAction(() =>
      augmentedVirtuality.manualAlignmentSet
        ? "translate#AR.btnRealign"
        : "translate#AR.btnResetRealign"
    ),
    location: "TOP",
    screenSize: "small",
    controller: arRealignController,
    render: (
      <AugmentedVirtualityRealign arRealignController={arRealignController} />
    ),
    order: 1,
    noExpand: true
  });

  const keyboardModeToolController = new ToolButtonController({
    toolName: KEYBOARD_MODE_ID,
    viewState: viewState,
    getToolComponent: () => KeyboardMode as any,
    icon: GLYPHS.keyboard
  });
  mapNavigationModel.addItem({
    id: KEYBOARD_MODE_ID,
    name: "translate#keyboardControls.toolButtonTitle",
    title: "translate#keyboardControls.toolButtonTitle",
    location: "TOP",
    screenSize: "medium",
    controller: keyboardModeToolController,
    order: 9
  });

  const feedbackController = new FeedbackButtonController(viewState);
  mapNavigationModel.addItem({
    id: FEEDBACK_TOOL_ID,
    name: "translate#feedback.feedbackBtnText",
    title: "translate#feedback.feedbackBtnText",
    location: "BOTTOM",
    screenSize: "medium",
    controller: feedbackController,
    order: 8
  });
};
