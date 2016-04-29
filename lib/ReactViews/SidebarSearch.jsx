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
            searchText: ''
        };
    },

    componentWillMount() {
        this.setState({
            searches: this.props.searches || []
        });
    },

    componentDidMount() {
        this.search(this.props.searchText || '');
    },

    componentWillReceiveProps(nextProps) {
        this.search(nextProps.searchText || '');
    },

    componentWillUnmount() {
        // Cancel any searches that may be in progress
        this.search('');
    },

    search(newText) {
        this.state.searches.forEach(search => search.search(newText));
    },

    searchInDataCatalog() {
        this.props.viewState.searchInCatalog(this.props.searchText);
    },

    render() {
        let linkToSearchData = null;

        if (this.props.searchText.length > 0) {
            linkToSearchData = (
                <button type='button' onClick={this.searchInDataCatalog} className='btn btn--data-search'>
                    Search {this.props.searchText} in Data
                    Catalog<i className='icon icon-right-arrow'/></button>);
        }

        return (
            <div className='search'>
                <div className='search__results'>
                    {linkToSearchData}
                    {this.state.searches
                        .filter(search => search.isSearching || (search.searchResults && search.searchResults.length))
                        .map(search => (
                            <div key={search.constructor.name}>
                                <label className='label label-sub-heading'>{search.name}</label>
                                <SearchHeader {...search} />
                                <ul className='search-results-items'>
                                    { search.searchResults.map((result, i) => (
                                        <LocationItem key={i} item={result}/>
                                    )) }
                                </ul>
                            </div>
                        ))
                    }
                </div>
            </div>
        );
    }
});
