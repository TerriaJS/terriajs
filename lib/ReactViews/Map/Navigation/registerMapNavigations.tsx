import { observable, runInAction } from "mobx";
import React, { useRef } from "react";
import isDefined from "../../../Core/isDefined";
import ViewerMode from "../../../Models/ViewerMode";
import ViewState from "../../../ReactViewModels/ViewState";
import { GLYPHS } from "../../Icon";
import Compass from "./Items/Compass";
import MyLocation from "./Items/MyLocation";
import ToggleSplitterTool, {
  splitterNavigationName
} from "./Items/ToggleSplitterTool";
import { ToolButton } from "./Items/ToolButton";
import ZoomControl from "./Items/ZoomControl";
import MeasureTool from "./Items/MeasureTool";
const Text = require("../../../Styled/Text").default;

export const registerMapNavigations = (viewState: ViewState) => {
  const terria = viewState.terria;
  const mapNavigationModel = terria.mapNavigationModel;
  const toolIsDifference = viewState.currentTool?.toolName === "Difference";
  const isDiffMode = viewState.isToolOpen && toolIsDifference;

  mapNavigationModel.addItem({
    id: "compassTool",
    name: "compass",
    render: <Compass terria={terria} viewState={viewState} />,
    location: "TOP",
    hideItem: false,
    pinned: true,
    order: 1,
    viewerMode: ViewerMode.Cesium,
    screenSize: "medium",
    height: 56,
    width: 56,
    itemRef: React.createRef()
  });
  mapNavigationModel.addItem({
    id: "zoomTool",
    name: "zoom",
    render: <ZoomControl terria={terria} />,
    location: "TOP",
    hideItem: false,
    pinned: true,
    order: 2,
    screenSize: "medium",
    height: 70,
    width: 24,
    itemRef: React.createRef()
  });

  const myLocation = new MyLocation({ terria });

  mapNavigationModel.addItem({
    id: "myLocationTool",
    name: "location.location",
    title: "location.centreMap",
    glyph: GLYPHS.geolocationThick,
    location: "TOP",
    hideItem: false,
    pinned: false,
    onClick: () => {
      myLocation.handleClick();
    },
    mapIconButtonProps: {
      get primary() {
        return myLocation.followMeEnabled();
      }
    },
    order: 3,
    height: 42,
    width: 32,
    itemRef: React.createRef()
  });

  mapNavigationModel.addItem({
    id: splitterNavigationName,
    name: "splitterTool.toggleSplitterToolTitle",
    title: isDiffMode
      ? "splitterTool.toggleSplitterToolDisabled"
      : "splitterTool.toggleSplitterTool",
    glyph:
      terria.showSplitter && !isDiffMode ? GLYPHS.splitterOn : GLYPHS.compare,
    location: "TOP",
    hideItem: false,
    mapIconButtonProps: {
      get disabled() {
        return isDiffMode;
      }
    },
    pinned: false,
    onClick: () => {
      runInAction(() => (terria.showSplitter = !terria.showSplitter));
    },
    render: <ToggleSplitterTool terria={terria} viewState={viewState} />,
    order: 4,
    height: 42,
    width: 32,
    itemRef: React.createRef()
  });

  const measureTool = new MeasureTool({
    terria,
    onClose: () => {
      runInAction(() => {
        viewState.panel = undefined;
      });
    }
  });

  mapNavigationModel.addItem({
    id: "measureTool",
    name: "measure.measureToolTitle",
    title: "measure.measureDistance",
    glyph: GLYPHS.measure,
    location: "TOP",
    hideItem: false,
    pinned: false,
    onClick: () => {
      measureTool.handleClick();
      /* runInAction(() => {
        viewState.panel = (
          <ResultPanel measureTool={measureToolSmall}></ResultPanel>
        );
      }); */
    },
    order: 5,
    height: 42,
    width: 32,
    itemRef: React.createRef()
  });

  mapNavigationModel.addItem({
    id: "FeedbackButton",
    name: "feedback.feedbackBtnText",
    title: "feedback.feedbackBtnText",
    glyph: GLYPHS.feedback,
    location: "BOTTOM",
    hideItem:
      isDefined(terria.configParameters.feedbackUrl) && viewState.hideMapUi()!,
    pinned: false,
    onClick: () =>
      runInAction(() => {
        viewState.feedbackFormIsVisible = true;
      }),
    screenSize: "medium",
    height: 42,
    width: 32,
    itemRef: React.createRef()
  });

  mapNavigationModel.addItem({
    id: "helpButton",
    name: "helpPanel.button",
    title: "helpPanel.button",
    glyph: GLYPHS.helpThick,
    location: "BOTTOM",
    hideItem: false,
    pinned: false,
    onClick: () => viewState.showHelpPanel(),

    mapIconButtonProps: {
      get expanded() {
        return viewState.featurePrompts.indexOf("help") >= 0;
      }
    },
    screenSize: "medium",
    height: 42,
    width: 32,
    itemRef: React.createRef()
  });
};

export const SPLITTER_ICON_NAME = "MapNavigationSplitterIcon";
