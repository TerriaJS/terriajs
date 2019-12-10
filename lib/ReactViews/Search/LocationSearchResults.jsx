import ObserveModelMixin from "../ObserveModelMixin";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import SearchHeader from "./SearchHeader.jsx";
import SearchResult from "./SearchResult.jsx";
import classNames from "classnames";
import { withTranslation } from "react-i18next";
import Icon from "../Icon.jsx";
import Styles from "./location-search-result.scss";

const LocationSearchResults = createReactClass({
  displayName: "LocationSearchResults",
  mixins: [ObserveModelMixin],

  propTypes: {
    viewState: PropTypes.object.isRequired,
    isWaitingForSearchToStart: PropTypes.bool,
    terria: PropTypes.object.isRequired,
    search: PropTypes.object.isRequired,
    onLocationClick: PropTypes.func.isRequired,
    theme: PropTypes.string,
    t: PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      isOpen: true,
      isExpanded: false
    };
  },

  getDefaultProps() {
    return {
      theme: "dark"
    };
  },

  toggleGroup() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  },

  toggleExpand() {
    this.setState({
      isExpanded: !this.state.isExpanded
    });
  },

  renderResultsFooter() {
    const { t } = this.props;
    if (this.state.isExpanded) {
      return t("search.viewLess", { name: this.props.search.name });
    }
    return t("search.viewMore", { name: this.props.search.name });
  },

  render() {
    const search = this.props.search;
    const results =
      search.searchResults.length > 5
        ? this.state.isExpanded
          ? search.searchResults
          : search.searchResults.slice(0, 5)
        : search.searchResults;
    return (
      <div
        key={search.name}
        className={classNames(Styles.providerResult, {
          [Styles.isOpen]: this.state.isOpen,
          [Styles.dark]: this.props.theme === "dark",
          [Styles.light]: this.props.theme === "light"
        })}
      >
        <button onClick={this.toggleGroup} className={Styles.heading}>
          <span>{search.name}</span>
          <Icon
            glyph={this.state.isOpen ? Icon.GLYPHS.opened : Icon.GLYPHS.closed}
          />
        </button>
        <SearchHeader
          searchProvider={search}
          isWaitingForSearchToStart={this.props.isWaitingForSearchToStart}
        />
        <ul className={Styles.items}>
          {results.map((result, i) => (
            <SearchResult
              key={i}
              clickAction={this.props.onLocationClick.bind(null, result)}
              name={result.name}
              icon="location"
              theme={this.props.theme}
            />
          ))}
          {search.searchResults.length > 5 && (
            <button className={Styles.footer} onClick={this.toggleExpand}>
              {this.renderResultsFooter()}
              <Icon
                glyph={
                  this.state.isExpanded
                    ? Icon.GLYPHS.opened
                    : Icon.GLYPHS.closed
                }
              />
            </button>
          )}
        </ul>
      </div>
    );
  }
});

module.exports = withTranslation()(LocationSearchResults);
