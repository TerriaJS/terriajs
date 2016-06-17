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

    renderContent() {
        if (this.props.terria.catalog.userAddedDataGroup) {
            return (<div className="added-data">
                    {disclaimer}
                    <ul className='data-catalog'>
                        <DataCatalogGroup group={this.props.terria.catalog.userAddedDataGroup} viewState={this.props.viewState} />
                    </ul>
                    <button type='button' onClick={()=>this.props.viewState.myDataIsUploadView = true} className='btn--add-more-data btn btn-transparent'> Add more data</button>
                </div>
            );
        }
    },

    render() {
        return (
            <div className="panel-content">
                <div className='my-data'>
                    <div className={'add-data ' + (!this.props.terria.catalog.userAddedDataGroup ? 'is-empty' : '' + ' ' + (!this.props.viewState.myDataIsUploadView ? 'is-hidden' : ''))}>
                        <button type='button' onClick={this.changeUploadView} className='btn btn--back-to-my-data btn-transparent'> Back</button>
                        <h3>Adding your own data</h3>
                        <AddData terria={this.props.terria}
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
