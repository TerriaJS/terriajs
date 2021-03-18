import { runInAction } from "mobx";
import React from "react";
import { GenericMapNavigationItemController } from "../../../Models/MapNavigation/MapNavigationItemController";
import ViewerMode from "../../../Models/ViewerMode";
import ViewState from "../../../ReactViewModels/ViewState";
import { GLYPHS } from "../../Icon";
import PedestrianMode, {
  PEDESTRIAN_MODE_ID
} from "../../Tools/PedestrianMode/PedestrianMode";
import {
  FeedbackNavigationItemController,
  FEEDBACK_TOOL_ID
} from "./../../Feedback/FeedbackController";
import { ToolButtonController } from "./../../Tools/Tool";
import Compass, { COMPASS_TOOL_ID } from "./Items/Compass";
import MeasureTool from "./Items/MeasureTool";
import MyLocation from "./Items/MyLocation";
import { ToggleSplitterController } from "./Items/ToggleSplitterTool";
import ZoomControl, { ZOOM_CONTROL_ID } from "./Items/ZoomControl";
import { HELP_PANEL_ID } from "./../Panels/HelpPanel/HelpPanel";

export const registerMapNavigations = (viewState: ViewState) => {
  const terria = viewState.terria;
  const mapNavigationModel = terria.mapNavigationModel;

  const compassController = new GenericMapNavigationItemController({
    viewerMode: ViewerMode.Cesium
  });
  compassController.pinned = true;
  mapNavigationModel.add({
    id: COMPASS_TOOL_ID,
    name: "compass",
    controller: compassController,
    location: "TOP",
    order: 1,
    screenSize: "medium",
    render: <Compass terria={terria} viewState={viewState} />
  });

  const zoomToolController = new GenericMapNavigationItemController({
    viewerMode: undefined
  });
  zoomToolController.pinned = true;
  mapNavigationModel.add({
    id: ZOOM_CONTROL_ID,
    name: "zoom",
    controller: zoomToolController,
    location: "TOP",
    order: 2,
    screenSize: "medium",
    render: <ZoomControl terria={terria} />
  });

  const myLocation = new MyLocation({ terria });

  mapNavigationModel.add({
    id: MyLocation.id,
    name: "location.location",
    title: "location.centreMap",
    location: "TOP",
    controller: myLocation,
    screenSize: undefined,
    order: 3
  });

  const toggleSplitterController = new ToggleSplitterController(viewState);

  mapNavigationModel.add({
    id: ToggleSplitterController.id,
    name: "splitterTool.toggleSplitterToolTitle",
    title: toggleSplitterController.disabled
      ? "splitterTool.toggleSplitterToolDisabled"
      : "splitterTool.toggleSplitterTool",
    location: "TOP",
    controller: toggleSplitterController,
    screenSize: undefined,
    order: 4
  });

  const measureTool = new MeasureTool({
    terria,
    onClose: () => {
      runInAction(() => {
        viewState.panel = undefined;
      });
    }
  });

  mapNavigationModel.add({
    id: MeasureTool.id,
    name: "measure.measureToolTitle",
    title: "measure.measureDistance",
    location: "TOP",
    controller: measureTool,
    screenSize: undefined,
    order: 5
  });

  const pedestrianModeToolController = new ToolButtonController({
    toolName: PEDESTRIAN_MODE_ID,
    viewState: viewState,
    //@ts-ignore
    getToolComponent: () => Promise.resolve(PedestrianMode),
    icon: GLYPHS.pedestrian
  });

  mapNavigationModel.add({
    id: PEDESTRIAN_MODE_ID,
    name: "pedestrianMode.toolButtonTitle",
    title: "pedestrianMode.toolButtonTitle",
    location: "TOP",
    screenSize: "medium",
    controller: pedestrianModeToolController,
    order: 6
  });

  const feedbackController = new FeedbackNavigationItemController(viewState);
  mapNavigationModel.add({
    id: FEEDBACK_TOOL_ID,
    name: "feedback.feedbackBtnText",
    title: "feedback.feedbackBtnText",
    location: "BOTTOM",
    screenSize: "medium",
    controller: feedbackController,
    order: 7
  });

  const helpController = new GenericMapNavigationItemController({
    icon: GLYPHS.helpThick,
    handleClick: () => viewState.showHelpPanel()
  });

  mapNavigationModel.add({
    id: HELP_PANEL_ID,
    name: "helpMenu.btnText",
    title: "helpMenu.btnTitle",
    location: "BOTTOM",
    screenSize: "medium",
    controller: helpController,
    order: 8
  });
};

export const SPLITTER_ICON_NAME = "MapNavigationSplitterIcon";
