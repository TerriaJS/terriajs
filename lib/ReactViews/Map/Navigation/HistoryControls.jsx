"use strict";
import React from "react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";
import { withTranslation } from "react-i18next";
import HistoryControls from "../../../Models/HistoryControls";
import Icon from "../../Icon.jsx";
import StylesToolButton from "./history-controls.scss";
import Styles from "../map-navigation.scss";

const HistoryControl = createReactClass({
  propTypes: {
    terria: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      backDisabled: true,
      forwardDisabled: true
    };
  },

  componentDidMount() {
    this.position;
    this.orientation = {
      heading: 0,
      pitch: 0,
      roll: 0
    };
    this.historyControls = new HistoryControls({
      terria: this.props.terria,
      updateButtonState: this.updateButtonState
    });
    this.historyControls.addUpdateSubscription();
  },

  updateButtonState(disableBack, disableForward) {
    this.setState({
      backDisabled: disableBack,
      forwardDisabled: disableForward
    });
  },

  goBack() {
    return this.historyControls.goBack();
  },

  goForward() {
    return this.historyControls.goForward();
  },

  render() {
    const { t } = this.props;
    return [
      <div className={Styles.control} key="back-arrow">
        <div className={StylesToolButton.toolButton}>
          <button
            type="button"
            onClick={this.goBack}
            className={StylesToolButton.btn}
            title={t("historyControl.back")}
            disabled={this.state.backDisabled}
          >
            <Icon glyph={Icon.GLYPHS.arrowBack} />
          </button>
        </div>
      </div>,
      <div className={Styles.control} key="forward-arrow">
        <div className={StylesToolButton.toolButton}>
          <button
            type="button"
            onClick={this.goForward}
            className={StylesToolButton.btn}
            title={t("historyControl.forward")}
            disabled={this.state.forwardDisabled}
          >
            <Icon glyph={Icon.GLYPHS.arrowForward} />
          </button>
        </div>
      </div>
    ];
  }
});

module.exports = withTranslation()(HistoryControl);
