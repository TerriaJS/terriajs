'use strict';
const React = require('react');
const DataCatalogGroup = require('./DataCatalogGroup.jsx');
const DataPreview = require('./DataPreview.jsx');
const AddData = require('./AddData.jsx');

// My data tab include Add data section and preview section
const MyDataTab = React.createClass({
    propTypes: {
        terria: React.PropTypes.object,
        onPreviewedCatalogItemChanged: React.PropTypes.func,
        myDataPreviewedCatalogItem: React.PropTypes.object,
        isDraggingDroppingFile: React.PropTypes.bool,
        onFinishDroppingFile: React.PropTypes.func
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
    },

    renderContent() {
        if (this.state.dataCatalog) {
            return (<div className="added-data">
                        <small>Data added in this way is not saved or made visible to others unless you explicitly share it by using the Share panel. </small>
                        <h3 className='mt1 mb1'> My data sets </h3>
                        <ul className = 'list-reset data-catalog'><DataCatalogGroup group={this.state.dataCatalog}
                                                                                    onPreviewedCatalogItemChanged={this.props.onPreviewedCatalogItemChanged}
                                                                                    userData={true}
                                                                  /></ul>
                        </div>);
        }
    },

    render() {
        return (<div className="panel-content row">
                <div className='col col-6 absolute top-left'>
                <AddData updateCatalog={this.updateCatalog}
                         terria={this.props.terria}
                         isDraggingDroppingFile ={this.props.isDraggingDroppingFile}
                         onFinishDroppingFile={this.props.onFinishDroppingFile}
                />
                {this.renderContent()}
                </div>
                <div className="data-preview preview col col-6 relative">
                <DataPreview terria={this.props.terria}
                             previewedCatalogItem={this.props.myDataPreviewedCatalogItem}
                />
                </div>
                </div>);
    }
});
module.exports = MyDataTab;
