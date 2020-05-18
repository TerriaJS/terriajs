"use strict";
import React from "react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";
import Styles from "./branding.scss";

const Branding = createReactClass({
  propTypes: {
    terria: PropTypes.object.isRequired,
    version: PropTypes.string,
    onClick: PropTypes.func
  },

  render() {
    return (
      <div className={Styles.branding}>
        <img src="images/receipt-logo.png" className="{Styles.logo}" />
      </div>
    );
  }
});

module.exports = Branding;
