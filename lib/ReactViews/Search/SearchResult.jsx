import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import createReactClass from "create-react-class";
import Icon from "../Icon";

import Box, { BoxSpan } from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import { TextSpan } from "../../Styled/Text";
import Spacing from "../../Styled/Spacing";

import highlightKeyword from "../ReactViewHelpers/highlightKeyword";

// Not sure how to generalise this or if it should be kept in stlyed/Button.jsx
const RawButtonAndHighlight = styled(RawButton)`
  ${p => !p.isLastResult && `border-bottom: 1px solid ${p.theme.grey};`}
  ${p => `
  &:hover, &:focus {
    background-color: ${p.theme.greyLighter};
    ${BoxSpan} svg {
      fill-opacity:1;
    }
    ${Icon} {
      fill-opacity:1;
    }
  }`}
`;

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
          <RawButtonAndHighlight
            type="button"
            onClick={this.props.clickAction}
            fullWidth
            isLastResult={isLastResult}
          >
            {/* (You need light text on a dark theme, and vice versa) */}
            <TextSpan
              breakWord
              large
              textLight={isDarkTheme}
              textDark={isLightTheme}
            >
              <BoxSpan
                paddedRatio={2}
                paddedVertically={3}
                centered
                justifySpaceBetween
              >
                {icon && (
                  <BoxSpan flexShrinkZero styledWidth={"15px"}>
                    <Icon glyph={Icon.GLYPHS[icon]} />
                  </BoxSpan>
                )}
                <Spacing right={2} />
                <BoxSpan fullWidth>
                  <TextSpan noFontSize textAlignLeft>
                    {highlightedResultName}
                  </TextSpan>
                </BoxSpan>
                <BoxSpan styledWidth={"14px"} flexShrinkZero>
                  <Icon css={"fill-opacity:0;"} glyph={Icon.GLYPHS.right2} />
                </BoxSpan>
              </BoxSpan>
            </TextSpan>
          </RawButtonAndHighlight>
        </Box>
      </li>
    );
  }
});

module.exports = SearchResult;
