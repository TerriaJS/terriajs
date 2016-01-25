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
const SearchBox = React.createClass({
    propTypes: {
        mapSearch: React.PropTypes.bool,
        dataSearch: React.PropTypes.bool,
        gazetterSearch: React.PropTypes.bool,
        callback: React.PropTypes.func,
        toggleModalWindow: React.PropTypes.func
    },

    getDefaultProps() {
        return {
            mapSearch: true,
            dataSearch: true,
            gazetterSearch: true
        };
    },

    getInitialState() {
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

    componentWillMount() {
        const that = this;
        // window.searchData.addEventListener((value) => {
        //     that.setState({
        //         value: value
        //     });
        //     const fakeEvent = {
        //         target: {
        //             value: value
        //         }
        //     };
        //     // This does not work for the first time but works afterwards
        //     // Not sure how to let the modal knows search has started
        //     that.handleChange(fakeEvent);
        // });
    },

    handleChange(event) {
        this.setState({
            value: event.target.value
        });

        if (this.props.callback && typeof this.props.callback === 'function') {
            this.props.callback(!event.target.value);
        }

        const dataCatalogSearch = new CatalogItemNameSearchProviderViewModel(this.props);
        const bingMapSearch = new BingMapsSearchProviderViewModel(this.props);
        const gazetterSearch = new GazetteerSearchProviderViewModel(this.props);
        const that = this;

        if (that.props.dataSearch !== false) {
            when(dataCatalogSearch.search(event.target.value)).then(() => {
                that.setState({
                    dataCatalogResults: dataCatalogSearch.searchResults,
                    dataCatalogIsSearching: dataCatalogSearch.isSearching
                });
            });
        }

        if (that.props.mapSearch !== false) {
            when(bingMapSearch.search(event.target.value)).then(() => {
                that.setState({
                    bingMapSearchResults: bingMapSearch.searchResults,
                    bingMapIsSearching: bingMapSearch.isSearching
                });
            });
        }

        if (that.props.gazetterSearch !== false) {
            when(gazetterSearch.search(event.target.value)).then(() => {
                that.setState({
                    gazetterSearchResults: gazetterSearch.searchResults,
                    gazetterIsSearching: gazetterSearch.isSearching
                });
            });
        }
    },

    clearSearch() {
        this.setState({
            value: ''
        });
        this.props.callback(true);
    },

    openDataCatalogSearch() {
        // window.searchData.raiseEvent(this.state.value);
    },

    renderSearchResult(searchType, searchResults, searchState, resultLabel) {
        const that = this;
        const value = this.state.value;
        let content = null;
        let results = null;

        if ((searchType) && value.length > 0) {
            if (searchResults.length === 0) {
                if (searchState) {
                    results = <Loader />;
                } else {
                    results = <li className ='label'>No results found </li>;
                }
            }
            if (searchType !== that.props.dataSearch) {
                results = searchResults.map((item, i) => {
                    return (<LocationItem item={item} key={i} />);
                });
            } else {
                results = searchResults.map((result, i) => {
                    const group = result.catalogItem;
                    if (group.isGroup === true) {
                        return (<DataCatalogGroup group={group} key={i} />);
                    }
                    return (<DataCatalogItem item={group} key={i} />);
                });
            }
            content = <div><label className='label label-sub-heading'>{resultLabel}</label><ul className='list-reset search-results-items'>{results}</ul></div>;
        }
        return content;
    },

    render() {
        const that = this;
        const value = this.state.value;
        const bingMapSearchLabel = 'Locations';
        const gazetterSearchLabel = 'Offical Place Names';
        const dataCatalogSearchLabel = 'Data Catalog';

        // button to clear search string
        let clearSearchContent = null;
        if (value.length > 0) {
            clearSearchContent = (<button className='btn search-clear' onClick ={this.clearSearch}><i className ='icon icon-close'></i></button>);
        }

        let linkToSearchData = null;
        if ((this.props.dataSearch === false) && value.length > 0) {
            linkToSearchData = (<ModalTriggerButton btnHtml={'Search " ' + value + ' " in Data Catalog'} classNames={'btn btn-data-search'} callback={this.openDataCatalogSearch} activeTab={1} toggleModalWindow={this.props.toggleModalWindow} />);
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
          {this.renderSearchResult(that.props.mapSearch, that.state.bingMapSearchResults, that.state.bingMapIsSearching, bingMapSearchLabel)}
          {this.renderSearchResult(that.props.gazetterSearch, that.state.gazetterSearchResults, that.state.gazetterIsSearching, gazetterSearchLabel)}
          {this.renderSearchResult(that.props.dataSearch, that.state.dataCatalogResults, that.state.dataCatalogIsSearching, dataCatalogSearchLabel)}
        </div>
      </div>
            );
    }
});
module.exports = SearchBox;
