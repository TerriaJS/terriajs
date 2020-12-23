"use strict";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import Icon, { StyledIcon } from "./Icon";
import { withTranslation } from "react-i18next";
import classNames from "classnames";
import Styles from "./loader.scss";

const Loader = createReactClass({
  displayName: "Loader",

  getDefaultProps() {
    return {
      className: "",
      message: "Loading..."
    };
  },

  propTypes: {
    message: PropTypes.string,
    className: PropTypes.string,
    light: PropTypes.bool,
    t: PropTypes.func.isRequired
  },

  render() {
    const { message, className, t, ...iconProps } = this.props;
    return (
      <span className={classNames(Styles.loader, className)}>
        <StyledIcon {...iconProps} glyph={Icon.GLYPHS.loader} />
        <span>{message || t("loader.loadingMessage")}</span>
      </span>
    );
  }
});
module.exports = withTranslation()(Loader);
