'use strict';

import BingMapsSearchProviderViewModel from '../ViewModels/BingMapsSearchProviderViewModel.js';
import CatalogItemNameSearchProviderViewModel from '../ViewModels/CatalogItemNameSearchProviderViewModel.js';
import defined from 'terriajs-cesium/Source/Core/defined';
import GazetteerSearchProviderViewModel from '../ViewModels/GazetteerSearchProviderViewModel.js';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
import SearchResults from './Search/SearchResults.jsx';
import SearchBox from './Search/DumbSearchBox.jsx';
import classNames from 'classnames';

// Handle any of the three kinds of search based on the props
export default React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        searchText: React.PropTypes.string,
        searches: React.PropTypes.array
    },

    getDefaultProps() {
        return {
            searchText: ''
        };
    },

    componentWillMount() {
        const terria = this.props.terria;

        this.setState({
            searches: this.props.searches || [
                new CatalogItemNameSearchProviderViewModel({terria}),
                new BingMapsSearchProviderViewModel({terria}),
                new GazetteerSearchProviderViewModel({terria})
            ]
        });
    },

    componentWillUnmount() {
        // Cancel any searches that may be in progress
        this.search('');
    },

    search(newText) {
        this.state.searches.forEach(search => search.search(newText));
    },

    render() {
        let linkToSearchData = null;
        if ((this.props.dataSearch === false) && this.props.searchText.length > 0) {
            linkToSearchData = (
                <button onClick={this.search} className='btn btn-data-search'>Search {this.props.searchText} in Data
                    Catalog<i className='icon icon-right-arrow' /></button>);
        }

        const outerClasses = classNames(
            'search',
            {'is-searching': this.props.searchText.length > 0}
        );

        return (
            <div className={outerClasses}>
                <SearchBox onSearchTextChanged={this.search}/>
                <div className='search-results'>
                    {linkToSearchData}
                    {this.state.searches.map(search => (<SearchResults key={search.constructor.name} {...search} />))}
                </div>
            </div>
        );
    }
});
