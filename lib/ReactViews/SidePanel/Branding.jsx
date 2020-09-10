"use strict";
import React from "react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";
import Styles from "./branding.scss";

const Branding = createReactClass({
  propTypes: {
    terria: PropTypes.object.isRequired
  },

  render() {
    return (
      <div className={Styles.branding}>
        <img
          src={require("../../../wwwroot/images/receipt-blue-logo.png")}
          className="{Styles.logo}"
        />
      </div>
    );
  }
});

module.exports = Branding;
