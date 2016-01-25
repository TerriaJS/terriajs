'use strict';
const React = require('react');
const DataCatalogGroup = require('./DataCatalogGroup.jsx');
const DataPreview = require('./DataPreview.jsx');
const SearchBox = require('./SearchBox.jsx');

// The DataCatalog Tab
const DataCatalogTab = React.createClass({
    propTypes: {
        terria: React.PropTypes.object
    },

    getInitialState() {
        return {
            previewed: undefined
        };
    },

    onPreviewChange() {},

    renderDataCatalog(dataCatalog) {
        return (<ul className = 'list-reset data-catalog hide-on-search'>
          {dataCatalog.map((group, i) => {
              return (<DataCatalogGroup group={group} key={i}/>);
          }, this)}
        </ul>);
    },

    render() {
        const terria = this.props.terria;
        const dataCatalog = terria.catalog.group.items;
        return (
            <div className="panel-content clearfix">
              <div className="search-data col col-6">
                <SearchBox terria = {terria}
                           mapSearch = {false}
                           gazetterSearch={false}
                           defaultSearchText={this.props.defaultSearchText}/>
                {this.renderDataCatalog(dataCatalog)}
              </div>
              <div className="data-preview preview col col-6 block">
                <DataPreview terria = {terria} previewed={this.state.previewed} />
              </div>
            </div>
            );
    }
});

module.exports = DataCatalogTab;
