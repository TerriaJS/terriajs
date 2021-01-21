"use strict";
import React from "react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";
import Styles from "./Branding.scss";
import { RCChangeUrlParams } from "../../Models/Receipt";

const Branding = createReactClass({
  propTypes: {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object
  },
  render() {
    const goHome = () => {
      RCChangeUrlParams("", this.props.viewState);
    };
    return (
      <div className={Styles.branding}>
        <img
          onClick={goHome}
          src={require("../../../wwwroot/images/receipt/receipt-logo.svg")}
          className="{Styles.logo}"
        />
      </div>
    );
  }
});

module.exports = Branding;
