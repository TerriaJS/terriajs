'use strict';

import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
import SearchHeader from './Search/SearchHeader.jsx';
import LocationItem from './LocationItem.jsx';

// Handle any of the three kinds of search based on the props
export default React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        viewState: React.PropTypes.object.isRequired,
        isWaitingForSearchToStart: React.PropTypes.bool
    },

    searchInDataCatalog() {
        this.props.viewState.searchInCatalog(this.props.viewState.searchState.locationSearchText);
    },

    backToNowViewing() {
        this.props.viewState.searchState.showLocationSearch = false;
    },

    render() {
        let linkToSearchData = null;

        if (this.props.viewState.searchState.locationSearchText.length > 0) {
            linkToSearchData = (
                <button type='button' onClick={this.searchInDataCatalog} className='btn btn--data-search'>
                    Search {this.props.viewState.searchState.locationSearchText} in the Data
                    Catalog<i className='icon icon-right-arrow'/></button>);
        }

        const searchResultCount = this.props.viewState.searchState.locationSearchProviders.reduce((count, result) => count + result.searchResults.length, 0);

        return (
            <div className='search'>
                <div className='search__results'>
                    <ul className="now-viewing__header">
                        <li><label className='label'>Search Results</label></li>
                        <li><label className='label--badge label'>{searchResultCount}</label></li>
                        <li>
                            <button type='button' onClick={this.backToNowViewing} className='btn right btn--search-done'>Done</button>
                        </li>
                    </ul>
                    <For each="search" of={this.props.viewState.searchState.locationSearchProviders}>
                        <div key={search.constructor.name}>
                            <label className='label label-sub-heading'>{search.name}</label>
                            <SearchHeader searchProvider={search} isWaitingForSearchToStart={this.props.isWaitingForSearchToStart} />
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
