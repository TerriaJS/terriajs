"use strict";
import React from "react";
import defined from "terriajs-cesium/Source/Core/defined";
import Terria from "../../Models/Terria";
import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";

export default (props: {
  terria: Terria;
  version?: string;
  displayOne?: number; // pass in a number here to only show one item from brandBarElements
  onClick?: () => void;
}) => {
  let brandingHtmlElements = props.terria.configParameters.brandBarElements;
  if (!defined(brandingHtmlElements)) {
    brandingHtmlElements = [
      '<a target="_blank" href="http://terria.io"><img src="images/terria_logo.png" height="52" title="Version: {{ version }}" /></a>'
    ];
  }

  if (!brandingHtmlElements) return null;

  const version = props.version ?? "Unknown";

  const displayOne = props.displayOne;
  const displayContent =
    // If the index exists, use that
    (displayOne && brandingHtmlElements[displayOne]) ||
    // If it doesn't exist, find the first item that isn't an empty string (for backward compatability of old terriamap defaults)
    (displayOne && brandingHtmlElements.find(item => item?.length > 0)) ||
    undefined;

  return (
    <div
      css={`
        display: flex;
        justify-content: space-between;

        box-sizing: border-box;

        width: 100%;
        height: ${(p: any) => p.theme.logoHeight};

        overflow: hidden;

        a {
          display: flex;
          -webkit-box-align: center;
          align-items: center;
          -webkit-box-pack: center;
          justify-content: center;
        }
        span {
          display: block;
        }
        img {
          max-height: 100%;
          max-width: 100%;
        }

        font-family: ${(p: any) => p.theme.fontPop};

        padding: ${(p: any) => p.theme.logoPaddingHorizontal}
          ${(p: any) => p.theme.logoPaddingVertical};

        @media (max-width: ${(p: any) => p.theme.sm}px) {
          height: ${(p: any) => p.theme.inputHeight};
          padding: 0 ${(p: any) => p.theme.spacing}px;

          // Remove all font-size so text scales to smaller screen
          * {
            font-size: unset !important;
            padding: 0 !important;
          }

          // Only show first brandingHtmlElement on small screen
          * :not(:first-child) {
            display: none;
          }

          // Remove a "display: flex" on small screen
          a {
            display: unset;
          }
        }
      `}
    >
      {displayContent &&
        parseCustomHtmlToReact(
          displayContent.replace(/\{\{\s*version\s*\}\}/g, version)
        )}
      {!displayContent &&
        brandingHtmlElements.map((element, idx) => (
          <React.Fragment key={idx}>
            {parseCustomHtmlToReact(
              element.replace(/\{\{\s*version\s*\}\}/g, version)
            )}
          </React.Fragment>
        ))}
    </div>
  );
};
