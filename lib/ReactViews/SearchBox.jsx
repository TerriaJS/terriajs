'use strict';

import BingMapsSearchProviderViewModel from '../ViewModels/BingMapsSearchProviderViewModel.js';
import CatalogItemNameSearchProviderViewModel from '../ViewModels/CatalogItemNameSearchProviderViewModel.js';
import DataCatalogGroup from './DataCatalogGroup.jsx';
import DataCatalogItem from './DataCatalogItem.jsx';
import defined from 'terriajs-cesium/Source/Core/defined';
import GazetteerSearchProviderViewModel from '../ViewModels/GazetteerSearchProviderViewModel.js';
import Loader from './Loader.jsx';
import LocationItem from './LocationItem.jsx';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';

// Handle any of the three kinds of search based on the props
const SearchBox = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        searchText: React.PropTypes.string,
        onSearchTextChanged: React.PropTypes.func.isRequired,
        mapSearch: React.PropTypes.bool,
        dataSearch: React.PropTypes.bool,
        gazetterSearch: React.PropTypes.bool,
        onSearchCatalog: React.PropTypes.func,
        previewedCatalogItem: React.PropTypes.object,
        onPreviewedCatalogItemChanged: React.PropTypes.func
    },

    getDefaultProps() {
        return {
            searchText: '',
            mapSearch: true,
            dataSearch: true,
            gazetterSearch: true
        };
    },

    componentWillMount() {
        this.lastSearchText = undefined;
        this.debounceTimeout = undefined;
        this.dataCatalogSearch = new CatalogItemNameSearchProviderViewModel(this.props);
        this.bingMapSearch = new BingMapsSearchProviderViewModel(this.props);
        this.gazetterSearch = new GazetteerSearchProviderViewModel(this.props);
    },

    componentWillUnmount() {
        this.removeDebounceTimeout();

        // Cancel any searches that may be in progress
        this.dataCatalogSearch.search('');
        this.bingMapSearch.search('');
        this.gazetterSearch.search('');
    },

    componentDidMount() {
        this.searchWithDebounce();
    },

    componentDidUpdate() {
        this.searchWithDebounce();
    },

    removeDebounceTimeout() {
        if (defined(this.debounceTimeout)) {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = undefined;
        }
    },

    searchWithDebounce() {
        if (this.lastSearchText !== this.props.searchText) {
            // Trigger search 250ms after the last input.
            this.removeDebounceTimeout();

            this.lastSearchText = this.props.searchText;

            this.debounceTimeout = setTimeout(() => {
                this.doSearch(this.props.searchText);
                this.debounceTimeout = undefined;
            }, 250);
        }
    },

    handleChange(event) {
        this.props.onSearchTextChanged(event.target.value);
    },

    doSearch(keyword) {
        if (this.props.dataSearch) {
            this.dataCatalogSearch.search(keyword);
        }
        if (this.props.mapSearch) {
            this.bingMapSearch.search(keyword);
        }
        if (this.props.gazetterSearch) {
            this.gazetterSearch.search(keyword);
        }
    },

    clearSearch() {
        this.props.onSearchTextChanged('');
    },

    searchCatalog() {
        this.props.onSearchCatalog(this.props.searchText);
    },

    openModal() {
        this.props.setWrapperState({
            modalWindowIsOpen: true,
            activeTab: 1,
            previewed: null
        });
    },

    renderSearchResult(searchType, search) {
        if (!searchType || !defined(this.props.searchText) || this.props.searchText.length === 0) {
            return null;
        }

        const results = search.searchResults.map((result, i) => {
            if (defined(result.catalogItem) && result.catalogItem.isGroup) {
                return (<DataCatalogGroup group={result.catalogItem}
                                          key={i}
                                          isOpen={result.isOpen}
                                          onToggleOpen={result.toggleOpen.bind(result)}
                                          previewedCatalogItem={this.props.previewedCatalogItem}
                                          onPreviewedCatalogItemChanged={this.props.onPreviewedCatalogItemChanged}
                        />);
            } else if (defined(result.catalogItem)) {
                return (<DataCatalogItem item={result.catalogItem}
                                         key={i}
                                         previewedCatalogItem={this.props.previewedCatalogItem}
                                         onPreviewedCatalogItemChanged={this.props.onPreviewedCatalogItemChanged}
                        />);
            }

            return (<LocationItem item={result} key={i} />);
        });

        return (
            <div>
                <label className='label label-sub-heading'>{search.name}</label>
                <ul className='list-reset search-results-items'>
                    {search.isSearching && <Loader />}
                    {search.searchMessage && <li className ='label no-results'>{search.searchMessage}</li>}
                    {results}
                </ul>
            </div>);
    },

    render() {
        // button to clear search string
        let clearSearchContent = null;
        if (this.props.searchText.length > 0) {
            clearSearchContent = (<button className='btn search-clear' onClick ={this.clearSearch}><i className ='icon icon-clear'></i></button>);
        }

        let linkToSearchData = null;
        if ((this.props.dataSearch === false) && this.props.searchText.length > 0) {
            linkToSearchData = (<button onClick={this.searchCatalog} className='btn btn-data-search '>Search {this.props.searchText} in Data Catalog <i className='icon icon-right-arrow'></i></button>);
        }

        return (
            <div className={this.props.searchText.length > 0 ? 'is-searching search' : 'search'}>
                <form className='search-data-form relative' autoComplete='off'>
                  <label htmlFor='search' className='hide'> Type keyword to search </label>
                  <i className='icon icon-search'></i>
                  <input id='search'
                  type='text'
                  name='search'
                  value={this.props.searchText}
                  onChange={this.handleChange}
                  className='search__field field'
                  placeholder='Search'
                  autoComplete='off'/>
                  {clearSearchContent}
                </form>
                <div className ='search-results'>
                  {linkToSearchData}
                  {this.renderSearchResult(this.props.mapSearch, this.bingMapSearch)}
                  {this.renderSearchResult(this.props.gazetterSearch, this.gazetterSearch)}
                  {this.renderSearchResult(this.props.dataSearch, this.dataCatalogSearch)}
                </div>
            </div>
            );
    }
});
module.exports = SearchBox;
