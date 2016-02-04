'use strict';
const React = require('react');
const DataCatalogGroup = require('./DataCatalogGroup.jsx');
const DataPreview = require('./DataPreview.jsx');
const AddData = require('./AddData.jsx');

// My data tab include Add data section and preview section
const MyDataTab = React.createClass({
    propTypes: {
        terria: React.PropTypes.object
    },

    getInitialState() {
        return {
            previewed: undefined,
            dataCatalog: undefined
        };
    },

    updateCatalog(dataCatalog) {
        this.setState({
            dataCatalog: dataCatalog
        });
        // window.nowViewingUpdate.raiseEvent();
    },

    renderContent() {
        if (this.state.dataCatalog) {
            return (<div className="added-data">
                        <small>Data added in this way is not saved or made visible to others unless you explicitly share it by using the Share panel. </small>
                        <h3 className='mt1 mb1'> Previously added data </h3>
                        <ul className = 'list-reset data-catalog'><DataCatalogGroup group={this.state.dataCatalog}/></ul>
                        </div>);
        }
    },

    render() {
        return (<div className="panel-content row">
                <div className='col col-6 absolute top-left'>
                <AddData updateCatalog={this.updateCatalog}
                         terria={this.props.terria}
                />
                {this.renderContent()}
                </div>
                <div className="data-preview preview col col-6 relative">
                <DataPreview terria={this.props.terria}
                />
                </div>
                </div>);
    }
});
module.exports = MyDataTab;
