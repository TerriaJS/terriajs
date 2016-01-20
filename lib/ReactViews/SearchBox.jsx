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
            // this does not work for the first time but works afterwards \
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
        let dataCatalogResults = this.state.dataCatalogResults;
        let bingMapSearchResults = this.state.bingMapSearchResults;
        let gazetterSearchResults = this.state.gazetterSearchResults;

        // if is searching bing map, if result is not empty, show results. otherwise show loader
        let mapSearchContent = null;

        let bingMapSearchLabel = 'Locations';
        let gazetterSearchLabel = 'Offical Place Names';
        let dataCatalogSearchLabel = 'Data Catalog';

        if ((this.props.mapSearch !== false) && value.length > 0) {
            if (bingMapSearchResults.length === 0) {
                if (this.state.bingMapIsSearching === false) {
                    mapSearchContent = (<ul className='list-reset search-result-bing-map'><li> <div className='btn label'>{bingMapSearchLabel}</div></li><li className ='label label-no-results'>No results found </li></ul>);
                } else {
                    mapSearchContent = (<ul className='list-reset search-result-bing-map'><li> <div className='btn label'>{bingMapSearchLabel}</div></li><Loader /></ul>);
                }
            } else {
                mapSearchContent = (<ul className='list-reset search-result-bing-map'><li> <div className='btn label'>{bingMapSearchLabel}</div></li>{bingMapSearchResults.map(function(item, i) {
            return (<LocationItem item={item} key={i} />);
          })}</ul>);
            }
        }

        // TO DO: simplify the search result dom

        // if is searching data catalog and result is not empty, show results, otherwise show loader
        var cataLogSearchContent = null;
        if ((this.props.dataSearch !== false) && value.length > 0) {
            if (dataCatalogResults.length === 0) {
                if (this.state.dataCatalogIsSearching === false) {
                    cataLogSearchContent = (<ul className='list-reset search-result-data-catalog data-catalog'><li> <div className='btn label'>{dataCatalogSearchLabel}</div></li><li className ='label label-no-results'>No results found </li></ul>);
                } else {
                    cataLogSearchContent = (<ul className='list-reset search-result-data-catalog data-catalog'><li> <div className='btn label'>{dataCatalogSearchLabel}</div></li> <Loader /></ul>);
                }
            } else {
                cataLogSearchContent = (<ul className='list-reset search-result-data-catalog data-catalog'><li> <div className='btn label'>{dataCatalogSearchLabel}</div></li>{dataCatalogResults.map(function(result, i) {
                    var group = result.catalogItem;

                    if (group.isGroup === true){
                        return (<DataCatalogGroup group={group} key={i} />);
                    } else {
                        return (<DataCatalogItem item={group} key={i} />);
                    }
                })}</ul>);
            }
        }

        var gazetterSearchContent = null;
        if ((this.props.gazetterSearch !== false) && value.length > 0) {
            if (gazetterSearchResults.length === 0) {
                if (this.state.gazetterIsSearching === false) {
                    gazetterSearchContent = (<ul className='list-reset search-result-data-catalog'><li> <div className='btn label'> {gazetterSearchLabel}</div></li><li className ='label label-no-results'>No results found </li></ul>);
                } else {
                    gazetterSearchContent = (<ul className='list-reset search-result-data-catalog'><li> <div className='btn label'> {gazetterSearchLabel}</div></li> <Loader /></ul>);
                }
            } else {
                gazetterSearchContent = (<ul className='list-reset search-result-data-catalog'><li> <div className='btn label'> {gazetterSearchLabel}</div></li>{gazetterSearchResults.map(function(item, i) {
            return (<LocationItem item={item} key={i} />);
          })}</ul>);
            }
        }

        //button to clear search string
        var clearSearchContent = null;
        if (value.length > 0) {
            clearSearchContent = (<button className='btn search-clear' onClick ={this.clearSearch}><i className ='icon icon-close'></i></button>);
        }

        var linkToSearchData = null;
        if ((this.props.dataSearch === false) && value.length > 0){
            linkToSearchData = (<li><ModalTriggerButton btnHtml={'Search " ' + value + ' " in Data Catalog'} classNames={'btn btn-data-search'} callback={this.openDataCatalogSearch} activeTab={1} /></li>);
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
              {cataLogSearchContent}
              {mapSearchContent}
              {gazetterSearchContent}
            </div>
          </div>
        );
    }
});
module.exports = SearchBox;
