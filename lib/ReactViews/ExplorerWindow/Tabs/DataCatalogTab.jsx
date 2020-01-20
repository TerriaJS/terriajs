import React from "react";
import { observer } from "mobx-react";

import createReactClass from "create-react-class";

import PropTypes from "prop-types";

import DataCatalog from "../../DataCatalog/DataCatalog";
import DataPreview from "../../Preview/DataPreview";

import SearchBox, { DEBOUNCE_INTERVAL } from "../../Search/SearchBox.jsx";

import Styles from "./data-catalog-tab.scss";
import { runInAction } from "mobx";

// The DataCatalog Tab
const DataCatalogTab = observer(
  createReactClass({
    displayName: "DataCatalogTab",

    propTypes: {
      terria: PropTypes.object,
      viewState: PropTypes.object,
      items: PropTypes.array,
      searchPlaceholder: PropTypes.string,
      overrideState: PropTypes.string,
      onActionButtonClicked: PropTypes.func
    },

    getDefaultProps() {
      return {
        searchPlaceholder: "Search the catalogue" // Let SearchBox set the default placeholder
      };
    },

    changeSearchText(newText) {
      runInAction(() => {
        this.props.viewState.searchState.catalogSearchText = newText;
      });
    },

    search() {
      this.props.viewState.searchState.searchCatalog();
    },

    render() {
      const terria = this.props.terria;
      const searchState = this.props.viewState.searchState;
      return (
        <div className={Styles.root}>
          <div className={Styles.dataExplorer}>
            {/* ~TODO: Put this back once we add a MobX DataCatalogSearch Provider~ */}
            {/* TODO2: Implement a more generic MobX DataCatalogSearch */}
            {searchState.catalogSearchProvider && (
              <SearchBox
                searchText={searchState.catalogSearchText}
                onSearchTextChanged={this.changeSearchText}
                onDoSearch={this.search}
                placeholder={this.props.searchPlaceholder}
                debounceDuration={
                  terria.catalogReferencesLoaded &&
                  searchState.catalogSearchProvider
                    ? searchState.catalogSearchProvider
                        .debounceDurationOnceLoaded
                    : DEBOUNCE_INTERVAL
                }
              />
            )}
            <DataCatalog
              terria={this.props.terria}
              viewState={this.props.viewState}
              overrideState={this.props.overrideState}
              onActionButtonClicked={this.props.onActionButtonClicked}
              items={this.props.items}
            />
          </div>
          <DataPreview
            terria={terria}
            viewState={this.props.viewState}
            previewed={this.props.viewState.previewedItem}
          />
        </div>
      );
    }
  })
);

module.exports = DataCatalogTab;
