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

  onOpenChanged(open) {
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

    return (
      <MenuPanel
        theme={dropdownTheme}
        btnText="Help"
        viewState={this.props.viewState}
        isOpen={this.state.isOpen}
        btnTitle="get help"
        onOpenChanged={this.onOpenChanged}
        forceClosed={this.props.viewState.showSatelliteGuidance}
        smallScreen={this.props.viewState.useSmallScreenInterface}
      >
        <If condition={this.state.isOpen}>
          <div className={classNames(Styles.viewer, DropdownStyles.section)}>
            <label className={DropdownStyles.heading}>
              What would you like to do?
            </label>
            <ul className={Styles.viewerSelector}>
              <li className={Styles.listItem}>
                <button
                  onClick={() =>
                    (this.props.viewState.showSatelliteGuidance = true)
                  }
                  className={Styles.btnViewer}
                >
                  View satellite imagery guide
                </button>
              </li>
              <li className={Styles.listItem}>
                <a
                  target="_blank"
                  href="./help/help.html"
                  className={Styles.btnViewer}
                >
                  More help
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
