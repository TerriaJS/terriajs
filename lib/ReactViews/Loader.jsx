"use strict";
import ObserveModelMixin from "./ObserveModelMixin";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import Icon from "./Icon";
import { withTranslation } from "react-i18next";

import Styles from "./loader.scss";

const Loader = createReactClass({
  displayName: "Loader",
  mixins: [ObserveModelMixin],

  getDefaultProps() {
    return {
      className: "",
      message: "Loading..."
    };
  },

  propTypes: {
    message: PropTypes.string,
    className: PropTypes.string,
    t: PropTypes.func.isRequired
  },

  render() {
    const { t } = this.props;
    return (
      <span className={Styles.loader}>
        <Icon glyph={Icon.GLYPHS.loader} />
        <span>{this.props.message || t("loader.loadingMessage")}</span>
      </span>
    );
  }
});
module.exports = withTranslation()(Loader);
