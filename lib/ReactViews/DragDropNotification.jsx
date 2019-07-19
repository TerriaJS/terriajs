"use strict";
import ObserveModelMixin from "./ObserveModelMixin";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import classNames from "classnames";
import Icon from "./Icon.jsx";
import Styles from "./drag-drop-notification.scss";

const DragDropNotification = createReactClass({
  displayName: "DragDropNotification",
  mixins: [ObserveModelMixin],
  propTypes: {
    viewState: PropTypes.object,
    lastUploadedFiles: PropTypes.array
  },

  notificationTimeout: null,

  getInitialState() {
    return {
      showNotification: false
    };
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillReceiveProps(newProps) {
    if (this.props.lastUploadedFiles !== newProps.lastUploadedFiles) {
      clearTimeout(this.notificationTimeout);
      // show notification, restart timer
      this.setState({
        showNotification: true
      });
      // initialise new time out
      this.notificationTimeout = setTimeout(() => {
        this.setState({
          showNotification: false
        });
      }, 5000);
    }
  },

  componentWillUnmount() {
    clearTimeout(this.notificationTimeout);
  },

  handleHover() {
    // reset timer on hover
    clearTimeout(this.notificationTimeout);
  },

  handleMouseLeave() {
    this.notificationTimeout = setTimeout(() => {
      this.setState({
        showNotification: false
      });
    }, 4000);
  },

  handleClick() {
    this.props.viewState.openUserData();
  },

  render() {
    const fileNames = this.props.lastUploadedFiles.join(",");
    return (
      <button
        className={classNames(Styles.notification, {
          [Styles.isActive]: this.state.showNotification && fileNames.length > 0
        })}
        onMouseEnter={this.handleHover}
        onMouseLeave={this.handleMouseLeave}
        onClick={this.handleClick}
      >
        <div className={Styles.icon}>
          <Icon glyph={Icon.GLYPHS.upload} />
        </div>
        <div className={Styles.info}>
          <span className={Styles.filename}>
            {'"'}
            {fileNames}
            {'"'}
          </span>{" "}
          {this.props.lastUploadedFiles.length > 1 ? "have" : "has"} been added
          to <span className={Styles.action}>My data</span>
        </div>
      </button>
    );
  }
});
module.exports = DragDropNotification;
