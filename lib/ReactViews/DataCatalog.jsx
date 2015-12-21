'use strict';
var React = require('react');
var DataCatalogGroup = require('./DataCatalogGroup.jsx');
var DataPreview = require('./DataPreview.jsx');
var SearchBox = require('./SearchBox.jsx');

var DataCatalog = React.createClass({
    propTypes: {
      terria:  React.PropTypes.object
    },

    getInitialState: function() {
        return {
            openId: '',
            previewed: undefined
        };
    },

    componentWillMount: function() {
      var that = this;
      window.previewUpdate.addEventListener(function(_previewed) {
          that.setState({
              previewed: _previewed
          });
      });
    },

    render: function() {
        var terria = this.props.terria;
        var dataCatalog = terria.catalog.group.items;
        return (
            <div className="panel-content clearfix">
              <div className="search-data col col-6">
                <SearchBox terria = {terria} mapSearch = {false} gazetterSearch={false}/>
                <ul className = 'list-reset data-catalog hide-if-searching'>
                  {dataCatalog.map(function(group, i) {
                    return (<DataCatalogGroup group={group} key={i}/>);
                  }, this)}
                </ul>
              </div>
              <div className="data-preview preview col col-6 block">
                <DataPreview terria = {terria} previewed={this.state.previewed} />
              </div>
            </div>
        );
    }
});

module.exports = DataCatalog;
