import clone from "terriajs-cesium/Source/Core/clone";
import defined from "terriajs-cesium/Source/Core/defined";
import DisclaimerHandler from "./DisclaimerHandler";
import getAncestors from "../Models/getAncestors";
import addedByUser from "../Core/addedByUser";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import MouseCoords from "./MouseCoords";
import SearchState from "./SearchState";
import "../Models/i18n.js";
export const DATA_CATALOG_NAME = "data-catalog";
export const USER_DATA_NAME = "my-data";

import { analyticsSetShowGuide } from "../ReactViews/Guide/Guide";
import { SATELLITE_GUIDE_KEY } from "../ReactViews/Guide/SatelliteGuide";
import { LOCAL_PROPERTY_KEY as WELCOME_PROPERTY_KEY } from "../ReactViews/WelcomeMessage/WelcomeMessage";

/**
 * Root of a global view model. Presumably this should get nested as more stuff goes into it. Basically this belongs to
 * the root of the UI and then it can choose to pass either the whole thing or parts down as props to its children.
 */

export default class ViewState {
  constructor(options) {
    const terria = options.terria;

    this.mobileViewOptions = Object.freeze({
      data: "data",
      preview: "preview",
      nowViewing: "nowViewing",
      locationSearchResults: "locationSearchResults"
    });

    this.searchState = new SearchState({
      terria: terria,
      catalogSearchProvider: options.catalogSearchProvider,
      locationSearchProviders: options.locationSearchProviders
    });

    this.terria = terria;
    this.previewedItem = undefined;
    this.userDataPreviewedItem = undefined;
    this.explorerPanelIsVisible = false;
    this.shareModalIsVisible = false;
    this.activeTabCategory = DATA_CATALOG_NAME;
    this.activeTabSubCategory = null; // Used to refer to an individual data-catalog tab
    this.isDraggingDroppingFile = false;
    this.mobileView = null;
    this.isMapFullScreen = false;
    this.myDataIsUploadView = true;

    /**
     * Gets or sets a value indicating whether the small screen (mobile) user interface should be used.
     * @type {Boolean}
     */
    this.useSmallScreenInterface = false;

    /**
     * Gets or sets a value indicating whether the feature info panel is visible.
     * @type {Boolean}
     */
    this.featureInfoPanelIsVisible = false;

    /**
     * Gets or sets a value indicating whether the feature info panel is collapsed.
     * When it's collapsed, only the title bar is visible.
     * @type {Boolean}
     */
    this.featureInfoPanelIsCollapsed = false;

    /**
     * True if this is (or will be) the first time the user has added data to the map.
     * @type {Boolean}
     */
    this.firstTimeAddingData = true;

    this.notifications = [];

    /**
     * Gets or sets a value indicating whether the feedback form is visible.
     * @type {Boolean}
     */
    this.feedbackFormIsVisible = false;

    this.myDataIsUploadView = true;

    this.mouseCoords = new MouseCoords();

    this.mobileMenuVisible = false;

    this.panelVisible = undefined;

    this.explorerPanelAnimating = false;

    this.topElement = "FeatureInfo";
    // recently uploaded files via drag and drop interface
    this.lastUploadedFiles = [];

    this.storyBuilderShown = false;

    // default value is null, because user has not made decision to show or
    // not show story
    // will be explicitly set to false when user 1. dismiss story
    // notification or 2. close a story
    this.storyShown = null;

    this.currentStoryId = 0;

    this.featurePrompts = [];

    /**
     * The tool that will appear in the tool panel.
     */
    this.currentTool = undefined;

    this._showHelpMenu = false;
    knockout.defineProperty(this, "showHelpMenu", {
      get: function() {
        return this._showHelpMenu;
      },
      set: function(bool) {
        this._showHelpMenu = bool;

        // Help menu has been opened, don't need to show a popup to highlight presence of it to the user again
        if (bool) {
          this.toggleFeaturePrompt("mapGuidesLocation", true, true);
        }
      }
    });

    this.showWelcomeMessage = this.terria.getLocalProperty(
      WELCOME_PROPERTY_KEY
    );

    this._showSatelliteGuidance = false;
    knockout.defineProperty(this, "showSatelliteGuidance", {
      get: function() {
        return this._showSatelliteGuidance;
      },
      set: function(bool) {
        this._showSatelliteGuidance = bool;
        analyticsSetShowGuide(bool, null, SATELLITE_GUIDE_KEY, this.terria);
      }
    });

    knockout.track(this, [
      "previewedItem",
      "catalogSearch",
      "explorerPanelIsVisible",
      "shareModalIsVisible",
      "activeTabCategory",
      "activeTabIdInCategory",
      "userDataPreviewedItem",
      "isDraggingDroppingFile",
      "mobileView",
      "useSmallScreenInterface",
      "featureInfoPanelIsVisible",
      "featureInfoPanelIsCollapsed",
      "notifications",
      "isMapFullScreen",
      "feedbackFormIsVisible",
      "myDataIsUploadView",
      "mobileMenuVisible",
      "panelVisible",
      "explorerPanelAnimating",
      "topElement",
      "lastUploadedFiles",
      "storyBuilderShown",
      "storyShown",
      "currentStoryId",
      "featurePrompts",
      "currentTool",
      "showWelcomeMessage",
      "_showSatelliteGuidance",
      "_showHelpMenu"
    ]);

    knockout.defineProperty(this, "chartIsOpen", {
      get: function() {
        const chartableItems = this.terria.catalog.chartableItems;
        const chartableColumnExists = chartableItems.some(
          item =>
            item.isEnabled && defined(item.chartData()) && !item.dontChartAlone
        );
        return chartableColumnExists;
      },
      set: function(value) {
        const chartableItems = this.terria.catalog.chartableItems;
        for (let i = chartableItems.length - 1; i >= 0; i--) {
          const item = chartableItems[i];
          if (item.isEnabled && defined(item.tableStructure)) {
            item.tableStructure.columns
              .filter(column => column.isActive === !value)
              .forEach(column => column.toggleActive());
          } else {
            // This seems weird, but if showOnChart isn't false on items
            // that don't have a tableStructure property the chart won't close
            // when using the chart close button (the x in the corner)
            item.showOnChart = false;
          }
        }
      }
    });

    // Show errors to the user as notifications.
    this._unsubscribeErrorListener = terria.error.addEventListener(e => {
      // Only add this error if an identical one doesn't already exist.
      if (
        this.notifications.filter(
          item => item.title === e.title && item.message === e.message
        ).length === 0
      ) {
        this.notifications.push(clone(e));
      }
    });

    // Reflect preview id from terria when loaded from an init source

    this._sharedFromExplorerPanelSubscription = knockout
      .getObservable(terria, "sharedFromExplorerPanel")
      .subscribe(sharedFromExplorerPanel => {
        if (defined(sharedFromExplorerPanel) && sharedFromExplorerPanel) {
          this.explorerPanelIsVisible = true;
        }
      }, this);

    this._previewedItemIdSubscription = knockout
      .getObservable(terria, "previewedItemId")
      .subscribe(previewedItemId => {
        if (
          defined(previewedItemId) &&
          terria.catalog.shareKeyIndex[previewedItemId]
        ) {
          this.viewCatalogMember(terria.catalog.shareKeyIndex[previewedItemId]);
        }
      }, this);

    // When features are picked, show the feature info panel.
    this._pickedFeaturesSubscription = knockout
      .getObservable(terria, "pickedFeatures")
      .subscribe(pickedFeatures => {
        if (defined(pickedFeatures)) {
          this.featureInfoPanelIsVisible = true;
          this.featureInfoPanelIsCollapsed = false;
        }
      }, this);

    const updateIsMapFullscreen = () => {
      this.isMapFullScreen =
        terria.userProperties.hideWorkbench === "1" ||
        terria.userProperties.hideExplorerPanel === "1";
      // if /#hideWorkbench=1 exists in url onload, show stories directly
      // any show/hide workbench will not automatically show story
      if (!defined(this.storyShown)) {
        // why only checkk config params here? because terria.stories are not
        // set at the moment, and that property will be checked in rendering
        // Here are all are checking are: is terria story enabled in this app?
        // if so we should show it when app first laod, if workbench is hiddne
        this.storyShown = terria.configParameters.storyEnabled;
      }
    };

    const updateIsStoryShown = () => {
      this.storyShown =
        terria.configParameters.storyEnabled &&
        Boolean(terria.userProperties.playStory);
    };

    this.terria.getUserProperty("hideWorkbench");
    this.terria.getUserProperty("hideExplorerPanel");

    this.terria.getUserProperty("playStory");

    this._userPropertiesHideWorkbenchSubscription = knockout
      .getObservable(terria.userProperties, "hideWorkbench")
      .subscribe(updateIsMapFullscreen);
    this._userPropertiesHideEPSubscription = knockout
      .getObservable(terria.userProperties, "hideExplorerPanel")
      .subscribe(updateIsMapFullscreen);

    this._userPropertiesShowStoriesSubscription = knockout
      .getObservable(terria.userProperties, "playStory")
      .subscribe(updateIsStoryShown);

    this._mobileMenuSubscription = knockout
      .getObservable(this, "mobileMenuVisible")
      .subscribe(mobileMenuVisible => {
        if (mobileMenuVisible) {
          this.explorerPanelIsVisible = false;
          this.switchMobileView(null);
        }
      });

    this._disclaimerHandler = new DisclaimerHandler(terria, this);

    this._storyPromptHandler = knockout
      .getObservable(this, "storyShown")
      .subscribe(storyShown => {
        if (storyShown === false) {
          // only show it once
          if (
            this.terria.configParameters.showFeaturePrompts &&
            !this.terria.getLocalProperty("storyPrompted")
          ) {
            this.toggleFeaturePrompt("story", true, false);
          }
        }
      });

    // When time-enabled-wms are added to the workbench, check if user has been shown guide
    this._shouldStartSatelliteGuidanceSubscription = knockout
      .getObservable(terria, "shouldStartSatelliteGuidance")
      .subscribe(shouldStartSatelliteGuidance => {
        if (shouldStartSatelliteGuidance) {
          if (
            this.terria.configParameters.showInAppGuides &&
            !this.terria.getLocalProperty("satelliteGuidancePrompted")
          ) {
            this.toggleFeaturePrompt("satelliteGuidance", true, true);
            this.showSatelliteGuidance = true;
          }
        }
      }, this);
  }

  dispose() {
    this._sharedFromExplorerPanelSubscription.dispose();
    this._previewedItemIdSubscription.dispose();
    this._pickedFeaturesSubscription.dispose();
    this._unsubscribeErrorListener();
    this._mobileMenuSubscription.dispose();
    this._userPropertiesHideWorkbenchSubscription.dispose();
    this._userPropertiesHideEPSubscription.dispose();
    this._disclaimerHandler.dispose();
    this._storyPromptHandler.dispose();
    this._shouldStartSatelliteGuidanceSubscription.dispose();
  }

  openAddData() {
    this.explorerPanelIsVisible = true;
    this.activeTabCategory = DATA_CATALOG_NAME;
    this.switchMobileView(this.mobileViewOptions.data);
  }

  openUserData() {
    this.explorerPanelIsVisible = true;
    this.activeTabCategory = USER_DATA_NAME;
  }

  viewingUserData() {
    return this.activeTabCategory === USER_DATA_NAME;
  }

  closeCatalog() {
    this.explorerPanelIsVisible = false;
    this.switchMobileView(null);
  }

  searchInCatalog(query) {
    this.openAddData();
    this.searchState.catalogSearchText = query;
    this.searchState.searchCatalog();
  }

  viewCatalogMember(catalogMember) {
    if (addedByUser(catalogMember)) {
      this.userDataPreviewedItem = catalogMember;
      this.openUserData();
    } else {
      this.previewedItem = catalogMember;
      this.openAddData();
      if (this.terria.configParameters.tabbedCatalog) {
        const ancestors = getAncestors(catalogMember);
        if (ancestors.length === 0) {
          this.activeTabIdInCategory = catalogMember.name;
        } else {
          // Go to specific tab
          this.activeTabIdInCategory = ancestors[0].name;
        }
      }
    }
  }

  switchMobileView(viewName) {
    this.mobileView = viewName;
  }

  getNextNotification() {
    return this.notifications[0];
  }

  hideMapUi() {
    return this.getNextNotification() && this.getNextNotification().hideUi;
  }

  showToolPanel() {
    return defined(this.currentTool);
  }

  toggleFeaturePrompt(feature, state, persistent = false) {
    const featureIndexInPrompts = this.featurePrompts.indexOf(feature);
    if (
      state &&
      featureIndexInPrompts < 0 &&
      !this.terria.getLocalProperty(`${feature}Prompted`)
    ) {
      this.featurePrompts.push(feature);
    } else if (!state && featureIndexInPrompts >= 0) {
      this.featurePrompts.splice(featureIndexInPrompts, 1);
    }
    if (persistent) {
      this.terria.setLocalProperty(`${feature}Prompted`, true);
    }
  }

  afterTerriaStarted() {
    if (this.terria.configParameters.openAddData) {
      this.openAddData();
    }
  }
}
