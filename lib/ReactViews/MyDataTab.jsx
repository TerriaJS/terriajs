'use strict';
var React = require('react');
var DataCatalogGroup = require('./DataCatalogGroup.jsx');
var DataPreview = require('./DataPreview.jsx');
var AddData = require('./AddData.jsx');

var MyDataTab = React.createClass({
    propTypes: {
      terria: React.PropTypes.object
    },

    getInitialState: function() {
        return {
            previewed: undefined,
            dataCatalog: undefined
        };
    },

    componentWillMount: function(){
        var that = this;
        window.previewUpdate.addEventListener(function(_previewed) {
          that.setState({
              previewed: _previewed
          });
      });
    },

    updateCatalog: function(dataCatalog){
        this.setState({
            dataCatalog: dataCatalog
        });
        window.nowViewingUpdate.raiseEvent();
    },

    render: function() {
        var content = null;
        if (this.state.dataCatalog) {
            content = (<div className="added-data">
                        <small>Data added in this way is not saved or made visible to others unless you explicitly share it by using the Share panel. </small>
                        <h3 className='mt1 mb1'> Previously added data </h3>
                        <ul className = 'list-reset data-catalog'><DataCatalogGroup group={this.state.dataCatalog}/></ul>
                        </div>);
            }
        return (<div className="panel-content row">
                <div className='col col-6 absolute top-left'>
                <AddData updateCatalog={this.updateCatalog} terria={this.props.terria} />
                {content}
                </div>
                <div className="data-preview preview col col-6 relative">
                <DataPreview terria = {this.props.terria} previewed={this.state.previewed} />
                </div>
                </div>);
    }
});
module.exports = MyDataTab;
