'use strict';

import DataPreviewMap from './DataPreviewMap.jsx';
import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';
import defined from 'terriajs-cesium/Source/Core/defined';
import InvokeFunction from '../Analytics/InvokeFunction';
import naturalSort from 'javascript-natural-sort';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import renderMarkdownInReact from '../../Core/renderMarkdownInReact';

// Data preview section, for the preview map see DataPreviewMap
const DataPreview = React.createClass({
    mixins: [ObserveModelMixin],

    // Should get it from option
    _defaultInfoSectionOrder: [
        'Disclaimer',
        'Description',
        'Data Description',
        'Dataset Description',
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

    exitPreview() {
        this.props.viewState.switchMobileView(this.props.viewState.mobileViewOptions.data);
    },

    sortInfoSections(items) {
        naturalSort.insensitive = true;
        const infoSectionOrder = defaultValue(this.props.previewed.infoSectionOrder, this._defaultInfoSectionOrder);
        items.sort(function(a, b) {
            const aIndex = infoSectionOrder.indexOf(a.name);
            const bIndex = infoSectionOrder.indexOf(b.name);
            if (aIndex >= 0 && bIndex < 0) {
                return -1;
            } else if (aIndex < 0 && bIndex >= 0) {
                return 1;
            } else if (aIndex < 0 && bIndex < 0) {
                return naturalSort(a.name, b.name);
            }
            return aIndex - bIndex;
        });
        return items;
    },

    render() {
        const previewed = this.props.previewed;
        return (
            <div className='data-preview__inner'>
                {previewed && previewed.isMappable && <DataPreviewMap terria={this.props.terria}
                                                                      previewedCatalogItem={previewed}
                />}
                <div className='data-preview'>
                    <button onClick={this.exitPreview}
                            className="btn btn--exist-preview"
                            title='exit preview'>
                    </button>
                    {previewed && this.renderActions(previewed)}
                </div>
            </div>
        );
    },

    renderSections(previewed) {
        if(previewed) {
            const items = previewed.info.slice();
            return this.sortInfoSections(items).map((item, i)=>
                item.content && item.content.length > 0 && <div key={i}><h4>{item.name}</h4>{renderMarkdownInReact(item.content, previewed)}</div>);
        }
    },

    renderActions(previewed) {
        const metadataItem = defined(previewed.nowViewingCatalogItem) ? previewed.nowViewingCatalogItem : previewed;
        if (previewed.isMappable) {
            return (<div className='data-preview__info'>
                        <button onClick={this.toggleOnMap}
                                className="btn toggle-enable"
                                title={previewed.isEnabled ? 'remove from map' : 'add to map'}>
                            {previewed.isEnabled ? 'Remove from map' : 'Add to map'}
                        </button>
                        <h3>{previewed.name}</h3>
                        <div className="data-info url">
                            {this.renderDescription(metadataItem)}
                            {this.renderSections(metadataItem)}
                            {this.renderDataCustodian(metadataItem)}
                            {this.renderUrl(metadataItem)}
                        </div>
                    </div>);
        } else if(typeof previewed.invoke) {
            return <InvokeFunction previewed={previewed}
                                   terria={this.props.terria}
                                   viewState={this.props.viewState}
                    />
        }
    },

    renderDescription(previewed) {
        if (previewed.description && previewed.description.length > 0) {
            return (
                <div>
                    <h4>Description</h4>
                    {renderMarkdownInReact(previewed.description, previewed)}
                </div>);
        } else if (!previewed.hasDescription) {
            return <p>Please contact the provider of this data for more information, including information about usage rights and constraints.</p>;
        }
    },

    renderDataCustodian(previewed) {
        if (previewed.dataCustodian && previewed.dataCustodian.length > 0) {
            return (
                <div>
                    <h4>Data Custodian</h4>
                    {renderMarkdownInReact(previewed.dataCustodian, previewed)}
                </div>);
        }
    },

    renderUrl(previewed) {
        if (previewed.url && previewed.url.length > 0) {
            return (
                <div>
                    <h4>{previewed.typeName} URL</h4>
                    {previewed.type === 'wms' && <p>This is a <a href="https://en.wikipedia.org/wiki/Web_Map_Service" target="_blank">WMS service</a>, which generates map images on request. It can be used in GIS software with this URL:</p>}
                    {previewed.type === 'wfs' && <p>This is a <a href="https://en.wikipedia.org/wiki/Web_Feature_Service" target="_blank">WFS service</a>, which transfers raw spatial data on request. It can be used in GIS software with this URL:</p>}
                    <input readOnly className ='field' type="text" value={previewed.url} onClick={this.selectUrl} />
                    {
                        (previewed.type === 'wms' || (previewed.type === 'esri-mapServer' && defined(previewed.layers))) &&
                        <p>Layer name{previewed.layers.split(',').length > 1 ? 's' : ''}: {previewed.layers}</p>
                    }
                    {
                        (previewed.type === 'wfs') &&
                        <p>Type name{previewed.typeNames.split(',').length > 1 ? 's' : ''}: {previewed.typeNames}</p>
                    }
                </div>);
        }
    },

    selectUrl(e) {
        e.target.select();
    }
});

module.exports = DataPreview;
