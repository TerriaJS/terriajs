import React from "react";
import createReactClass from "create-react-class";

import PropTypes from "prop-types";

import { addMarker } from "../../Models/LocationMarkerUtils";
import ObserveModelMixin from "../ObserveModelMixin";
import LocationSearchResults from "../Search/LocationSearchResults";
import SearchResult from "../Search/SearchResult";
import { withTranslation } from "react-i18next";
import Styles from "./mobile-search.scss";

// A Location item when doing Bing map searvh or Gazetter search
const MobileSearch = createReactClass({
  displayName: "MobileSearch",
  mixins: [ObserveModelMixin],

  propTypes: {
    viewState: PropTypes.object,
    terria: PropTypes.object,
    t: PropTypes.func.isRequired
  },

  onLocationClick(result) {
    result.clickAction();

    addMarker(this.props.terria, result);

    // Close modal window
    this.props.viewState.switchMobileView(null);
    this.props.viewState.searchState.showMobileLocationSearch = false;
  },

  searchInDataCatalog() {
    const viewname = this.props.viewState.mobileViewOptions.data;
    this.props.viewState.explorerPanelIsVisible = true;
    this.props.viewState.switchMobileView(viewname);
    this.props.viewState.searchInCatalog(
      this.props.viewState.searchState.locationSearchText
    );
  },

  render() {
    const theme = "light";
    return (
      <div className={Styles.mobileSearch}>
        <div>{this.renderSearchInCatalogLink(theme)}</div>
        <div className={Styles.location}>
          {this.renderLocationResult(theme)}
        </div>
      </div>
    );
  },

  renderSearchInCatalogLink(theme) {
    const { t } = this.props;
    return (
      <If
        condition={
          this.props.viewState.searchState.locationSearchText.length > 0
        }
      >
        <div className={Styles.providerResult}>
          <ul className={Styles.btnList}>
            <SearchResult
              clickAction={this.searchInDataCatalog}
              icon={null}
              name={t("search.search", {
                searchText: this.props.viewState.searchState.locationSearchText
              })}
              theme={theme}
            />
          </ul>
        </div>
      </If>
    );
  },

  renderLocationResult(theme) {
    const searchState = this.props.viewState.searchState;
    return searchState.locationSearchProviders
      .filter(
        search =>
          search.isSearching ||
          (search.searchResults && search.searchResults.length)
      )
      .map(search => (
        <LocationSearchResults
          key={search.name}
          terria={this.props.terria}
          viewState={this.props.viewState}
          search={search}
          onLocationClick={this.onLocationClick}
          isWaitingForSearchToStart={searchState.isWaitingForSearchToStart}
          theme={theme}
        />
      ));
  }
});

module.exports = withTranslation()(MobileSearch);
