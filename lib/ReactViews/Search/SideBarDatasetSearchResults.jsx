import ObserveModelMixin from "../ObserveModelMixin";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import SearchResult from "./SearchResult.jsx";
import classNames from "classnames";
import Icon from "../Icon.jsx";
import Styles from "./sidebar-dataset-search-results.scss";
import { withTranslation } from "react-i18next";

const SideBarDatasetSearchResults = createReactClass({
  displayName: "SideBarDatasetSearchResults",
  mixins: [ObserveModelMixin],

  propTypes: {
    viewState: PropTypes.object.isRequired,
    terria: PropTypes.object.isRequired,
    theme: PropTypes.string,
    t: PropTypes.func.isRequired
  },

  getDefaultProps() {
    return {
      theme: "dark"
    };
  },

  getInitialState() {
    return {
      isOpen: true
    };
  },

  searchInDataCatalog() {
    this.props.viewState.searchInCatalog(
      this.props.viewState.searchState.locationSearchText
    );
  },

  toggleGroup() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  },

  render() {
    const { t } = this.props;
    return (
      <div
        key="data"
        className={classNames(Styles.providerResult, {
          [Styles.isOpen]: this.state.isOpen,
          [Styles.dark]: this.props.theme === "dark",
          [Styles.light]: this.props.theme === "light"
        })}
      >
        <button onClick={this.toggleGroup} className={Styles.heading}>
          <span>{t("search.data")}</span>
          <Icon
            glyph={this.state.isOpen ? Icon.GLYPHS.opened : Icon.GLYPHS.closed}
          />
        </button>
        <ul className={Styles.items}>
          <SearchResult
            clickAction={this.searchInDataCatalog}
            icon="data"
            name={t("search.search", {
              searchText: this.props.viewState.searchState.locationSearchText
            })}
          />
        </ul>
      </div>
    );
  }
});

module.exports = withTranslation()(SideBarDatasetSearchResults);
