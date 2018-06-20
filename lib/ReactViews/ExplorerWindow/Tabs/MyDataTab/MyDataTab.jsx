import React from 'react';

import createReactClass from 'create-react-class';

import PropTypes from 'prop-types';

import DataCatalogGroup from '../../../DataCatalog/DataCatalogGroup';
import DataPreview from '../../../Preview/DataPreview';
import AddData from './AddData';
import ObserveModelMixin from '../../../ObserveModelMixin';

import Styles from './my-data-tab.scss';

// My data tab include Add data section and preview section
const MyDataTab = createReactClass({
    displayName: 'MyDataTab',
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: PropTypes.object,
        viewState: PropTypes.object
    },

    onBackButtonClicked() {
        this.props.viewState.myDataIsUploadView = false;
    },

    onAddMoreDataButtonClicked() {
        this.props.viewState.myDataIsUploadView = true;
    },

    hasUserAddedData() {
        return this.props.terria.catalog.userAddedDataGroup.items.length > 0;
    },

    render() {
        return (
            <div className={Styles.root}>
                <div className={Styles.leftCol}>
                    <If condition={this.props.viewState.myDataIsUploadView}>
                        <div className={Styles.addedData}>
                            <If condition={this.hasUserAddedData()}>
                                <button type='button'
                                        onClick={this.onBackButtonClicked}
                                        className={Styles.btnBackToMyData}>
                                    Back
                                </button>
                            </If>
                            <h3 className={Styles.h3}>Adding your own data</h3>
                            <AddData terria={this.props.terria}
                                     viewState={this.props.viewState}/>
                        </div>
                    </If>
                    <If condition={this.hasUserAddedData()}>
                        <div className={Styles.addedData}>
                            <p className={Styles.explanation}>
                                Data added in this way is not saved or made visible to others unless you explicitly share
                                it by using the Share panel.
                            </p>
                            <ul className={Styles.dataCatalog}>
                                <DataCatalogGroup group={this.props.terria.catalog.userAddedDataGroup}
                                                  viewState={this.props.viewState}/>
                            </ul>
                            <button type='button'
                                    onClick={this.onAddMoreDataButtonClicked}
                                    className={Styles.btnAddMoreData}>
                                Add more data
                            </button>
                        </div>
                    </If>
                </div>
                <DataPreview terria={this.props.terria}
                             viewState={this.props.viewState}
                             previewed={this.props.viewState.userDataPreviewedItem}
                />
            </div>
        );
    },
});

module.exports = MyDataTab;
