'use strict';
const React = require('react');
const DataCatalogGroup = require('./DataCatalogGroup.jsx');
const DataCatalogItem = require('./DataCatalogItem.jsx');
const LocationItem = require('./LocationItem.jsx');
const Loader = require('./Loader.jsx');
const ObserveModelMixin = require('./ObserveModelMixin');
const PureRenderMixin = require('react-addons-pure-render-mixin');

const ModalTriggerButton = require('./ModalTriggerButton.jsx');
const CatalogItemNameSearchProviderViewModel = require('../ViewModels/CatalogItemNameSearchProviderViewModel.js');
const BingMapsSearchProviderViewModel = require('../ViewModels/BingMapsSearchProviderViewModel.js');
const GazetteerSearchProviderViewModel = require('../ViewModels/GazetteerSearchProviderViewModel.js');

// Handle any of the three kinds of search based on the props
const SearchBox = React.createClass({
    mixins: [ObserveModelMixin, PureRenderMixin],
    propTypes: {
        mapSearch: React.PropTypes.bool,
        dataSearch: React.PropTypes.bool,
        gazetterSearch: React.PropTypes.bool,
        toggleModalWindow: React.PropTypes.func,
        setPreview: React.PropTypes.func,
        previewed: React.PropTypes.object
    },

    getDefaultProps() {
        return {
            mapSearch: true,
            dataSearch: true,
            gazetterSearch: true,
            defaultSearchText: ''
        };
    },

    getInitialState() {
        return {
            value: this.props.defaultSearchText,
            dataCatalogResults: [],
            dataCatalogIsSearching: false,
            bingMapSearchResults: [],
            bingMapIsSearching: false,
            gazetterIsSearching: false,
            gazetterSearchResults: []
        };
    },

    componentWillMount() {
        this.dataCatalogSearch = new CatalogItemNameSearchProviderViewModel(this.props);
        this.bingMapSearch = new BingMapsSearchProviderViewModel(this.props);
        this.gazetterSearch = new GazetteerSearchProviderViewModel(this.props);
    },

    componentWillReceiveProps(nextProps) {
        this.setState({
            value: nextProps.defaultSearchText
        });
        this.doSearch(nextProps.defaultSearchText);
    },

    handleChange(event) {
        this.setState({
            value: event.target.value
        });
        this.doSearch(event.target.value);
    },

    doSearch(keyword) {
        if (this.props.dataSearch !== false) {
            this.dataCatalogSearch.search(keyword);
        }
        if (this.props.mapSearch !== false) {
            this.bingMapSearch.search(keyword);
        }
        if (this.props.gazetterSearch !== false) {
            this.gazetterSearch.search(keyword);
        }
    },

    clearSearch() {
        this.setState({
            value: ''
        });
    },

    searchKeyword(_component) {
        _component.setState({
            defaultSearchText: this.state.value
        });
    },

    renderSearchResult(searchType, search) {
        const value = this.state.value;
        let content = null;
        let results = <Loader />;
        if ((searchType) && value.length > 0) {
            if(search.searchResults.length > 0) {
                if (search.name !== 'Catalogue Items') {
                    results = search.searchResults.map((item, i) => {
                        return (<LocationItem item={item} key={i} />);
                    });
                } else {
                    results = search.searchResults.map((result, i) => {
                        const group = result.catalogItem;
                        if (group.isGroup === true) {
                            return (<DataCatalogGroup group={group}
                                                      key={i}
                                                      setPreview={this.props.setPreview}
                                                      previewed={this.props.previewed}
                                    />);
                        }
                        return (<DataCatalogItem item={group}
                                                 key={i}
                                                 setPreview={this.props.setPreview}
                                                 previewed={this.props.previewed}
                                />);
                    });
                }
            }
            else {
                results = <li className ='label no-results'>No results found </li>;
            }

            content = <div>
                        <label className='label label-sub-heading'>{search.name}</label>
                        <ul className='list-reset search-results-items'>{results}</ul>
                      </div>;
        }
        return content;
    },

    render() {
        const value = this.state.value;

        // button to clear search string
        let clearSearchContent = null;
        if (value.length > 0) {
            clearSearchContent = (<button className='btn search-clear' onClick ={this.clearSearch}><i className ='icon icon-close'></i></button>);
        }

        let linkToSearchData = null;
        if ((this.props.dataSearch === false) && value.length > 0) {
            linkToSearchData = (<ModalTriggerButton btnHtml={'Search " ' + value + ' " in Data Catalog'} classNames={'btn btn-data-search'} callback={this.searchKeyword} activeTab={1} toggleModalWindow={this.props.toggleModalWindow} />);
        }

        return (
            <div className={this.state.value.length > 0 ? 'is-searching search' : 'search'}>
                <form className='search-data-form relative' autoComplete='off'>
                  <label htmlFor='search' className='hide'> Type keyword to search </label>
                  <i className='icon icon-search'></i>
                  <input id='search'
                  type='text'
                  name='search'
                  value={value}
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
