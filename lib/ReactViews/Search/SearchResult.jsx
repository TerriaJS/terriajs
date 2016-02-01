"use strict";

import React from 'react';
import DataCatalogGroup from '../DataCatalogGroup.jsx';
import DataCatalogItem from '../DataCatalogItem.jsx';
import LocationItem from '../LocationItem.jsx';
import defined from 'terriajs-cesium/Source/Core/defined';

export default React.createClass({
    render() {
        const result = this.props.result;

        if (defined(result.catalogItem)) {
            if (result.catalogItem.isGroup) {
                return (
                    <DataCatalogGroup group={result.catalogItem}
                                      isOpen={result.isOpen}
                                      onToggleOpen={result.toggleOpen.bind(result)}
                                      previewedCatalogItem={this.props.previewedCatalogItem}
                                      onPreviewedCatalogItemChanged={this.props.onPreviewedCatalogItemChanged}
                    />
                );
            } else {
                return (
                    <DataCatalogItem item={result.catalogItem}
                                     previewedCatalogItem={this.props.previewedCatalogItem}
                                     onPreviewedCatalogItemChanged={this.props.onPreviewedCatalogItemChanged}
                    />
                );
            }
        } else {
            return (
                <LocationItem item={result} />
            );
        }
    }
});
