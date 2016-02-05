'use strict';

import DataCatalogMember from './DataCatalogMember.jsx';
import DataPreview from './DataPreview.jsx';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
import SearchHeader from './Search/SearchHeader.jsx';
import SearchBox from './Search/SearchBox.jsx';
import CatalogItemNameSearchProviderViewModel from '../ViewModels/CatalogItemNameSearchProviderViewModel.js';
import defined from 'terriajs-cesium/Source/Core/defined';
import Loader from './Loader.jsx';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';

// The DataCatalog Tab
const DataCatalogTab = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        viewState: React.PropTypes.object
    },

    componentWillMount() {
        this.searchProvider = new CatalogItemNameSearchProviderViewModel({terria: this.props.terria});

        knockout.getObservable(this.props.viewState, 'catalogSearch').subscribe(function(newText) {
            this.searchProvider.search(newText);
            this.refs.searchBox.setText(newText);
        }, this);
    },

    onSearchTextChanged(newText) {
        this.props.viewState.catalogSearch = newText;
    },

    render() {
        const terria = this.props.terria;
        return (
            <div className="panel-content clearfix">
                <div className="search-data col col-6">
                    <SearchBox initialText={this.props.viewState.catalogSearch}
                               onSearchTextChanged={this.onSearchTextChanged}
                               ref="searchBox"/>
                    {this.renderDataCatalog()}
                </div>
                <div className="data-preview preview col col-6 block">
                    <DataPreview terria={terria}
                                 previewedCatalogItem={this.props.viewState.previewedItem}
                    />
                </div>
            </div>);
    },

    renderDataCatalog() {
        const terria = this.props.terria;
        const isSearching = !!this.props.viewState.catalogSearch.length;
        const items = isSearching ?
            this.searchProvider.searchResults.map(result => result.catalogItem) :
            terria.catalog.group.items;

        return (
            <ul className='list-reset data-catalog'>
                <SearchHeader {...this.searchProvider} />
                {items
                    .filter(defined)
                    .map((item, i) => (
                        <DataCatalogMember viewState={this.props.viewState}
                                           member={item}
                                           manageIsOpenLocally={isSearching}
                                           key={item.uniqueId}/>
                    ))
                }
            </ul>);
    }
});

module.exports = DataCatalogTab;
