'use strict';
const React = require('react');
const DataCatalogGroup = require('./DataCatalogGroup.jsx');
const DataPreview = require('./DataPreview.jsx');
const AddData = require('./AddData.jsx');

const disclaimer = <p>Data added in this way is not saved or made visible to others unless you explicitly share it by using the Share panel. </p> ;

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
            dataCatalog: undefined,
            isUploadView: true
        };
    },

    updateCatalog(dataCatalog) {
        this.setState({
            dataCatalog: dataCatalog,
            isUploadView: false
        });
    },

    changeUploadView() {
        this.setState({
            isUploadView: !this.state.isUploadView
        });
    },

    renderContent() {
        if(this.state.isUploadView === true) {
            return (
                    <div className={'add-data ' + (!this.state.dataCatalog ? 'is-empty' : '')}>
                    <button onClick={this.changeUploadView} className='btn btn--back-to-my-data'> Back </button>
                        <h4>Adding your own data</h4>
                        <AddData updateCatalog={this.updateCatalog}
                                 terria={this.props.terria}
                                 isDraggingDroppingFile ={this.props.isDraggingDroppingFile}
                                 onFinishDroppingFile={this.props.onFinishDroppingFile}
                        />
                    </div>
                    );
        }
        if (this.state.dataCatalog) {
            return (<div className="added-data">
                        {disclaimer}
                        <ul className = 'data-catalog'>
                            <DataCatalogGroup group={this.state.dataCatalog}
                                              onPreviewedCatalogItemChanged={this.props.onPreviewedCatalogItemChanged}
                                              userData={true}
                            />
                        </ul>
                        <button onClick={this.changeUploadView} className='btn--add-more-data btn'> Add more data</button>
                        </div>
                    );
        }

        return (<div className="added-data no-added-data">
                <p> You currently don't have any data </p>
                <button onClick={this.changeUploadView} className='btn--add-more-data btn'> Add more data</button>
                </div>);
    },

    render() {
        return (<div className="panel-content">
                <div className='my-data'>
                {this.renderContent()}
                </div>
                <div className="data-preview">
                <DataPreview terria={this.props.terria}
                             previewedCatalogItem={this.props.myDataPreviewedCatalogItem}
                />
                </div>
                </div>);
    }
});
module.exports = MyDataTab;
