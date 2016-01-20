'use strict';
var React = require('react');
var DataCatalogGroup = require('./DataCatalogGroup.jsx');
var DataPreview = require('./DataPreview.jsx');
var SearchBox = require('./SearchBox.jsx');

// The DataCatalog Tab
var DataCatalogTab = React.createClass({
    propTypes: {
      terria:  React.PropTypes.object
    },

    getInitialState: function() {
        return {
            previewed: undefined,
            notSearching: true
        };
    },

    componentWillMount: function() {
      var that = this;
      //Update preview app if an item has been added as previewed
      window.previewUpdate.addEventListener(function(_previewed) {
          that.setState({
              previewed: _previewed
          });
      });
    },

    onPreviewChange: function(){

    },

    checkSearch: function(_notSearching){
      this.setState({
        notSearching: _notSearching
      });
    },

    render: function() {
        let terria = this.props.terria;
        let dataCatalog = terria.catalog.group.items;

        let content = null;
        if(this.state.notSearching === true){
          content = (
            <ul className = 'list-reset'>
              {dataCatalog.map(function(group, i) {
                return (<DataCatalogGroup group={group} key={i}/>);
              }, this)}
            </ul>);
        }
        return (
            <div className="panel-content clearfix">
              <div className="search-data col col-6">
                <SearchBox terria = {terria} mapSearch = {false} gazetterSearch={false} callback={this.checkSearch}/>
                {content}
              </div>
              <div className="data-preview preview col col-6 block">
                <DataPreview terria = {terria} previewed={this.state.previewed} />
              </div>
            </div>
        );
    }
});

module.exports = DataCatalogTab;
