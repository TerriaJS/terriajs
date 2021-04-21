"use strict";
import React from "react";
import defined from "terriajs-cesium/Source/Core/defined";
import Terria from "../../Models/Terria";
import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";
import ViewState from "../../ReactViewModels/ViewState";

export default (props: {
  terria: Terria;
  viewState: ViewState;
  version?: string;
}) => {
  // Use brandBarElements or brandBarSmallElements depending if using SmallScreenInterface (and default to brandBarElements)
  let brandingHtmlElements = (props.viewState.useSmallScreenInterface
    ? props.terria.configParameters.brandBarSmallElements
    : props.terria.configParameters.brandBarElements) ??
    props.terria.configParameters.brandBarElements ?? [
      '<a target="_blank" href="http://terria.io"><img src="images/terria_logo.png" height="52" title="Version: {{ version }}" /></a>'
    ];

  const version = props.version ?? "Unknown";

  const displayOne = props.terria.configParameters.displayOneBrand;
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
          height: ${(p: any) => p.theme.logoSmallHeight};

          padding: ${(p: any) => p.theme.logoSmallPaddingHorizontal}
            ${(p: any) => p.theme.logoSmallPaddingVertical};

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
