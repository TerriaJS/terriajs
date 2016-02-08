'use strict';

import DataCatalogGroup from './DataCatalogGroup.jsx';
import DataPreview from './DataPreview.jsx';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
import SearchBox from './SearchBox.jsx';

// The DataCatalog Tab
const DataCatalogTab = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        searchText: React.PropTypes.string,
        previewedCatalogItem: React.PropTypes.object,
        onSearchTextChanged: React.PropTypes.func,
        onPreviewedCatalogItemChanged: React.PropTypes.func
    },

    renderDataCatalog(dataCatalog) {
        return (
            <ul className = 'data-catalog hide-on-search'>
                {dataCatalog.map((group, i) => {
                    return (<DataCatalogGroup group={group}
                                              key={i}
                                              previewedCatalogItem={this.props.previewedCatalogItem}
                                              onPreviewedCatalogItemChanged={this.props.onPreviewedCatalogItemChanged}
                            />);
                }, this)}
            </ul>);
    },

    render() {
        const terria = this.props.terria;
        const dataCatalog = terria.catalog.group.items;
        return (
            <div className="panel-content">
              <div className="data-explorer">
                <SearchBox terria={terria}
                           mapSearch={false}
                           gazetterSearch={false}
                           searchText={this.props.searchText}
                           onSearchTextChanged={this.props.onSearchTextChanged}
                           previewedCatalogItem={this.props.previewedCatalogItem}
                           onPreviewedCatalogItemChanged={this.props.onPreviewedCatalogItemChanged}
                />
                {this.renderDataCatalog(dataCatalog)}
              </div>
              <div className="data-preview">
                <DataPreview terria={terria}
                             previewedCatalogItem={this.props.previewedCatalogItem}
                />
              </div>
            </div>);
    }
});

module.exports = DataCatalogTab;
