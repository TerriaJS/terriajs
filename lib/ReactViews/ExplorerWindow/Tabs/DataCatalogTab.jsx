'use strict';

import DataCatalogMember from '../../DataCatalog/DataCatalogMember.jsx';
import DataPreview from '../../Preview/DataPreview.jsx';
import ObserveModelMixin from '../../ObserveModelMixin';
import React from 'react';
import SearchHeader from '../../Search/SearchHeader.jsx';
import SearchBox from '../../Search/SearchBox.jsx';
import defined from 'terriajs-cesium/Source/Core/defined';

// The DataCatalog Tab
const DataCatalogTab = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        viewState: React.PropTypes.object
    },

    changeSearchText(newText) {
        this.props.viewState.searchState.catalogSearchText = newText;
    },

    search() {
        this.props.viewState.searchState.searchCatalog();
    },

    render() {
        const terria = this.props.terria;
        return (
            <div>
                <div className="data-explorer">
                    <SearchBox searchText={this.props.viewState.searchState.catalogSearchText}
                               onSearchTextChanged={this.changeSearchText}
                               onDoSearch={this.search} />
                    {this.renderDataCatalog()}
                </div>
                <div className="data-preview__wrapper">
                    <DataPreview terria={terria}
                                 viewState={this.props.viewState}
                                 previewed={this.props.viewState.previewedItem}
                    />
                </div>
            </div>);
    },

    renderDataCatalog() {
        const terria = this.props.terria;
        const searchState = this.props.viewState.searchState;
        const isSearching = searchState.catalogSearchText.length > 0;
        const items = isSearching ?
            searchState.catalogSearchProvider.searchResults.map(result => result.catalogItem) :
            terria.catalog.group.items;

        return (
            <ul className='data-catalog'>
                {isSearching && <label className="label">Search results</label>}
                {isSearching && <SearchHeader searchProvider={searchState.catalogSearchProvider} isWaitingForSearchToStart={searchState.isWaitingToStartCatalogSearch} />}
                {items
                    .filter(defined)
                    .map((item, i) => (
                        <DataCatalogMember viewState={this.props.viewState}
                                           member={item}
                                           manageIsOpenLocally={isSearching}
                                           key={item.uniqueId}
                        />
                    ))
                }
            </ul>);
    }
});

module.exports = DataCatalogTab;
