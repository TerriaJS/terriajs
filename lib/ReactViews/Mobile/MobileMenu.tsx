import React from "react";
import defined from "terriajs-cesium/Source/Core/defined";
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

@observer
class MobileMenu extends React.Component {
  static propTypes = {
    menuItems: PropTypes.arrayOf(PropTypes.element),
    menuLeftItems: PropTypes.arrayOf(PropTypes.element),
    viewState: PropTypes.object.isRequired,
    showFeedback: PropTypes.bool,
    terria: PropTypes.object.isRequired,
    i18n: PropTypes.object,
    allBaseMaps: PropTypes.array.isRequired,
    t: PropTypes.func.isRequired
  };

  static defaultProps = {
    menuItems: [],
    showFeedback: false
  };

  constructor(props: any) {
    super(props);
    this.state = {};
  }

  toggleMenu() {
    runInAction(() => {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.mobileMenuVisible =
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        !this.props.viewState.mobileMenuVisible;
    });
  }

  onFeedbackFormClick() {
    runInAction(() => {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.feedbackFormIsVisible = true;
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.mobileMenuVisible = false;
    });
  }

  hideMenu() {
    runInAction(() => {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.mobileMenuVisible = false;
    });
  }

  runStories() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.runStories();
  }

  dismissSatelliteGuidanceAction() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.toggleFeaturePrompt("mapGuidesLocation", true, true);
  }

  /**
   * If the help configuration defines an item named `mapuserguide`, this
   * method returns props for showing it in the mobile menu.
   */
  mapUserGuide() {
    // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
    const helpItems = this.props.terria.configParameters.helpContent;
    const mapUserGuideItem = helpItems?.find(
      ({
        itemName
      }: any) => itemName === "mapuserguide"
    );
    if (!mapUserGuideItem) {
      return undefined;
    }
    const title = applyTranslationIfExists(
      mapUserGuideItem.title,
      // @ts-expect-error TS(2339): Property 'i18n' does not exist on type 'Readonly<{... Remove this comment to see the full error message
      this.props.i18n
    );
    return {
      href: mapUserGuideItem.url,
      caption: title,
      onClick: () => {
        // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
        this.props.terria.analytics?.logEvent(
          Category.help,
          // @ts-expect-error TS(2339): Property 'itemSelected' does not exist on type 'ty... Remove this comment to see the full error message
          HelpAction.itemSelected,
          title
        );
      }
    };
  }

  render() {
    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t } = this.props;
    const hasStories =
      // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
      this.props.terria.configParameters.storyEnabled &&
      // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
      defined(this.props.terria.stories) &&
      // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
      this.props.terria.stories.length > 0;

    const mapUserGuide = this.mapUserGuide();

    // return this.props.viewState.mobileMenuVisible ? (
    return (
      <div>
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        {this.props.viewState.mobileMenuVisible && (
          <div className={Styles.overlay} onClick={() => this.toggleMenu()} />
        )}
        <div
          className={classNames(Styles.mobileNav, {
            // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
            [Styles.mobileNavHidden]: !this.props.viewState.mobileMenuVisible
          })}
        >
          // @ts-expect-error TS(2339): Property 'menuLeftItems' does not exist on type 'R... Remove this comment to see the full error message
          {this.props.menuLeftItems.map((menuItem: any) => <div
            onClick={() => this.hideMenu()}
            key={menuItem ? menuItem.key : undefined}
          >
            {menuItem}
          </div>)}
          <div onClick={() => this.hideMenu()}>
            <SettingPanel
              // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
              terria={this.props.terria}
              // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
              viewState={this.props.viewState}
            />
          </div>
          <div onClick={() => this.hideMenu()}>
            // @ts-expect-error TS(2739): Type is missing. Remove this comment to see the full error message
            <SharePanel
              // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
              terria={this.props.terria}
              // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
              viewState={this.props.viewState}
            />
          </div>
          // @ts-expect-error TS(2339): Property 'menuItems' does not exist on type 'Reado... Remove this comment to see the full error message
          {this.props.menuItems.map((menuItem: any) => <div
            onClick={() => this.hideMenu()}
            key={menuItem ? menuItem.key : undefined}
          >
            {menuItem}
          </div>)}
          // @ts-expect-error TS(2741): Property 'icon' is missing in type. Remove this comment to see the full error message
          {mapUserGuide && <MobileMenuItem {...mapUserGuide} />}
          // @ts-expect-error TS(2339): Property 'showFeedback' does not exist on type 'Re... Remove this comment to see the full error message
          {this.props.showFeedback && (
            // @ts-expect-error TS(2741): Property 'icon' is missing in type '{ onClick: () ... Remove this comment to see the full error message
            <MobileMenuItem
              onClick={() => this.onFeedbackFormClick()}
              caption={t("feedback.feedbackBtnText")}
            />
          )}
          {hasStories && (
            // @ts-expect-error TS(2741): Property 'icon' is missing in type '{ onClick: () ... Remove this comment to see the full error message
            <MobileMenuItem
              onClick={() => this.runStories()}
              caption={t("story.mobileViewStory", {
                // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
                storiesLength: this.props.terria.stories.length
              })}
            />
          )}
          // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
          {this.props.terria.configParameters.languageConfiguration
            ?.enabled && (
            <div onClick={() => this.hideMenu()}>
              <LangPanel
                // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
                terria={this.props.terria}
                // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                smallScreen={this.props.viewState.useSmallScreenInterface}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default withTranslation()(MobileMenu);
