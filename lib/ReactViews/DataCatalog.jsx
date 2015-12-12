'use strict';
var React = require('react');
var DataCatalogGroup = require('./DataCatalogGroup.jsx');
var DataPreview = require('./DataPreview.jsx');
var SearchBox = require('./SearchBox.jsx');
var when = require('terriajs-cesium/Source/ThirdParty/when');

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

    handleChildClick: function(i, obj) {
        var that = this;
        obj.props.group.isOpen = !obj.state.isOpen;
        obj.setState({
            isOpen: !obj.state.isOpen
        });

        if (obj.state.isOpen === false) {
            when(obj.props.group.load()).then(function() {
                that.setState({
                    openId: i
                });
            });
        }
    },

    render: function() {
        var terria = this.props.terria;
        var dataCatalog = terria.catalog.group.items;
        return (
            <div className="panel-content clearfix">
              <div className="search-data col col-5">
                <SearchBox terria = {terria} mapSearch = {false} gazetterSearch={false}/>
                <ul className = 'list-reset data-catalog hide-if-searching'>
                  {dataCatalog.map(function(group, i) {
                    return (<DataCatalogGroup onClick={this.handleChildClick.bind(this, i)} group={group} items={group.items} isLoading={group.isLoading} key={i} />);
                  }, this)}
                </ul>
              </div>
              <div className="data-preview preview col col-7 col-right block">
                <DataPreview terria = {terria} previewed={this.state.previewed} />
              </div>
            </div>
        );
    }
});

module.exports = DataCatalog;
