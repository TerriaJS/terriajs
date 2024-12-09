import React from "react";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { addMarker } from "../../Models/LocationMarkerUtils";
import LocationSearchResults from "../Search/LocationSearchResults";
import SearchResult from "../Search/SearchResult";
import { withTranslation } from "react-i18next";
import Styles from "./mobile-search.scss";

// A Location item when doing Bing map searvh or Gazetter search
@observer
class MobileSearch extends React.Component {
  static propTypes = {
    viewState: PropTypes.object,
    terria: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  onLocationClick(result: any) {
    runInAction(() => {
      result.clickAction();

      // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
      addMarker(this.props.terria, result);

      // Close modal window
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.switchMobileView(null);
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.searchState.showMobileLocationSearch = false;
    });
  }

  searchInDataCatalog() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    const { searchState } = this.props.viewState;
    runInAction(() => {
      // Set text here so that it doesn't get batched up and the catalog
      // search text has a chance to set isWaitingToStartCatalogSearch
      searchState.catalogSearchText = searchState.locationSearchText;
    });
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.searchInCatalog(searchState.locationSearchText);
  }

  render() {
    const theme = "light";
    return (
      // @ts-expect-error TS(2339): Property 'mobileSearch' does not exist on type 'IM... Remove this comment to see the full error message
      <div className={Styles.mobileSearch}>
        <div>{this.renderSearchInCatalogLink(theme)}</div>
        <div className={Styles.location}>
          {this.renderLocationResult(theme)}
        </div>
      </div>
    );
  }

  renderSearchInCatalogLink(theme: any) {
    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t } = this.props;
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    const searchState = this.props.viewState.searchState;

    if (searchState.locationSearchText.length === 0) {
      return null;
    }

    return (
      <div className={Styles.providerResult}>
        <ul className={Styles.btnList}>
          {searchState.catalogSearchProvider && (
            <SearchResult
              clickAction={() => this.searchInDataCatalog()}
              // @ts-expect-error TS(2322): Type 'null' is not assignable to type '"data" | "l... Remove this comment to see the full error message
              icon={null}
              locationSearchText={searchState.locationSearchText}
              name={t("search.search", {
                searchText: searchState.locationSearchText
              })}
              searchResultTheme={theme}
            />
          )}
        </ul>
      </div>
    );
  }

  renderLocationResult(theme: any) {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    const searchState = this.props.viewState.searchState;
    return searchState.locationSearchResults.map((search: any) => (
      <LocationSearchResults
        key={search.searchProvider.name}
        // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
        terria={this.props.terria}
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        viewState={this.props.viewState}
        search={search}
        locationSearchText={searchState.locationSearchText}
        onLocationClick={this.onLocationClick.bind(this)}
        isWaitingForSearchToStart={searchState.isWaitingToStartLocationSearch}
        theme={theme}
      />
    ));
  }
}

export default withTranslation()(MobileSearch);
