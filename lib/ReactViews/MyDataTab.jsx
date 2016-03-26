'use strict';
import React from 'react';
import DataCatalogGroup from './DataCatalog/DataCatalogGroup.jsx';
import DataPreview from './Preview/DataPreview.jsx';
import AddData from './AddData.jsx';
import ObserveModelMixin from './ObserveModelMixin';

const disclaimer = <p>Data added in this way is not saved or made visible to others unless you explicitly share it by
    using the Share panel. </p>;

// My data tab include Add data section and preview section
const MyDataTab = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        viewState: React.PropTypes.object
    },

    getInitialState() {
        return {
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
        if (this.state.dataCatalog) {
            return (<div className="added-data">
                    {disclaimer}
                    <ul className='data-catalog'>
                        <DataCatalogGroup group={this.state.dataCatalog} viewState={this.props.viewState} />
                    </ul>
                    <button onClick={this.changeUploadView} className='btn--add-more-data btn'> Add more data</button>
                </div>
            );
        }
    },

    render() {
        return (
            <div className="panel-content">
                <div className='my-data'>
                    <div className={'add-data ' + (!this.state.dataCatalog ? 'is-empty' : '' + ' ' + (!this.state.isUploadView ? 'is-hidden' : ''))}>
                        <button onClick={this.changeUploadView} className='btn btn--back-to-my-data'> Back</button>
                        <h3>Adding your own data</h3>
                        <AddData updateCatalog={this.updateCatalog}
                                 terria={this.props.terria}
                                 viewState={this.props.viewState}
                        />
                    </div>
                    {this.renderContent()}
                </div>
                <div className="data-preview__wrapper">
                    <DataPreview terria={this.props.terria}
                                 viewState={this.props.viewState}
                                 previewed={this.props.viewState.userDataPreviewedItem}
                    />
                </div>
            </div>
        );
    }
});
module.exports = MyDataTab;
