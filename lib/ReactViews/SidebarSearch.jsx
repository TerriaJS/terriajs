'use strict';

import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
import SearchHeader from './Search/SearchHeader.jsx';
import LocationItem from './LocationItem.jsx';

// Handle any of the three kinds of search based on the props
export default React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        searches: React.PropTypes.array,
        viewState: React.PropTypes.object.isRequired,
        searchText: React.PropTypes.string
    },

    getDefaultProps() {
        return {
            searchText: '',
            searches: []
        };
    },

    componentWillMount() {
        this.props.searches.forEach(search => search.search(this.props.searchText));
    },

    componentWillReceiveProps(nextProps) {
        this.props.searches.forEach(search => search.search(nextProps.searchText));
    },

    componentWillUnmount() {
        // Cancel any searches that may be in progress
        this.props.searches.forEach(search => search.search(''));
    },

    search(newText) {
        this.props.searches.forEach(search => search.search(newText));
    },

    searchInDataCatalog() {
        this.props.viewState.searchInCatalog(this.props.searchText);
    },

    backToNowViewing() {
        this.props.viewState.searchState.hideSearch = true;
    },

    render() {
        let linkToSearchData = null;

        if (this.props.searchText.length > 0) {
            linkToSearchData = (
                <button type='button' onClick={this.searchInDataCatalog} className='btn btn--data-search'>
                    Search {this.props.searchText} in the Data
                    Catalog<i className='icon icon-right-arrow'/></button>);
        }

        const searchResults = this.props.searches
            .filter(search => search.isSearching || (search.searchResults && search.searchResults.length));

        return (
            <div className='search'>
                <div className='search__results'>
                    <ul className="now-viewing__header">
                        <li><label className='label'>Search Results</label></li>
                        <li><label className='label--badge label'>{searchResults.length}</label></li>
                        <li>
                            <button type='button' onClick={this.backToNowViewing} className='btn right'>Done</button>
                        </li>
                    </ul>
                    <For each="search" of={searchResults}>
                        <div key={search.constructor.name}>
                            <label className='label label-sub-heading'>{search.name}</label>
                            <SearchHeader {...search} />
                            <ul className='search-results-items'>
                                { search.searchResults.map((result, i) => (
                                    <LocationItem key={i} item={result}/>
                                )) }
                            </ul>
                        </div>
                    </For>
                    {linkToSearchData}
                </div>
            </div>
        );
    }
});
