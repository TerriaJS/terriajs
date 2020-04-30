const create: any = require("react-test-renderer").create;
import React from "react";
import { act } from "react-dom/test-utils";
import { ThemeProvider } from "styled-components";
import { terriaTheme } from "../../../../../lib/ReactViews/StandardUserInterface/StandardTheme";
import Terria from "../../../../../lib/Models/Terria";
import ViewState from "../../../../../lib/ReactViewModels/ViewState";
import HelpPanel from "../../../../../lib/ReactViews/Map/Panels/HelpPanel/HelpPanel";
import HelpPanelItem from "../../../../../lib/ReactViews/Map/Panels/HelpPanel/HelpPanelItem";
import HelpVideoPanel from "../../../../../lib/ReactViews/Map/Panels/HelpPanel/HelpVideoPanel";
import Text from "../../../../../lib/Styled/Text";
import StyledHtml from "../../../../../lib/ReactViews/Map/Panels/HelpPanel/StyledHtml";
import { runInAction } from "mobx";
import Icon from "../../../../../lib/ReactViews/Icon";

describe("HelpPanel", function() {
  let terria: Terria;
  let viewState: ViewState;

  let testRenderer: any;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: null,
      locationSearchProviders: []
    });
  });

  describe("with no help content in config", function() {
    it("does not render any items in help", function() {
      act(() => {
        testRenderer = create(
          <ThemeProvider theme={terriaTheme}>
            <HelpPanel terria={terria} viewState={viewState} />
          </ThemeProvider>
        );
      });

      const helpItems = testRenderer.root.findAllByType(HelpPanelItem);
      expect(helpItems.length).toBeFalsy();
    });
  });

  describe("with no text, icon, videos and images in helpContent", function() {
    beforeEach(() => {
      runInAction(() => {
        terria.configParameters.helpContent = [
          {
            itemName: "test"
          }
        ];
      });
      act(() => {
        testRenderer = create(
          <ThemeProvider theme={terriaTheme}>
            <HelpPanel terria={terria} viewState={viewState} />
          </ThemeProvider>
        );
      });
    });

    it("renders 1 help menu item", function() {
      const helpItems = testRenderer.root.findAllByType(HelpPanelItem);
      expect(helpItems.length).toBe(1);
    });

    it("renders the default start icon", function() {
      const helpItem = testRenderer.root.findByType(HelpPanelItem);
      const menuIcon = helpItem.findByType(Icon);
      // Not sure how to compare icons so I just used the gylph.id
      expect(menuIcon.props.glyph.id).toBe("getting-started-icon");
    });

    it("does not render any text on the help menu buttons", function() {
      const helpItem = testRenderer.root.findByType(HelpPanelItem);
      expect(() => {
        helpItem.findByType(Text);
      }).toThrow();
    });

    it("does not render any text in video panel", function() {
      const videoPanel = testRenderer.root.findByType(HelpVideoPanel);
      expect(videoPanel.props.htmlContent).toBeFalsy();
      expect(() => {
        videoPanel.findByType(StyledHtml);
      }).toThrow();
    });

    it("does not render any images in video panel", function() {
      const videoPanel = testRenderer.root.findByType(HelpVideoPanel);
      expect(() => {
        videoPanel.findByProps({ className: "tjs-help-panel__video-panel" });
      }).toThrow();
    });
  });
});
