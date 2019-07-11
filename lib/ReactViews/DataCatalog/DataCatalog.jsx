import React from "react";
import { observer } from "mobx-react";

import createReactClass from "create-react-class";

import PropTypes from "prop-types";

import defined from "terriajs-cesium/Source/Core/defined";

import DataCatalogMember from "./DataCatalogMember";
import SearchHeader from "../Search/SearchHeader";

import Styles from "./data-catalog.scss";

// Displays the data catalog.
const DataCatalog = observer(
  createReactClass({
    displayName: "DataCatalog",

    propTypes: {
      terria: PropTypes.object,
      viewState: PropTypes.object,
      items: PropTypes.array,
      overrideState: PropTypes.string,
      onActionButtonClicked: PropTypes.func,
      removable: PropTypes.bool
    },

    render() {
      const searchState = this.props.viewState.searchState;
      const isSearching = searchState.catalogSearchText.length > 0;
      const unfilteredItems = isSearching
        ? searchState.catalogSearchProvider.searchResults.map(
            result => result.catalogItem
          )
        : this.props.items;
      const items = (unfilteredItems || []).filter(defined);

      return (
        <ul className={Styles.dataCatalog}>
          <If condition={isSearching}>
            <label className={Styles.label}>Search results</label>
            <SearchHeader
              searchProvider={searchState.catalogSearchProvider}
              isWaitingForSearchToStart={
                searchState.isWaitingToStartCatalogSearch
              }
            />
          </If>
          <For each="item" of={items}>
            {item !==
              this.props.terria.catalog.userAddedDataGroupIfItExists && (
              <DataCatalogMember
                viewState={this.props.viewState}
                member={item}
                manageIsOpenLocally={isSearching}
                key={item.uniqueId}
                overrideState={this.props.overrideState}
                onActionButtonClicked={this.props.onActionButtonClicked}
                removable={this.props.removable}
                terria={this.props.terria}
                ancestors={[]}
              />
            )}
          </For>
        </ul>
      );
    }
  })
);

module.exports = DataCatalog;
