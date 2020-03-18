import React from "react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";
import Icon from "../Icon";
import Styles from "./search-result.scss";
import classNames from "classnames";

import Text from "../../Styled/Text";

// Really really lightweight highlight without pulling in react-highlight-words
// pros: lightweight
// cons: ???
function highlightKeyword(searchResult, keywordToHighlight) {
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
      <li
        className={classNames(Styles.searchResult, {
          [Styles.dark]: isDarkTheme,
          [Styles.light]: isLightTheme
        })}
      >
        <button
          type="button"
          onClick={this.props.clickAction}
          className={classNames(Styles.btn, {
            [Styles.btnWithBorderBottom]: !isLastResult
          })}
        >
          {/* (You need light text on a dark theme, and vice versa) */}
          <Text large textLight={isDarkTheme} textDark={isLightTheme}>
            {icon && (
              <span className={Styles.icon}>
                <Icon glyph={Icon.GLYPHS[icon]} />
              </span>
            )}
            <span className={Styles.resultName}>{highlightedResultName}</span>
            <span className={Styles.arrowIcon}>
              <Icon glyph={Icon.GLYPHS.right2} />
            </span>
          </Text>
        </button>
      </li>
    );
  }
});

module.exports = SearchResult;
