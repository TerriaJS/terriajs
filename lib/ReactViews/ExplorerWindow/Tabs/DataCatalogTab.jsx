import React from 'react';

import defined from 'terriajs-cesium/Source/Core/defined';
import DataCatalog from '../../DataCatalog/DataCatalog.jsx';
import DataCatalogMember from '../../DataCatalog/DataCatalogMember.jsx';
import DataPreview from '../../Preview/DataPreview.jsx';
import ObserveModelMixin from '../../ObserveModelMixin';
import SearchHeader from '../../Search/SearchHeader.jsx';
import SearchBox from '../../Search/SearchBox.jsx';

import Styles from './data-catalog-tab.scss';

// The DataCatalog Tab
const DataCatalogTab = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        viewState: React.PropTypes.object,
        overrideState: React.PropTypes.string,
        onActionButtonClicked: React.PropTypes.func
    },

    changeSearchText(newText) {
        this.props.viewState.searchState.catalogSearchText = newText;
    },

    search() {
        this.props.viewState.searchState.searchCatalog();
    },

    render() {
        const terria = this.props.terria;
        return (
            <div className={Styles.root}>
                <div className={Styles.dataExplorer}>
                    <SearchBox searchText={this.props.viewState.searchState.catalogSearchText}
                               onSearchTextChanged={this.changeSearchText}
                               onDoSearch={this.search}/>
                    <DataCatalog terria={this.props.terria}
                                 viewState={this.props.viewState}
                                 overrideState={this.props.overrideState}
                                 onActionButtonClicked={this.props.onActionButtonClicked} />
                </div>
                <DataPreview terria={terria}
                             viewState={this.props.viewState}
                             previewed={this.props.viewState.previewedItem}
                />
            </div>
        );
    }
});

module.exports = DataCatalogTab;
