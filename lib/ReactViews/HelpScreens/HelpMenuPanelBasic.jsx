"use strict";

import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import ObserveModelMixin from "../ObserveModelMixin";
import classNames from "classnames";
import MenuPanel from "../StandardUserInterface/customizable/MenuPanel.jsx";

import Styles from "./help-panel.scss";
import DropdownStyles from "../Map/Panels/panel.scss";
import helpIcon from "../../../wwwroot/images/icons/help.svg";

import getReactElementFromContents from "../ReactHelpers/getReactElementFromContents";

const HelpMenuPanelBasic = createReactClass({
  displayName: "HelpMenuPanelBasic",
  mixins: [ObserveModelMixin],

  propTypes: {
    viewState: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      isOpen: false
    };
  },

  toggleShowHelpMenu(bool) {
    this.props.viewState.showHelpMenu = bool;
  },

  onOpenChanged(open) {
    this.toggleShowHelpMenu(open);
    this.setState({
      isOpen: open
    });
  },

  render() {
    const dropdownTheme = {
      btn: Styles.btnShare,
      outer: Styles.sharePanel,
      inner: Styles.dropdownInner,
      icon: helpIcon
    };
    const isOpen = this.props.viewState.showHelpMenu;

    return (
      <MenuPanel
        theme={dropdownTheme}
        btnText="Help"
        viewState={this.props.viewState}
        isOpen={isOpen}
        onDismissed={() => {
          this.toggleShowHelpMenu(false);
        }}
        btnTitle="get help"
        onOpenChanged={this.onOpenChanged}
        // forceClosed={this.props.viewState.showSatelliteGuidance}
        smallScreen={this.props.viewState.useSmallScreenInterface}
      >
        <If condition={isOpen}>
          <div className={classNames(Styles.viewer, DropdownStyles.section)}>
            <label className={DropdownStyles.heading}>
              {getReactElementFromContents(
                this.props.viewState.terria.language.HelpMenuHeader
              )}
            </label>
            <ul className={Styles.viewerSelector}>
              <li className={Styles.listItem}>
                <button
                  onClick={() => {
                    this.toggleShowHelpMenu(false);
                    this.props.viewState.showWelcomeMessage = true;
                  }}
                  className={Styles.btnViewer}
                >
                  {getReactElementFromContents(
                    this.props.viewState.terria.language.HelpMenuOpenWelcome
                  )}
                </button>
              </li>
              <li className={Styles.listItem}>
                <button
                  onClick={() => {
                    this.toggleShowHelpMenu(false);
                    this.props.viewState.showSatelliteGuidance = true;
                  }}
                  className={Styles.btnViewer}
                >
                  {getReactElementFromContents(
                    this.props.viewState.terria.language
                      .HelpMenuSatelliteGuideTitle
                  )}
                </button>
              </li>
              <li className={Styles.listItem}>
                <a
                  target="_blank"
                  href="./help/help.html"
                  className={Styles.btnViewer}
                >
                  {getReactElementFromContents(
                    this.props.viewState.terria.language.HelpMenuMoreHelpTitle
                  )}
                </a>
              </li>
            </ul>
          </div>
        </If>
      </MenuPanel>
    );
  }
});

export default HelpMenuPanelBasic;
