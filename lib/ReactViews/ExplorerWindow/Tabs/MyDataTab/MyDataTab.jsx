import React from 'react';
import classNames from 'classnames';

import DataCatalogGroup from '../../../DataCatalog/DataCatalogGroup.jsx';
import DataPreview from '../../../Preview/DataPreview.jsx';
import AddData from './AddData.jsx';
import ObserveModelMixin from '../../../ObserveModelMixin';
import Styles from './my-data-tab.scss';

const DISCLAIMER = <p>Data added in this way is not saved or made visible to others unless you explicitly share it by
    using the Share panel. </p>;

// My data tab include Add data section and preview section
const MyDataTab = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        viewState: React.PropTypes.object
    },

    render() {
        return (
            <div>
                <div className={Styles.myData}>
                    <If condition={this.props.viewState.myDataIsUploadView}>
                        <div className={Styles.addData}>
                            <If condition={this.props.terria.catalog.userAddedDataGroup}>
                                <button type='button'
                                        onClick={()=>this.props.viewState.myDataIsUploadView = !this.props.viewState.myDataIsUploadView}
                                        className={Styles.backToMyData}>
                                    Back
                                </button>
                            </If>
                        <h3>Adding your own data</h3>
                            <AddData terria={this.props.terria}
                                     viewState={this.props.viewState}
                        />
                    </div>
                    </If>
                    <If condition={this.state.dataCatalog}>
                        <div className={Styles.addedData}>
                            {DISCLAIMER}
                            <ul className={Styles.dataCatalog}>
                                <DataCatalogGroup group={this.props.terria.catalog.userAddedDataGroup}
                                                  viewState={this.props.viewState}/>
                            </ul>
                            <button type='button' onClick={()=>this.props.viewState.myDataIsUploadView = true}
                                    className={Styles.btnAddMoreData}>
                                Add more data
                            </button>
                        </div>
                    </If>
                </div>
                <div className={Styles.dataPreviewWrapper}>
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
