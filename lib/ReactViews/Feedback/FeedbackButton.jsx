"use strict";

import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { Medium } from "../Generic/Responsive";
import Icon from "../Icon";
import Styles from "./feedback-button.scss";
import { runInAction } from "mobx";

const FeedbackButton = observer(
  createReactClass({
    displayName: "FeedbackButton",

    propTypes: {
      viewState: PropTypes.object.isRequired,
      btnText: PropTypes.string.isRequired
    },

    onClick() {
      runInAction(() => {
        this.props.viewState.feedbackFormIsVisible = true;
      });
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
  })
);

module.exports = FeedbackButton;
