'use strict';

import DataPreviewMap from './DataPreviewMap.jsx';
import defined from 'terriajs-cesium/Source/Core/defined';
import markdownToHtml from 'terriajs/lib/Core/markdownToHtml';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';

//sort this, but why?
const infoSectionOrder = [
    'Disclaimer',
    'Description',
    'Data Description',
    'Service Description',
    'Resource Description',
    'Licence',
    'Access Constraints'
];

// Data preview section, for the preview map see DataPreviewMap
const DataPreview = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object,
        previewed: React.PropTypes.object
    },

    toggleOnMap() {
        this.props.viewState.previewedItem.toggleEnabled();
        // if(this.props.viewState.previewedItem.isEnabled === true) {
        //     this.props.viewState.modalVisible = false;
        // }
    },

    renderMarkup(content) {
        return {
            __html: markdownToHtml(content)
        };
    },

    exitPreview() {
        this.props.viewState.switchMobileView(this.props.viewState.mobileViewOptions.data);
    },

    render() {
        const previewed = this.props.previewed;
        return (
            <div className='data-preview__inner'>
                <DataPreviewMap terria={this.props.terria}
                                previewedCatalogItem={previewed}
                />
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
                    <div className='data-preview__info'>
                        <button onClick={this.toggleOnMap}
                                className="btn toggle-enable"
                                title={previewed.isEnabled ? 'remove from map' : 'add to map'}>
                            {previewed.isEnabled ? 'Remove from map' : 'Add to map'}
                        </button>
                        <h4>{previewed.name}</h4>
                        <div className="data-info url">
                            <h5>Description</h5>
                            {this.renderDescription(previewed)}
                            <h5>Licence</h5>
                            <h5>Data Custodian</h5>
                            <p dangerouslySetInnerHTML={this.renderMarkup(previewed.dataCustodian)}></p>
                            <h5>Web Map Service (WMS) URL </h5>
                            <p dangerouslySetInnerHTML={this.renderMarkup(previewed.url)}></p>
                        </div>
                    </div>
                </div>);
        }
    },

    renderDescription(previewed){
        if(previewed.hasDescription){
            return <p dangerouslySetInnerHTML={this.renderMarkup(previewed.description)}></p>;
        }
        return <p>Please contact the provider of this data for more information, including information about usage rights and constraints.</p>
    }
});

module.exports = DataPreview;
