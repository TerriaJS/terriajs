'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
import SearchHeader from './Search/SearchHeader.jsx';
import SearchBox from './Search/SearchBox.jsx';
import classNames from 'classnames';
import LocationItem from './LocationItem.jsx';

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

    getInitialState() {
        return {
            searchText: this.props.searchText
        }
    },

    componentWillMount() {
        this.setState({
            searches: this.props.searches || []
        });
    },

    componentWillUnmount() {
        // Cancel any searches that may be in progress
        this.search('');
    },

    search(newText) {
        this.setState({
            searchText: newText
        });
        this.state.searches.forEach(search => search.search(newText));
    },

    searchInDataCatalog() {
        this.props.viewState.searchInCatalog(this.state.searchText);
    },

    render() {
        let linkToSearchData = null;
        if (this.state.searchText.length > 0) {
            linkToSearchData = (
                <button onClick={this.searchInDataCatalog} className='btn btn-data-search'>
                    Search {this.state.searchText} in Data
                    Catalog<i className='icon icon-right-arrow'/></button>);
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
                    {this.state.searches
                        .filter(search => search.isSearching || (search.SearchHeader && search.SearchHeader.length))
                        .map(search => (
                            <div key={search.constructor.name}>
                                <label className='label label-sub-heading'>{search.name}</label>
                                <SearchHeader {...search} />
                                <ul className='list-reset search-results-items'>
                                    { search.SearchHeader.map((result, i) => (
                                        <LocationItem key={result.name} item={result}/>
                                    )) }
                                </ul>
                            </div>
                        ))
                    }
                </div>
            </div>
        );
    },

    searchResult(result) {
    }
});
