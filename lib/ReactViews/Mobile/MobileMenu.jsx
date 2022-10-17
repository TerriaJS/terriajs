import React from "react";
import defined from "terriajs-cesium/Source/Core/defined";
import createReactClass from "create-react-class";
import { observer } from "mobx-react";

import PropTypes from "prop-types";

import classNames from "classnames";
import MobileMenuItem from "./MobileMenuItem";
import SettingPanel from "../Map/Panels/SettingPanel";
import SharePanel from "../Map/Panels/SharePanel/SharePanel";
import { withTranslation } from "react-i18next";

import Styles from "./mobile-menu.scss";
import { runInAction } from "mobx";
import LangPanel from "../Map/Panels/LangPanel/LangPanel";
import { applyTranslationIfExists } from "../../Language/languageHelpers";
import { Category, HelpAction } from "../../Core/AnalyticEvents/analyticEvents";

const MobileMenu = observer(
  createReactClass({
    displayName: "MobileMenu",

    propTypes: {
      menuItems: PropTypes.arrayOf(PropTypes.element),
      menuLeftItems: PropTypes.arrayOf(PropTypes.element),
      viewState: PropTypes.object.isRequired,
      showFeedback: PropTypes.bool,
      terria: PropTypes.object.isRequired,
      i18n: PropTypes.object,
      allBaseMaps: PropTypes.array.isRequired,
      t: PropTypes.func.isRequired
    },

    getDefaultProps() {
      return {
        menuItems: [],
        showFeedback: false
      };
    },

    toggleMenu() {
      runInAction(() => {
        this.props.viewState.mobileMenuVisible =
          !this.props.viewState.mobileMenuVisible;
      });
    },

    getInitialState() {
      return {};
    },

    onFeedbackFormClick() {
      runInAction(() => {
        this.props.viewState.feedbackFormIsVisible = true;
        this.props.viewState.mobileMenuVisible = false;
      });
    },

    hideMenu() {
      runInAction(() => {
        this.props.viewState.mobileMenuVisible = false;
      });
    },

    runStories() {
      this.props.viewState.runStories();
    },

    dismissSatelliteGuidanceAction() {
      this.props.viewState.toggleFeaturePrompt("mapGuidesLocation", true, true);
    },

    /**
     * If the help configuration defines an item named `mapuserguide`, this
     * method returns props for showing it in the mobile menu.
     */
    mapUserGuide() {
      const helpItems = this.props.terria.configParameters.helpContent;
      const mapUserGuideItem = helpItems?.find(
        ({ itemName }) => itemName === "mapuserguide"
      );
      if (!mapUserGuideItem) {
        return undefined;
      }
      const title = applyTranslationIfExists(
        mapUserGuideItem.title,
        this.props.i18n
      );
      return {
        href: mapUserGuideItem.url,
        caption: title,
        onClick: () => {
          this.props.terria.analytics?.logEvent(
            Category.help,
            HelpAction.itemSelected,
            title
          );
        }
      };
    },

    render() {
      const { t } = this.props;
      const hasStories =
        this.props.terria.configParameters.storyEnabled &&
        defined(this.props.terria.stories) &&
        this.props.terria.stories.length > 0;

      const mapUserGuide = this.mapUserGuide();

      // return this.props.viewState.mobileMenuVisible ? (
      return (
        <div>
          <If condition={this.props.viewState.mobileMenuVisible}>
            <div className={Styles.overlay} onClick={this.toggleMenu} />
          </If>
          <div
            className={classNames(Styles.mobileNav, {
              [Styles.mobileNavHidden]: !this.props.viewState.mobileMenuVisible
            })}
          >
            <For each="menuItem" of={this.props.menuLeftItems}>
              <div
                onClick={this.hideMenu}
                key={menuItem ? menuItem.key : undefined}
              >
                {menuItem}
              </div>
            </For>
            <div onClick={this.hideMenu}>
              <SettingPanel
                terria={this.props.terria}
                viewState={this.props.viewState}
              />
            </div>
            <div onClick={this.hideMenu}>
              <SharePanel
                terria={this.props.terria}
                viewState={this.props.viewState}
              />
            </div>
            <For each="menuItem" of={this.props.menuItems}>
              <div
                onClick={this.hideMenu}
                key={menuItem ? menuItem.key : undefined}
              >
                {menuItem}
              </div>
            </For>
            {mapUserGuide && <MobileMenuItem {...mapUserGuide} />}
            <If condition={this.props.showFeedback}>
              <MobileMenuItem
                onClick={this.onFeedbackFormClick}
                caption={t("feedback.feedbackBtnText")}
              />
            </If>
            <If condition={hasStories}>
              <MobileMenuItem
                onClick={this.runStories}
                caption={t("story.mobileViewStory", {
                  storiesLength: this.props.terria.stories.length
                })}
              />
            </If>
            <If
              condition={
                this.props.terria.configParameters.languageConfiguration
                  ?.enabled
              }
            >
              <div onClick={this.hideMenu}>
                <LangPanel
                  terria={this.props.terria}
                  smallScreen={this.props.viewState.useSmallScreenInterface}
                />
              </div>
            </If>
          </div>
        </div>
      );
    }
  })
);

export default withTranslation()(MobileMenu);
