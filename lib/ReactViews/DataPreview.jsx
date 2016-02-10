'use strict';

import DataPreviewMap from './DataPreviewMap.jsx';
import defined from 'terriajs-cesium/Source/Core/defined';
import markdownToHtml from 'terriajs/lib/Core/markdownToHtml';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';

// Data preview section, for the preview map see DataPreviewMap
const DataPreview = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        previewedCatalogItem: React.PropTypes.object
    },

    toggleOnMap() {
        this.props.previewedCatalogItem.toggleEnabled();
    },

    renderMarkup(content) {
        return {
            __html: markdownToHtml(content)
        };
    },

    render() {
        const previewed = this.props.previewedCatalogItem;
        return (
            <div className='data-preview__inner'>
                <DataPreviewMap terria={this.props.terria} previewedCatalogItem={this.props.previewedCatalogItem}/>
                {this.renderActions(previewed)}
            </div>
        );
    },

    renderActions(previewed) {
        if (previewed && defined(previewed.type)) {
            return (
                <div>
                    <button onClick={this.toggleOnMap}
                            className="btn toggle-enable"
                            title={previewed.isEnabled ? 'remove from map' : 'add to map'}>
                        {previewed.isEnabled ? 'Remove from map' : 'Add to map'}
                    </button>
                    <h4>{previewed.name}</h4>
                    <div className="data-info url">
                        <h5>Description</h5>
                        <p dangerouslySetInnerHTML={this.renderMarkup(previewed.description)}></p>
                        <h5>Licence</h5>
                        <h5>Data Custodian</h5>
                        <p dangerouslySetInnerHTML={this.renderMarkup(previewed.dataCustodian)}></p>
                        <h5>Web Map Service (WMS) URL </h5>
                        <p dangerouslySetInnerHTML={this.renderMarkup(previewed.url)}></p>
                    </div>
                </div>);
        }
    }
});

module.exports = DataPreview;
