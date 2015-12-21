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
                <div className='col col-6'>
                <div className="added-data">
                <h3> Previously added data </h3>
                <div > Data catalog </div>
                </div>
                <AddData terria={this.props.terria} />
                </div>
                <div className="data-preview preview col col-6 block">
                <DataPreview terria = {this.props.terria} previewed={this.state.previewed} />
                </div>
                </div>);
    }
});
module.exports = MyDataTab;
