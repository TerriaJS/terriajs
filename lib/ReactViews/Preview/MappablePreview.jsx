import React from 'react';

import DataPreviewSections from './DataPreviewSections';
import DataPreviewMap from './DataPreviewMap.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import Styles from './mappable-preview.scss';
import renderMarkdownInReact from '../../Core/renderMarkdownInReact';

/**
 * CatalogItem preview that is mappable (as opposed to say, an analytics item that can't be displayed on a map without
 * configuration of other parameters.
 */
const MappablePreview = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        previewed: React.PropTypes.object.isRequired,
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired,
    },

    toggleOnMap(event) {
        this.props.previewed.toggleEnabled();
        if (this.props.previewed.isEnabled === true &&
            this.props.viewState.closeModalAfterAdd &&
            !event.shiftKey && !event.ctrlKey) {

            this.props.viewState.explorerPanelIsVisible = false;
        }
    },

    backToMap() {
        this.props.viewState.explorerPanelIsVisible = false;
    },

    render() {
        const catalogItem = this.props.previewed.nowViewingCatalogItem || this.props.previewed;

        return (
            <div>
                <If condition={catalogItem.isMappable}>
                    <DataPreviewMap terria={this.props.terria} previewedCatalogItem={this.props.previewed}/>
                </If>
                <button type='button' onClick={this.toggleOnMap}
                        className={Styles.btnAdd}>
                    {this.props.previewed.isEnabled ? 'Remove from the map' : 'Add to the map'}
                </button>
                <div className={Styles.previewedInfo}>
                    <h3>{catalogItem.name}</h3>
                    <div className={Styles.url}>
                        <If condition={catalogItem.description && catalogItem.description.length > 0}>
                            <div>
                                <h4>Description</h4>
                                {renderMarkdownInReact(catalogItem.description, catalogItem)}
                            </div>
                        </If>

                        <If condition={catalogItem.dataUrlType === 'local'}>
                            <p>This file only exists in your browser. To share it, you must load it onto a public web server.</p>
                        </If>

                        <If condition={catalogItem.dataUrlType !== 'local' && !catalogItem.hasDescription}>
                            <p>Please contact the provider of this data for more information, including information about usage rights and constraints.</p>
                        </If>

                        <DataPreviewSections metadataItem={catalogItem}/>

                        <If condition={catalogItem.dataCustodian && catalogItem.dataCustodian.length > 0}>
                            <div>
                                <h4>Data Custodian</h4>
                                {renderMarkdownInReact(catalogItem.dataCustodian, catalogItem)}
                            </div>
                        </If>

                        <If condition={!catalogItem.hideSource}>
                            <If condition={catalogItem.url}>
                                <h4>{catalogItem.typeName} URL</h4>
                                <Choose>
                                    <When condition={catalogItem.type === 'wms'}>
                                        <p>
                                            This is a <a href="https://en.wikipedia.org/wiki/Web_Map_Service" target="_blank">WMS
                                            service</a>, which generates map images on request. It can be used in GIS software with this
                                            URL:
                                        </p>
                                    </When>
                                    <When condition={catalogItem.type === 'wfs'}>
                                        <p>
                                            This is a <a href="https://en.wikipedia.org/wiki/Web_Feature_Service" target="_blank">WFS
                                            service</a>, which transfers raw spatial data on request. It can be used in GIS software with this
                                            URL:
                                        </p>
                                    </When>
                                </Choose>

                                <input readOnly
                                       className={Styles.field}
                                       type="text"
                                       value={catalogItem.url}
                                       onClick={this.selectUrl} />

                                <Choose>
                                    <When condition={catalogItem.type === 'wms' || (catalogItem.type === 'esri-mapServer' && typeof catalogItem.layers !== 'undefined')}>
                                        <p>
                                            Layer name{catalogItem.layers.split(',').length > 1 ? 's' : ''}: {catalogItem.layers}
                                        </p>
                                    </When>
                                    <When condition={catalogItem.type === 'wfs'}>
                                        <p>
                                            Type name{catalogItem.typeNames.split(',').length > 1 ? 's' : ''}: {catalogItem.typeNames}
                                        </p>
                                    </When>
                                </Choose>
                            </If>

                            <If condition={catalogItem.metadataUrl}>
                                <h4>Metadata URL</h4>
                                <p>
                                    <a href={catalogItem.metadataUrl} target="_blank">{catalogItem.metadataUrl}</a>
                                </p>
                            </If>

                            <If condition={catalogItem.dataUrlType && catalogItem.dataUrlType !== 'none' && catalogItem.dataUrl}>
                                <h4>Data URL</h4>
                                <p>
                                    <Choose>
                                        <When condition={catalogItem.dataUrlType.indexOf('wfs') === 0 || catalogItem.dataUrlType.indexOf('wcs') === 0}>
                                            Use the link below to download the data.  See the
                                            {catalogItem.dataUrlType.indexOf('wfs') === 0 && <a href="http://docs.geoserver.org/latest/en/user/services/wfs/reference.html" target="_blank">Web Feature Service (WFS) documentation</a>}
                                            {catalogItem.dataUrlType.indexOf('wcs') === 0 && <a href="http://docs.geoserver.org/latest/en/user/services/wcs/reference.html" target="_blank">Web Coverage Service (WCS) documentation</a>}
                                            for more information on customising URL query parameters.
                                        </When>
                                        <Otherwise>
                                            Use the link below to download data directly.
                                        </Otherwise>
                                    </Choose>
                                    <br/>
                                    <a href={catalogItem.dataUrl} target="_blank">{catalogItem.dataUrl}</a>
                                </p>
                            </If>
                        </If>
                    </div>
                </div>
            </div>
        );
    }
});

export default MappablePreview;

