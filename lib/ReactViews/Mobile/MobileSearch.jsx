'use strict';
import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import SearchHeader from '../Search/SearchHeader.jsx';
import LocationItem from '../LocationItem.jsx';
import DataCatalogMember from '../DataCatalog/DataCatalogMember.jsx';

// A Location item when doing Bing map searvh or Gazetter search
const MobileSearch = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        viewState: React.PropTypes.object,
        terria: React.PropTypes.object
    },

    renderLocationResult() {
        const searchState = this.props.viewState.searchState;
        return searchState.unifiedSearchProviders
                        .filter(search=> search.constructor.name !== 'CatalogItemNameSearchProviderViewModel')
                        .filter(search => search.isSearching || (search.searchResults && search.searchResults.length))
                        .map(search => (<div key={search.constructor.name}>
                                        <label className='label'>Locations & Official Place Names</label>
                                        <SearchHeader searchProvider={search} />
                                        <ul className=' mobile-search-results search-results-items'>
                                            { search.searchResults.map((result, i) => (
                                                <LocationItem key={i} item={result}/>
                                            ))}
                                        </ul>
                                    </div>));
    },

    renderDataCatalogResult() {
        const searchState = this.props.viewState.searchState;
        const search = searchState.unifiedSearchProviders
                      .filter(s=> s.constructor.name === 'CatalogItemNameSearchProviderViewModel')[0];

        const items = search.searchResults.map(result => result.catalogItem);

        if (items && items.filter(defined).length > 0) {
            return <div key={search.constructor.name}>
                <label className='label'>{search.name}</label>
                    <ul className='data-catalog mobile-search-results '>
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
            <div className="search--mobile">
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
