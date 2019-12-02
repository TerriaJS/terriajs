"use strict";

import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import MenuPanel from "../StandardUserInterface/customizable/MenuPanel.jsx";

import Styles from "./help-panel.scss";
import DropdownStyles from "../Map/Panels/panel.scss";
import helpIcon from "../../../wwwroot/images/icons/help.svg";

import getReactElementFromContents from "../ReactHelpers/getReactElementFromContents";
import { action } from "mobx";
import { observer } from "mobx-react";

@observer
class HelpMenuPanelBasic extends React.Component {
  static propTypes = {
    viewState: PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      isOpen: false
    };
  }

  @action.bound
  setShowHelpMenu(bool) {
    this.props.viewState.showHelpMenu = bool;
  }

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
          this.setShowHelpMenu(false);
        }}
        btnTitle="get help"
        onOpenChanged={this.setShowHelpMenu}
        // forceClosed={this.props.viewState.showSatelliteGuidance}
        smallScreen={this.props.viewState.useSmallScreenInterface}
      >
        <If condition={isOpen}>
          <div className={classNames(Styles.viewer, DropdownStyles.section)}>
            <label className={DropdownStyles.heading}>
              {getReactElementFromContents(
                this.props.viewState.language.HelpMenuHeader
              )}
            </label>
            <ul className={Styles.viewerSelector}>
              <li className={Styles.listItem}>
                <button
                  onClick={action(() => {
                    this.setShowHelpMenu(false);
                    this.props.viewState.showWelcomeMessage = true;
                    this.props.viewState.topElement = "WelcomeMessage";
                  })}
                  className={Styles.btnViewer}
                >
                  {getReactElementFromContents(
                    this.props.viewState.language.HelpMenuOpenWelcome
                  )}
                </button>
              </li>
              <li className={Styles.listItem}>
                <button
                  onClick={action(() => {
                    this.setShowHelpMenu(false);
                    this.props.viewState.showSatelliteGuidance = true;
                    this.props.viewState.topElement = "Guide";
                  })}
                  className={Styles.btnViewer}
                >
                  {getReactElementFromContents(
                    this.props.viewState.language.HelpMenuSatelliteGuideTitle
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
                    this.props.viewState.language.HelpMenuMoreHelpTitle
                  )}
                </a>
              </li>
            </ul>
          </div>
        </If>
      </MenuPanel>
    );
  }
}

export default HelpMenuPanelBasic;
