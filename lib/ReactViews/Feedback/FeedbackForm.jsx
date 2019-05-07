"use strict";

import ObserveModelMixin from "../ObserveModelMixin";
import React from "react";
import createReactClass from "create-react-class";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import PropTypes from "prop-types";
import sendFeedback from "../../Models/sendFeedback.js";
import Styles from "./feedback-form.scss";
import Icon from "../Icon.jsx";
import classNames from "classnames";

const FeedbackForm = createReactClass({
  displayName: "FeedbackForm",
  mixins: [ObserveModelMixin],

  propTypes: {
    viewState: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      isSending: false,
      sendShareURL: true,
      name: "",
      email: "",
      comment: ""
    };
  },

  componentDidMount() {
    this.escKeyListener = e => {
      if (e.keyCode === 27) {
        this.onDismiss();
      }
    };
    window.addEventListener("keydown", this.escKeyListener, true);
  },

  componentWillUnmount() {
    // Feedback form stays mounted, but leave this in to ensure it gets cleaned up if that ever changes
    window.removeEventListener("keydown", this.escKeyListener, true);
  },

  onDismiss() {
    this.props.viewState.feedbackFormIsVisible = false;
    this.setState(this.getInitialState());
  },

  onSubmit(evt) {
    evt.preventDefault();

    if (this.state.comment.length > 0) {
      this.setState({
        isSending: true
      });

      // submit form
      sendFeedback({
        terria: this.props.viewState.terria,
        name: this.state.name,
        email: this.state.email,
        sendShareURL: this.state.sendShareURL,
        comment: this.state.comment
      }).then(succeeded => {
        if (succeeded) {
          this.setState({
            isSending: false,
            comment: ""
          });
          this.props.viewState.feedbackFormIsVisible = false;
        } else {
          this.setState({
            isSending: false
          });
        }
      });
    }

    return false;
  },

  handleChange(e) {
    this.setState({
      [e.target.getAttribute("name")]: e.target.value
    });
  },

  changeSendShareUrl(e) {
    this.setState({
      sendShareURL: !this.state.sendShareURL
    });
  },

  render() {
    const preamble = parseCustomMarkdownToReact(
      this.props.viewState.terria.configParameters.feedbackPreamble ||
        "We would love to hear from you!"
    );
    const feedbackFormClassNames = classNames(Styles.form, {
      [Styles.isOpen]: this.props.viewState.feedbackFormIsVisible
    });
    return (
      <div className="feedback__inner">
        <div className={feedbackFormClassNames}>
          <div className={Styles.header}>
            <h4 className={Styles.title}>Feedback</h4>
            <button
              className={Styles.btnClose}
              onClick={this.onDismiss}
              title="close feedback"
            >
              <Icon glyph={Icon.GLYPHS.close} />
            </button>
          </div>
          <form onSubmit={this.onSubmit}>
            <div className={Styles.description}>{preamble}</div>
            <label className={Styles.label}>Your name (optional)</label>
            <input
              type="text"
              name="name"
              className={Styles.field}
              value={this.state.name}
              onChange={this.handleChange}
            />
            <label className={Styles.label}>
              Email address (optional)
              <br />
              <em>We can&#39;t follow up without it!</em>
            </label>
            <input
              type="text"
              name="email"
              className={Styles.field}
              value={this.state.email}
              onChange={this.handleChange}
            />
            <label className={Styles.label}>Comment or question</label>
            <textarea
              className={Styles.field}
              name="comment"
              value={this.state.comment}
              onChange={this.handleChange}
            />
            <div className={Styles.shareUrl}>
              <button onClick={this.changeSendShareUrl} type="button">
                {this.state.sendShareURL ? (
                  <Icon glyph={Icon.GLYPHS.checkboxOn} />
                ) : (
                  <Icon glyph={Icon.GLYPHS.checkboxOff} />
                )}
                Share my map view with {this.props.viewState.terria.appName}{" "}
                developers
                <br />
                <small>
                  This helps us to troubleshoot issues by letting us see what
                  you&#39;re seeing
                </small>
              </button>
            </div>
            <div className={Styles.action}>
              <button
                type="button"
                className={Styles.btnCancel}
                onClick={this.onDismiss}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={Styles.btnSubmit}
                disabled={this.state.isSending}
              >
                {this.state.isSending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
});

module.exports = FeedbackForm;
