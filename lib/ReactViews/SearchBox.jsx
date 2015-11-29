'use strict';
var DataCatalogItem = require('./DataCatalogItem.jsx');
var LocationItem = require('./LocationItem.jsx');
var Loader = require('./Loader.jsx');


var CatalogItemNameSearchProviderViewModel = require('../ViewModels/CatalogItemNameSearchProviderViewModel.js');
var BingMapsSearchProviderViewModel = require('../ViewModels/BingMapsSearchProviderViewModel.js');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var SearchBox = React.createClass({
  getInitialState: function() {
    return {
      value: '',
      dataCatalogResults: [],
      bingMapSearchResults: []
    };
  },
  handleChange: function(event) {
    this.setState({
      value: event.target.value
    });
    var dataCatalogSearch = new CatalogItemNameSearchProviderViewModel(this.props);
    var bingMapSearch = new BingMapsSearchProviderViewModel(this.props);
    var that = this;

    //this is a promise
    when(dataCatalogSearch.search(event.target.value)).then(function(){
      that.setState({
        dataCatalogResults: dataCatalogSearch.searchResults
      })
    });

    if(that.props.mapSearch !== false){
       when(bingMapSearch.search(event.target.value)).then(function(){
        that.setState({
          bingMapSearchResults: bingMapSearch.searchResults
        })
      });
    }
  },

  render: function() {
    var value = this.state.value;
    var dataCatalogResults = this.state.dataCatalogResults;
    var bingMapSearchResults = this.state.bingMapSearchResults;
    var searchingClass = 'search-data-search '+ (this.state.value.length > 0 ? 'searching': '');

    // if is searching bing map, if result is not empty, show results. otherwise show loader
    var mapSearchContent = null;
    if((this.props.mapSearch !== false) && value.length > 0){
      if(bingMapSearchResults.length === 0){
        mapSearchContent = (<ul className='list-reset search-result-bing-map'><li> <button className='btn label'> Bing Map Search Results</button></li> <Loader /></ul>);
      } else{
        mapSearchContent = (<ul className='list-reset search-result-bing-map'><li> <button className='btn label'> Bing Map Search Results</button></li>{bingMapSearchResults.map(function(item, i) {
            return (<LocationItem item={item} key={i} />);
          })}</ul>);
      }
    }

    // if is searching data catalog and result is not empty, show results, otherwise show loader
    var cataLogSearchContent = null;
    if(value.length > 0){
      if(dataCatalogResults.length === 0){
        cataLogSearchContent = (<ul className='list-reset search-result-data-catalog'><li> <button className='btn label'> Data Catalog Search Results</button></li> <Loader /></ul>);
      } else{
        cataLogSearchContent = (<ul className='list-reset search-result-data-catalog'><li> <button className='btn label'> Bing Map Search Results</button></li>{dataCatalogResults.map(function(item, i) {
            return (<DataCatalogItem item={item.catalogItem} key={i} />);
          })}</ul>);
      }
    }

    return (
      <div className={searchingClass}>
        <form className='search-data-form relative'>
          <label htmlFor='search' className='hide'> Type keyword to search </label>
          <i className='fa fa-search'></i>
          <input id='search' type='text' name='search' value={value} onChange={this.handleChange} className='search__field field' placeholder='Search'/>
        </form>
        <ul className ='list-reset search-results'>
          {cataLogSearchContent}
          {mapSearchContent}
        </ul>
      </div>
    );
  }
});
module.exports = SearchBox;
