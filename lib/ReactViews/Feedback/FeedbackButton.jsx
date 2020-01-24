"use strict";

import ObserveModelMixin from "../ObserveModelMixin";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import Styles from "./feedback-button.scss";
import { Medium } from "../Generic/Responsive";
import Icon from "../Icon.jsx";

const FeedbackButton = createReactClass({
  displayName: "FeedbackButton",
  mixins: [ObserveModelMixin],

  propTypes: {
    viewState: PropTypes.object.isRequired,
    btnText: PropTypes.string.isRequired
  },

  onClick() {
    this.props.viewState.feedbackFormIsVisible = true;
  },

  render() {
    return (
      <div className={Styles.feedback}>
        <button
          type="button"
          className={Styles.btnFeedback}
          onClick={this.onClick}
        >
          <Icon glyph={Icon.GLYPHS.feedback} />
          <Medium>
            <span>{this.props.btnText}</span>
          </Medium>
        </button>
      </div>
    );
  }
});

module.exports = FeedbackButton;
