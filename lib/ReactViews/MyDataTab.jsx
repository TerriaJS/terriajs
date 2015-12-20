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
            previewed: undefined
        };
    },
    render: function() {
        return (<div className="panel-content row">
                <div className='col col-5'>
                <h2 className='m0 p0'> Your Data </h2>
                <div > Data catalog </div>
                <AddData />
                </div>
                <div className="data-preview preview col col-7 block">
                <DataPreview terria = {this.props.terria} previewed={this.state.previewed} />
                </div>
                </div>);
    }
});
module.exports = MyDataTab;
