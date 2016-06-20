'use strict';
import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import SearchHeader from '../Search/SearchHeader.jsx';
import SearchResult from '../Search/SearchResult.jsx';
import DataCatalogMember from '../DataCatalog/DataCatalogMember.jsx';
import Styles from './mobile-search.scss';

// A Location item when doing Bing map searvh or Gazetter search
const MobileSearch = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        viewState: React.PropTypes.object,
        terria: React.PropTypes.object
    },

    onLocationClick(result) {
        result.clickAction();
        // Close modal window
        this.props.viewState.switchMobileView(null);

    },

    renderLocationResult() {
        const that = this;
        const searchState = this.props.viewState.searchState;
        return searchState.unifiedSearchProviders
                        .filter(search=> search.constructor.name !== 'CatalogItemNameSearchProviderViewModel')
                        .filter(search => search.isSearching || (search.searchResults && search.searchResults.length))
                        .map(search => (<div key={search.constructor.name}>
                                        <label className={Styles.label}>Locations & Official Place Names</label>
                                        <SearchHeader searchProvider={search} />
                                        <ul className={Styles.results}>
                                            { search.searchResults.map((result, i) => (
                                                <SearchResult key={i} name={result.name} clickAction={that.onLocationClick.bind(that, result)} theme="light" />
                                            ))}
                                        </ul>
                                    </div>));
    },

    renderDataCatalogResult() {
        const searchState = this.props.viewState.searchState;
        const search = searchState.unifiedSearchProviders
                      .filter(s=> s.constructor.name === 'CatalogItemNameSearchProviderViewModel')[0];

        const items = search.searchResults.map(result => result.catalogItem);
        if (searchState.unifiedSearchText.length) {
            return <div key={search.constructor.name}>
                <label className={Styles.label}>{search.name}</label>
                <ul className={Styles.results}>
                    <SearchHeader searchProvider={search}/>
                    {items.filter(defined)
                        .map((item, i) => (
                            <DataCatalogMember viewState={this.props.viewState}
                                               member={item}
                                               manageIsOpenLocally={search.isSearching}
                                               key={item.uniqueId}
                            />
                        ))}
                </ul>
            </div>;
        }
        return null;
    },

    render() {
        return (
            <div className={Styles.mobileSearch}>
                <div className='search-results--location'>
                    {this.renderLocationResult()}
                </div>
                <div className='search-results--data'>
                    {this.renderDataCatalogResult()}
                </div>
            </div>
        );
    }
});

module.exports = MobileSearch;
