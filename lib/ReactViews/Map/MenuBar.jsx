import React from "react";
import triggerResize from "../../Core/triggerResize";
import createReactClass from "create-react-class";

import PropTypes from "prop-types";
import classNames from "classnames";
import SettingPanel from "./Panels/SettingPanel";
import SharePanel from "./Panels/SharePanel/SharePanel";
import ToolsPanel from "./Panels/ToolsPanel/ToolsPanel";
import Icon from "../Icon";
import Prompt from "../Generic/Prompt";
import Styles from "./menu-bar.scss";
import { runInAction } from "mobx";

// The map navigation region
const MenuBar = createReactClass({
  displayName: "MenuBar",

  propTypes: {
    terria: PropTypes.object,
    viewState: PropTypes.object.isRequired,
    allBaseMaps: PropTypes.array, // Not implemented yet
    animationDuration: PropTypes.number,
    menuItems: PropTypes.arrayOf(PropTypes.element)
  },

  getDefaultProps() {
    return {
      menuItems: []
    };
  },

  handleClick() {
    runInAction(() => {
      this.props.viewState.topElement = "MenuBar";
    });
  },

  onStoryButtonClick() {
    runInAction(() => {
      this.props.viewState.storyBuilderShown = !this.props.viewState
        .storyBuilderShown;
    });
    this.props.terria.currentViewer.notifyRepaintRequired();
    // Allow any animations to finish, then trigger a resize.
    setTimeout(function() {
      triggerResize();
    }, this.props.animationDuration || 1);
    this.props.viewState.toggleFeaturePrompt("story", false, true);
  },
  dismissAction() {
    this.props.viewState.toggleFeaturePrompt("story", false, true);
  },
  dismissSatelliteGuidanceAction() {
    this.props.viewState.toggleFeaturePrompt("mapGuidesLocation", true, true);
  },
  render() {
    const satelliteGuidancePrompted = this.props.terria.getLocalProperty(
      "satelliteGuidancePrompted"
    );
    const mapGuidesLocationPrompted = this.props.terria.getLocalProperty(
      "mapGuidesLocationPrompted"
    );
    const storyEnabled = this.props.terria.configParameters.storyEnabled;
    const enableTools = this.props.terria.getUserProperty("tools") === "1";

    const promptHtml =
      this.props.terria.stories.length > 0 ? (
        <div>You can view and create stories at any time by clicking here.</div>
      ) : (
        <div>
          <small>INTRODUCING</small>
          <h3>Data Stories</h3>
          <div>
            Create and share interactive stories directly from your map.
          </div>
        </div>
      );
    const delayTime =
      storyEnabled && this.props.terria.stories.length > 0 ? 1000 : 2000;
    return (
      <div
        className={classNames(
          Styles.menuArea,
          this.props.viewState.topElement === "MenuBar" ? "top-element" : ""
        )}
        onClick={this.handleClick}
      >
        <ul className={Styles.menu}>
          <If condition={storyEnabled}>
            <li className={Styles.menuItem}>
              <button
                className={Styles.storyBtn}
                type="button"
                onClick={this.onStoryButtonClick}
              >
                <Icon glyph={Icon.GLYPHS.story} />
                <span>Story</span>
              </button>
              {storyEnabled &&
                this.props.viewState.featurePrompts.indexOf("story") >= 0 && (
                  <Prompt
                    content={promptHtml}
                    displayDelay={delayTime}
                    dismissText={"Got it, thanks!"}
                    dismissAction={this.dismissAction}
                  />
                )}
            </li>
          </If>
          <li className={Styles.menuItem}>
            <SettingPanel
              terria={this.props.terria}
              viewState={this.props.viewState}
            />
          </li>
          <li className={Styles.menuItem}>
            <SharePanel
              terria={this.props.terria}
              viewState={this.props.viewState}
            />
          </li>
          <li className={Styles.menuItem}>
            <HelpMenuPanelBasic
              terria={this.props.terria}
              viewState={this.props.viewState}
            />
            {satelliteGuidancePrompted &&
              !mapGuidesLocationPrompted &&
              !this.props.viewState.showSatelliteGuidance && (
                <Prompt
                  content={
                    <div>
                      You can access map guides at any time by looking in the{" "}
                      <strong>help menu</strong>.
                    </div>
                  }
                  displayDelay={1000}
                  dismissText={"Got it, thanks!"}
                  dismissAction={this.dismissSatelliteGuidanceAction}
                />
              )}
          </li>
          {enableTools && (
            <li className={Styles.menuItem}>
              <ToolsPanel
                terria={this.props.terria}
                viewState={this.props.viewState}
              />
            </li>
          )}
          <If condition={!this.props.viewState.useSmallScreenInterface}>
            <For each="element" of={this.props.menuItems} index="i">
              <li className={Styles.menuItem} key={i}>
                {element}
              </li>
            </For>
          </If>
        </ul>
      </div>
    );
  }
});

export default MenuBar;
