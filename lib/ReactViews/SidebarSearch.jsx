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
    },

    searchInDataCatalog() {
        this.props.viewState.searchInCatalog(this.props.viewState.searchState.locationSearchText);
    },

    backToNowViewing() {
        this.props.viewState.searchState.hideLocationSearch = true;
    },

    render() {
        let linkToSearchData = null;

        if (this.props.viewState.searchState.locationSearchText.length > 0) {
            linkToSearchData = (
                <button type='button' onClick={this.searchInDataCatalog} className='btn btn--data-search'>
                    Search {this.props.viewState.searchState.locationSearchText} in the Data
                    Catalog<i className='icon icon-right-arrow'/></button>);
        }

        return (
            <div className='search'>
                <div className='search__results'>
                    <ul className="now-viewing__header">
                        <li><label className='label'>Search Results</label></li>
                        <li><label className='label--badge label'>{this.props.viewState.searchState.locationSearchResults.reduce((count, result) => count + result.searchResults.length, 0)}</label></li>
                        <li>
                            <button type='button' onClick={this.backToNowViewing} className='btn right btn--search-done'>Done</button>
                        </li>
                    </ul>
                    <For each="search" of={this.props.viewState.searchState.locationSearchResults}>
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
