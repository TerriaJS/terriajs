'use strict';

import DataPreviewMap from './DataPreviewMap.jsx';
import defined from 'terriajs-cesium/Source/Core/defined';
import markdownToHtml from 'terriajs/lib/Core/markdownToHtml';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import naturalSort from 'javascript-natural-sort';
import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';



// Data preview section, for the preview map see DataPreviewMap
const DataPreview = React.createClass({
    mixins: [ObserveModelMixin],

    // Should get it from option
    _deFaultInfoSectionOrder : [
        'Disclaimer',
        'Description',
        'Data Description',
        'Service Description',
        'Resource Description',
        'Licence',
        'Access Constraints'
    ],

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

    sortInfoSections(items) {
        naturalSort.insensitive = true;
        const infoSectionOrder = defaultValue(this.props.previewed.infoSectionOrder, this.__deFaultInfoSectionOrder);
        items.sort(function(a, b) {
            const aIndex = infoSectionOrder.indexOf(a.name);
            const bIndex = infoSectionOrder.indexOf(b.name);
            if (aIndex >= 0 && bIndex < 0) {
                return -1;
            } else if (aIndex < 0 && bIndex >= 0) {
                return 1;
            } else if (aIndex < 0 && bIndex < 0) {
                return naturalSort(a.name, b.name);
            } else {
                return aIndex - bIndex;
            }
        });
        return items;
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

    renderSections(previewed) {
        if(previewed) {
            const items = previewed.info.slice();
            return this.sortInfoSections(items).map((item, i)=>
                <div key={i}><h4>{item.name}</h4><p dangerouslySetInnerHTML={this.renderMarkup(item.content)}/></div>);
        }
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
                        <h3>{previewed.name}</h3>
                        <div className="data-info url">
                            <h4>Description</h4>
                            {this.renderDescription(previewed)}
                            <h4>Data Custodian</h4>
                            <p dangerouslySetInnerHTML={this.renderMarkup(previewed.dataCustodian)}/>
                            <h4>Web Map Service (WMS) URL </h4>
                            <p dangerouslySetInnerHTML={this.renderMarkup(previewed.url)}/>
                            {this.renderSections(previewed)}
                        </div>
                    </div>
                </div>);
        }
    },

    renderDescription(previewed) {
        if(previewed.hasDescription) {
            return <p dangerouslySetInnerHTML={this.renderMarkup(previewed.description)}></p>;
        }
        return <p>Please contact the provider of this data for more information, including information about usage rights and constraints.</p>
    }
});

module.exports = DataPreview;
