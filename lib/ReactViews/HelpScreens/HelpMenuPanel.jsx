"use strict";

import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import ObserveModelMixin from "../ObserveModelMixin";
import defined from "terriajs-cesium/Source/Core/defined";
import classNames from "classnames";
import MenuPanel from "../StandardUserInterface/customizable/MenuPanel.jsx";

import Styles from "./help-panel.scss";
import DropdownStyles from "../Map/Panels/panel.scss";
import helpIcon from "../../../wwwroot/images/icons/help.svg";
import { withTranslation } from "react-i18next";

const HelpMenuPanel = createReactClass({
  displayName: "HelpMenuPanel",
  mixins: [ObserveModelMixin],

  propTypes: {
    helpViewState: PropTypes.object.isRequired,
    helpSequences: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
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

  help(sequence) {
    this.props.helpViewState.currentSequence = sequence;
  },

  render() {
    const dropdownTheme = {
      btn: Styles.btnShare,
      outer: Styles.sharePanel,
      inner: Styles.dropdownInner,
      icon: helpIcon
    };

    const { t } = this.props;

    return (
      <MenuPanel
        theme={dropdownTheme}
        btnText={t("helpMenu.btnText")}
        viewState={this.props.viewState}
        isOpen={this.state.isOpen}
        btnTitle={t("helpMenu.btnTitle")}
        onOpenChanged={this.onOpenChanged}
        forceClosed={defined(this.props.helpViewState.currentSequence)}
        smallScreen={this.props.viewState.useSmallScreenInterface}
      >
        <If condition={this.state.isOpen}>
          <div className={classNames(Styles.viewer, DropdownStyles.section)}>
            <label className={DropdownStyles.heading}>
              {this.props.helpSequences.menuTitle}
            </label>
            <ul className={Styles.viewerSelector}>
              <For
                each="sequence"
                index="i"
                of={this.props.helpSequences.sequences}
              >
                <li key={i} className={Styles.listItem}>
                  <button
                    onClick={this.help.bind(this, { sequence }.sequence)}
                    className={Styles.btnViewer}
                  >
                    {sequence.title}
                  </button>
                </li>
              </For>
            </ul>
          </div>
        </If>
      </MenuPanel>
    );
  }
});

export default withTranslation()(HelpMenuPanel);
