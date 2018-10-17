import React from 'react';

import createReactClass from 'create-react-class';

import PropTypes from 'prop-types';

import defined from 'terriajs-cesium/Source/Core/defined';

import DataCatalogMember from './DataCatalogMember.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import SearchHeader from '../Search/SearchHeader.jsx';

import Styles from './data-catalog.scss';

// Displays the data catalog.
const DataCatalog = createReactClass({
    displayName: 'DataCatalog',
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: PropTypes.object,
        viewState: PropTypes.object,
        items: PropTypes.array,
        removable: PropTypes.bool
    },

    render() {
        const searchState = this.props.viewState.searchState;
        const isSearching = searchState.catalogSearchText.length > 0;
        const items = (
            isSearching ?
                searchState.catalogSearchProvider.searchResults.map(result => result.catalogItem) :
                this.props.items
        ).filter(defined);

        return (
            <ul className={Styles.dataCatalog}>
                <If condition={isSearching}>
                    <label className={Styles.label}>Search results</label>
                    <SearchHeader searchProvider={searchState.catalogSearchProvider}
                                  isWaitingForSearchToStart={searchState.isWaitingToStartCatalogSearch}/>
                </If>
                <For each="item" of={items}>
                    {item !== this.props.terria.catalog.userAddedDataGroup &&
                        <DataCatalogMember viewState={this.props.viewState}
                                           member={item}
                                           manageIsOpenLocally={isSearching}
                                           key={item.uniqueId}
                                           removable = {this.props.removable}
                                           terria={this.props.terria}

                    />}
                </For>
            </ul>
        );
    },
});

module.exports = DataCatalog;
