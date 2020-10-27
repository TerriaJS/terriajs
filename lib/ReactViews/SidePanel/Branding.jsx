"use strict";
import defined from "terriajs-cesium/Source/Core/defined";
import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";
import React from "react";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";
import Styles from "./branding.scss";

const Branding = observer(
  createReactClass({
    displayName: "Branding",

    propTypes: {
      terria: PropTypes.object.isRequired,
      version: PropTypes.string,
      displayOne: PropTypes.number, // pass in a number here to only show one item from brandBarElements
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

    const displayOne = this.props.displayOne;
    const displayContent =
      // If the index exists, use that
      (displayOne && brandingHtmlElements[displayOne]) ||
      // If it doesn't exist, find the first item that isn't an empty string (for backward compatability of old terriamap defaults)
      (displayOne && brandingHtmlElements.find(item => item?.length > 0)) ||
      undefined;

    return (
      <div className={Styles.branding}>
        {displayContent &&
          parseCustomHtmlToReact(
            displayContent.replace(/\{\{\s*version\s*\}\}/g, version)
          )}
        {!displayContent && (
          <For each="element" index="i" of={brandingHtmlElements}>
            {parseCustomHtmlToReact(
              element.replace(/\{\{\s*version\s*\}\}/g, version)
            )}
          </For>
        )}
      </div>
    );
  }
});

module.exports = Branding;
