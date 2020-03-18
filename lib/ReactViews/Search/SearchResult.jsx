import React from "react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";
import Icon from "../Icon";

import Box, { BoxSpan } from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import { TextSpan } from "../../Styled/Text";

// Really really lightweight highlight without pulling in react-highlight-words
// pros: lightweight
// cons: ???
function highlightKeyword(searchResult, keywordToHighlight) {
  if (!keywordToHighlight) return searchResult;
  const parts = searchResult.split(new RegExp(`(${keywordToHighlight})`, "gi"));
  return (
    <>
      {parts.map((part, i) => (
        <span
          key={i}
          style={
            part.toLowerCase() === keywordToHighlight.toLowerCase()
              ? { fontWeight: "bold" }
              : {}
          }
        >
          {part}
        </span>
      ))}
    </>
  );
}

// A Location item when doing Bing map searvh or Gazetter search
const SearchResult = createReactClass({
  propTypes: {
    name: PropTypes.string.isRequired,
    clickAction: PropTypes.func.isRequired,
    isLastResult: PropTypes.bool,
    locationSearchText: PropTypes.string,
    icon: PropTypes.string,
    theme: PropTypes.string
  },

  getDefaultProps() {
    return {
      icon: false,
      theme: "light"
    };
  },

  render() {
    const { theme, name, locationSearchText, icon, isLastResult } = this.props;
    const isDarkTheme = theme === "dark";
    const isLightTheme = theme === "light";
    const highlightedResultName = highlightKeyword(name, locationSearchText);
    return (
      <li>
        <Box fullWidth>
          <RawButton
            type="button"
            onClick={this.props.clickAction}
            fullWidth
            isLastResult={isLastResult}
            css={`
              ${p =>
                !p.isLastResult && `border-bottom: 1px solid ${p.theme.grey};`}
              ${p => `
              &:hover, &:focus {
                background-color: ${p.theme.greyLighter};
                .tjs-search-result-right2 svg {
                  fill-opacity:1;
                }
              }`}
            `}
          >
            {/* (You need light text on a dark theme, and vice versa) */}
            <TextSpan
              breakWord
              large
              textLight={isDarkTheme}
              textDark={isLightTheme}
            >
              <BoxSpan paddedRatio={2} centered justifySpaceBetween>
                {icon && (
                  <BoxSpan flexShrinkZero styledWidth={"15px"}>
                    <Icon glyph={Icon.GLYPHS[icon]} />
                  </BoxSpan>
                )}
                <BoxSpan fullWidth>
                  <TextSpan textAlignLeft>{highlightedResultName}</TextSpan>
                </BoxSpan>
                <BoxSpan
                  className="tjs-search-result-right2"
                  styledWidth={"14px"}
                  flexShrinkZero
                >
                  <Icon css={"fill-opacity:0;"} glyph={Icon.GLYPHS.right2} />
                </BoxSpan>
              </BoxSpan>
            </TextSpan>
          </RawButton>
        </Box>
      </li>
    );
  }
});

module.exports = SearchResult;
