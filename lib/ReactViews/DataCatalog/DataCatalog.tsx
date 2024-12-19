import React from "react";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import SearchHeader from "../Search/SearchHeader";
import Styles from "./data-catalog.scss";
import DataCatalogMember from "./DataCatalogMember";

// Displays the data catalog.
@observer
class DataCatalog extends React.Component {
  static propTypes = {
    terria: PropTypes.object,
    viewState: PropTypes.object,
    items: PropTypes.array,
    onActionButtonClicked: PropTypes.func,
    removable: PropTypes.bool,
    t: PropTypes.func.isRequired
  };

  render() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    const searchState = this.props.viewState.searchState;
    const isSearching = searchState.catalogSearchText.length > 0;
    const catalogSearchProvider = searchState.catalogSearchProvider;
    const unfilteredItems =
      isSearching &&
      catalogSearchProvider &&
      searchState.catalogSearchResults?.results
        ? searchState.catalogSearchResults.results.map(
            (result: any) => result.catalogItem
          )
        : // @ts-expect-error TS(2339): Property 'items' does not exist on type 'Readonly<... Remove this comment to see the full error message
          this.props.items;
    const items = (unfilteredItems || []).filter(defined);
    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t } = this.props;
    return (
      <ul className={Styles.dataCatalog}>
        {isSearching && catalogSearchProvider && (
          <>
            <label className={Styles.label}>{t("search.resultsLabel")}</label>
            <SearchHeader
              searchResults={searchState.catalogSearchResults}
              isWaitingForSearchToStart={
                searchState.isWaitingToStartCatalogSearch
              }
            />
          </>
        )}
        {items.map(
          (item: any) =>
            item !== this.props.terria.catalog.userAddedDataGroup && (
              <DataCatalogMember
                // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                viewState={this.props.viewState}
                member={item}
                // manage group `isOpen` flag locally if searching through models dynamically (i.e. not using catalog index)
                // This must be false if resultsAreReferences - so group references open correctly in the search
                manageIsOpenLocally={
                  isSearching && !catalogSearchProvider.resultsAreReferences
                }
                key={item.uniqueId}
                // @ts-expect-error TS(2339): Property 'onActionButtonClicked' does not exist on... Remove this comment to see the full error message
                onActionButtonClicked={this.props.onActionButtonClicked}
                // @ts-expect-error TS(2339): Property 'removable' does not exist on type 'Reado... Remove this comment to see the full error message
                removable={this.props.removable}
                // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
                terria={this.props.terria}
                isTopLevel
              />
            )
        )}
      </ul>
    );
  }
}

export default withTranslation()(DataCatalog);
