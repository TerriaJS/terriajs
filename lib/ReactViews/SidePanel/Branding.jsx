"use strict";
import defined from "terriajs-cesium/Source/Core/defined";
import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";
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
    let brandingHtmlElements = this.props.terria.configParameters
      .brandBarElements;
    if (!defined(brandingHtmlElements)) {
      brandingHtmlElements = [
        '<a target="_blank" href="http://terria.io"><img src="images/terria_logo.png" height="52" title="Version: {{ version }}" /></a>'
      ];
    }

    const version = this.props.version || "Unknown";

    return (
      <div className={Styles.branding}>
        <For each="element" of={brandingHtmlElements}>
          {parseCustomHtmlToReact(
            element.replace(/\{\{\s*version\s*\}\}/g, version)
          )}
        </For>
      </div>
    );
  }
});

module.exports = Branding;
