'use strict';
var React = require('react');
var DataCatalogItem = require('./DataCatalogItem.jsx');
var LocationItem = require('./LocationItem.jsx');
var Loader = require('./Loader.jsx');


var CatalogItemNameSearchProviderViewModel = require('../ViewModels/CatalogItemNameSearchProviderViewModel.js');
var BingMapsSearchProviderViewModel = require('../ViewModels/BingMapsSearchProviderViewModel.js');
var GazetteerSearchProviderViewModel = require('../ViewModels/GazetteerSearchProviderViewModel.js');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var SearchBox = React.createClass({
    propTypes: {
        mapSearch: React.PropTypes.bool,
        dataSearch: React.PropTypes.bool,
        gazetterSearch : React.PropTypes.bool
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
    handleChange: function(event) {
        this.setState({
            value: event.target.value
        });
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

        if(that.props.gazetterSearch !== false){
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
    },

    render: function() {
        var value = this.state.value;
        var dataCatalogResults = this.state.dataCatalogResults;
        var bingMapSearchResults = this.state.bingMapSearchResults;
        var gazetterSearchResults = this.state.gazetterSearchResults;

        var searchingClass = 'search-data-search ' + (this.state.value.length > 0 ? 'searching' : '');

        // if is searching bing map, if result is not empty, show results. otherwise show loader
        var mapSearchContent = null;
        if ((this.props.mapSearch !== false) && value.length > 0) {
            if (bingMapSearchResults.length === 0) {
                if (this.state.bingMapIsSearching === false) {
                    mapSearchContent = (<ul className='list-reset search-result-bing-map'><li> <button className='btn label'> Bing Map Search Results</button></li><li className ='label label-no-results'>No results found </li></ul>);
                } else {
                    mapSearchContent = (<ul className='list-reset search-result-bing-map'><li> <button className='btn label'> Bing Map Search Results</button></li><Loader /></ul>);
                }
            } else {
                mapSearchContent = (<ul className='list-reset search-result-bing-map'><li> <button className='btn label'> Bing Map Search Results</button></li>{bingMapSearchResults.map(function(item, i) {
            return (<LocationItem item={item} key={i} />);
          })}</ul>);
            }
        }

        // if is searching data catalog and result is not empty, show results, otherwise show loader
        var cataLogSearchContent = null;
        if ((this.props.dataSearch !== false) && value.length > 0) {
            if (dataCatalogResults.length === 0) {
                if (this.state.dataCatalogIsSearching === false) {
                    cataLogSearchContent = (<ul className='list-reset search-result-data-catalog'><li> <button className='btn label'> Data Catalog Search Results</button></li><li className ='label label-no-results'>No results found </li></ul>);
                } else {
                    cataLogSearchContent = (<ul className='list-reset search-result-data-catalog'><li> <button className='btn label'> Data Catalog Search Results</button></li> <Loader /></ul>);
                }
            } else {
                cataLogSearchContent = (<ul className='list-reset search-result-data-catalog'><li> <button className='btn label'> Data Catalog Search Results</button></li>{dataCatalogResults.map(function(item, i) {
            return (<DataCatalogItem item={item.catalogItem} key={i} />);
          })}</ul>);
            }
        }

        var gazetterSearchContent = null;
        if ((this.props.gazetterSearch !== false) && value.length > 0) {
            if (gazetterSearchResults.length === 0) {
                if (this.state.gazetterIsSearching === false) {
                    gazetterSearchContent = (<ul className='list-reset search-result-data-catalog'><li> <button className='btn label'> Gazetter Search Results</button></li><li className ='label label-no-results'>No results found </li></ul>);
                } else {
                    gazetterSearchContent = (<ul className='list-reset search-result-data-catalog'><li> <button className='btn label'> Gazetter Search Results</button></li> <Loader /></ul>);
                }
            } else {
                gazetterSearchContent = (<ul className='list-reset search-result-data-catalog'><li> <button className='btn label'> Gazetter Search Results</button></li>{gazetterSearchResults.map(function(item, i) {
            return (<LocationItem item={item} key={i} />);
          })}</ul>);
            }
        }

        //button to clear search string
        var clearSearchContent = null;
        if (value.length > 0) {
            clearSearchContent = (<button className='btn search-clear' onClick ={this.clearSearch}><i className ='icon icon-close'></i></button>);
        }

        return (
            <div className={searchingClass}>
        <form className='search-data-form relative' autoComplete='off'>
          <label htmlFor='search' className='hide'> Type keyword to search </label>
          <i className='icon icon-search'></i>
          <input id='search' type='text' name='search' value={value} onChange={this.handleChange} className='search__field field' placeholder='Search' autoComplete='off'/>
          {clearSearchContent}
        </form>
        <ul className ='list-reset search-results'>
          {cataLogSearchContent}
          {mapSearchContent}
          {gazetterSearchContent}
        </ul>
      </div>
        );
    }
});
module.exports = SearchBox;
