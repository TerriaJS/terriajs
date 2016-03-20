'use strict';
import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import SearchHeader from '../Search/SearchHeader.jsx';
import LocationItem from '../LocationItem.jsx';
import DataCatalogMember from '../DataCatalogMember.jsx';
import classNames from 'classnames';

// A Location item when doing Bing map searvh or Gazetter search
const MobileSearch = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        viewState: React.PropTypes.object,
        terria: React.PropTypes.object,
        searches: React.PropTypes.array
    },

    getInitialState() {
        return {
            searchResultType: 0,
        };
    },

    toggleSearchResults(index) {
        this.setState({
            searchResultType: index
        });
    },

    renderLocationResult() {
        return this.props.searches
                        .filter(search=> search.constructor.name !== 'CatalogItemNameSearchProviderViewModel')
                        .filter(search => search.isSearching || (search.searchResults && search.searchResults.length))
                        .map(search => (<div key={search.constructor.name}>
                                        <label className='label label-sub-heading'>{search.name}</label>
                                        <SearchHeader {...search} />
                                        <ul className=' mobile-search-results search-results-items'>
                                            { search.searchResults.map((result, i) => (
                                                <LocationItem key={i} item={result}/>
                                            ))}
                                        </ul>
                                    </div>));
    },

    renderDataCatalogResult() {
        const terria = this.props.terria;
        const search = this.props.searches
                      .filter(s=> s.constructor.name === 'CatalogItemNameSearchProviderViewModel')[0];

        const items = search.searchResults.map(result => result.catalogItem);

        return <ul className='data-catalog mobile-search-results '>
                    <SearchHeader {...search} />
                    {items.filter(defined)
                          .map((item, i) => (
                            <DataCatalogMember viewState={this.props.viewState}
                                               member={item}
                                               manageIsOpenLocally={search.isSearching}
                                               key={item.uniqueId}
                            />
                        ))}
                </ul>;

    },

    render() {
        return (
            <div className="search--mobile">
            <div className='search-results-toggle'>
                <button className={classNames('search--location', 'btn', {'is-active' : this.state.searchResultType === 0})}
                        onClick={this.toggleSearchResults.bind(this, 0)}>Location</button>
                <button className={classNames('search--data', 'btn', {'is-active' : this.state.searchResultType === 1})}
                        onClick={this.toggleSearchResults.bind(this, 1)}>Data</button>
            </div>
                {this.state.searchResultType === 0 && this.renderLocationResult()}
                {this.state.searchResultType === 1 && this.renderDataCatalogResult()}
            </div>
        );
    }
});

module.exports = MobileSearch;
