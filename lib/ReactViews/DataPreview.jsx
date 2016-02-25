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
        viewState: React.PropTypes.object
    },

    toggleOnMap() {
        this.props.viewState.previewedItem.toggleEnabled();
        if(this.props.viewState.previewedItem.isEnabled === true) {
            this.props.viewState.togglePreview(false);
            this.props.viewState.modalVisible = false;
        }
    },

    renderMarkup(content) {
        return {
            __html: markdownToHtml(content)
        };
    },

    exitPreview() {
        this.props.viewState.togglePreview(false);
    },

    render() {
        const previewed = this.props.viewState.previewedItem;
        return (
            <div className='data-preview__inner'>
                <DataPreviewMap terria={this.props.terria} previewedCatalogItem={this.props.viewState.previewedItem}/>
                {this.renderActions(previewed)}
            </div>
        );
    },

    renderActions(previewed) {
        if (previewed && defined(previewed.type)) {
            return (
                <div className='data-preview'>
                    <button onClick={this.exitPreview}
                            className="btn btn--exist-preview"
                            title='exit preview'>
                    </button>
                    <button onClick={this.toggleOnMap}
                            className="btn toggle-enable"
                            title={previewed.isEnabled ? 'remove from map' : 'add to map'}>
                        {previewed.isEnabled ? 'Remove from map' : 'Add to map'}
                    </button>
                    <div className='data-preview__info'>
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
                    </div>
                </div>);
        }
    }
});

module.exports = DataPreview;
