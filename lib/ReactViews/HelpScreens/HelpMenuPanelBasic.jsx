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

import { withTranslation } from "react-i18next";

const HelpMenuPanelBasic = createReactClass({
  displayName: "HelpMenuPanelBasic",
  mixins: [ObserveModelMixin],

  propTypes: {
    viewState: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
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

    const { t } = this.props;

    return (
      <MenuPanel
        theme={dropdownTheme}
        btnText={t("helpMenu.btnText")}
        viewState={this.props.viewState}
        isOpen={isOpen}
        onDismissed={() => {
          this.toggleShowHelpMenu(false);
        }}
        btnTitle={t("helpMenu.btnTitle")}
        onOpenChanged={this.onOpenChanged}
        // forceClosed={this.props.viewState.showSatelliteGuidance}
        smallScreen={this.props.viewState.useSmallScreenInterface}
      >
        <If condition={isOpen}>
          <div className={classNames(Styles.viewer, DropdownStyles.section)}>
            <label className={DropdownStyles.heading}>
              {t("helpMenu.helpMenuHeader")}
            </label>
            <ul className={Styles.viewerSelector}>
              <li className={Styles.listItem}>
                <button
                  onClick={() => {
                    this.toggleShowHelpMenu(false);
                    this.props.viewState.showWelcomeMessage = true;
                    this.props.viewState.topElement = "WelcomeMessage";
                  }}
                  className={Styles.btnViewer}
                >
                  {t("helpMenu.helpMenuOpenWelcome")}
                </button>
              </li>
              <li className={Styles.listItem}>
                <button
                  onClick={() => {
                    this.toggleShowHelpMenu(false);
                    this.props.viewState.showSatelliteGuidance = true;
                    this.props.viewState.topElement = "Guide";
                  }}
                  className={Styles.btnViewer}
                >
                  {t("helpMenu.helpMenuSatelliteGuideTitle")}
                </button>
              </li>
              <li className={Styles.listItem}>
                <a
                  target="_blank"
                  href="./help/help.html"
                  className={Styles.btnViewer}
                >
                  {t("helpMenu.helpMenuMoreHelpTitle")}
                </a>
              </li>
            </ul>
          </div>
        </If>
      </MenuPanel>
    );
  }
});

export default withTranslation()(HelpMenuPanelBasic);
