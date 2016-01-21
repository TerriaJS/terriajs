'use strict';
const React = require('react');
const DataCatalogGroup = require('./DataCatalogGroup.jsx');
const DataCatalogItem = require('./DataCatalogItem.jsx');
const LocationItem = require('./LocationItem.jsx');
const Loader = require('./Loader.jsx');

const ModalTriggerButton = require('./ModalTriggerButton.jsx');
const CatalogItemNameSearchProviderViewModel = require('../ViewModels/CatalogItemNameSearchProviderViewModel.js');
const BingMapsSearchProviderViewModel = require('../ViewModels/BingMapsSearchProviderViewModel.js');
const GazetteerSearchProviderViewModel = require('../ViewModels/GazetteerSearchProviderViewModel.js');
const when = require('terriajs-cesium/Source/ThirdParty/when');

// Handle any of the three kinds of search based on the props
let SearchBox = React.createClass({
    propTypes: {
        mapSearch: React.PropTypes.bool,
        dataSearch: React.PropTypes.bool,
        gazetterSearch : React.PropTypes.bool,
        callback: React.PropTypes.func
    },

    getDefaultProps: function() {
      return {
        mapSearch: true,
        dataSearch: true,
        gazetterSearch: true
        };
    },

    getInitialState: function() {
        return {
            value: '',
            dataCatalogResults: [],
            dataCatalogIsSearching: false,
            bingMapSearchResults: [],
            bingMapIsSearching: false,
            gazetterIsSearching: false,
            gazetterSearchResults: []
        };
    },

    componentWillMount: function() {
        var that = this;
        window.searchData.addEventListener(function(value) {
            that.setState({
                value: value
            });
            var fakeEvent = {
                target: {
                    value: value
                }
            };
            // This does not work for the first time but works afterwards
            // Not sure how to let the modal knows search has started
            that.handleChange(fakeEvent);
        });
    },

    handleChange: function(event) {
        this.setState({
            value: event.target.value
        });

        if(this.props.callback && typeof this.props.callback === 'function'){
            this.props.callback(!event.target.value);
        }

        var dataCatalogSearch = new CatalogItemNameSearchProviderViewModel(this.props);
        var bingMapSearch = new BingMapsSearchProviderViewModel(this.props);
        var gazetterSearch = new GazetteerSearchProviderViewModel(this.props);
        var that = this;

        if (that.props.dataSearch !== false) {
            when(dataCatalogSearch.search(event.target.value)).then(function() {
                that.setState({
                    dataCatalogResults: dataCatalogSearch.searchResults,
                    dataCatalogIsSearching: dataCatalogSearch.isSearching
                });
            });
        }

        if (that.props.mapSearch !== false) {
            when(bingMapSearch.search(event.target.value)).then(function() {
                that.setState({
                    bingMapSearchResults: bingMapSearch.searchResults,
                    bingMapIsSearching: bingMapSearch.isSearching
                });
            });
        }

        if (that.props.gazetterSearch !== false){
            when(gazetterSearch.search(event.target.value)).then(function(){
                that.setState({
                    gazetterSearchResults: gazetterSearch.searchResults,
                    gazetterIsSearching: gazetterSearch.isSearching
                });
            });
        }
    },

    clearSearch: function() {
        this.setState({
            value: ''
        });
        this.props.callback(true);
    },

    openDataCatalogSearch: function(){
        window.searchData.raiseEvent(this.state.value);
    },

    render: function() {
        let value = this.state.value;
        let that = this;

        // if is searching bing map, if result is not empty, show results. otherwise show loader
        let mapSearchContent = null;

        let bingMapSearchLabel = 'Locations';
        let gazetterSearchLabel = 'Offical Place Names';
        let dataCatalogSearchLabel = 'Data Catalog';

        function getSearchResult(searchType, searchResults, searchState, resultLabel) {
            let content = null;
            let results = null;

            if((searchType) && value.length > 0){
                if(searchResults.length === 0){
                    if(searchState){
                        results = <Loader />
                    } else{
                        results = <li className ='label'>No results found </li>;
                    }
                }
                else{
                    if(searchType !== that.props.dataSearch){
                        results = searchResults.map(function(item, i) {
                                    return (<LocationItem item={item} key={i} />);
                                  });
                        }
                    else{
                        results = searchResults.map(function(result, i) {
                            let group = result.catalogItem;

                                if (group.isGroup === true){
                                    return (<DataCatalogGroup group={group} key={i} />);
                                } else {
                                    return (<DataCatalogItem item={group} key={i} />);
                                }
                            });
                    }
                }
                content = <div><label className='label'>{resultLabel}</label><ul className='list-reset search-results-items'>{results}</ul></div>
            }
            return content;
        }

        //button to clear search string
        let clearSearchContent = null;
        if (value.length > 0) {
            clearSearchContent = (<button className='btn search-clear' onClick ={this.clearSearch}><i className ='icon icon-close'></i></button>);
        }

        let linkToSearchData = null;
        if ((this.props.dataSearch === false) && value.length > 0){
            linkToSearchData = (<ModalTriggerButton btnHtml={'Search " ' + value + ' " in Data Catalog'} classNames={'btn btn-data-search'} callback={this.openDataCatalogSearch} activeTab={1} />);
        }

        return (
            <div className='search-data-search'>
            <form className='search-data-form relative' autoComplete='off'>
              <label htmlFor='search' className='hide'> Type keyword to search </label>
              <i className='icon icon-search'></i>
              <input id='search' type='text' name='search' value={value} onChange={this.handleChange} className='search__field field' placeholder='Search' autoComplete='off'/>
              {clearSearchContent}
            </form>
            <div className ='search-results'>
              {linkToSearchData}
              {getSearchResult(that.props.mapSearch, that.state.bingMapSearchResults, that.state.bingMapIsSearching, bingMapSearchLabel)}
              {getSearchResult(that.props.gazetterSearch, that.state.gazetterSearchResults, that.state.gazetterIsSearching, gazetterSearchLabel)}
              {getSearchResult(that.props.dataSearch, that.state.dataCatalogResults, that.state.dataCatalogIsSearching, dataCatalogSearchLabel)}
            </div>
          </div>
        );
    }
});
module.exports = SearchBox;
