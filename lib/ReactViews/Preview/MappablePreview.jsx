import React from 'react';

import DataPreviewSections from './DataPreviewSections';
import DataPreviewMap from './DataPreviewMap.jsx';
import DataPreviewUrl from './DataPreviewUrl.jsx';
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
        if (this.props.viewState.previewedItem.isEnabled === true &&
            this.props.viewState.closeModalAfterAdd &&
            !event.shiftKey && !event.ctrlKey) {

            this.props.viewState.explorerPanelIsVisible = false;
        }
    },

    backToMap() {
        this.props.viewState.explorerPanelIsVisible = false;
    },

    render() {
        const metadataItem = this.props.previewed.nowViewingCatalogItem || this.props.previewed;

        return (
            <div>
                <h3>{this.props.previewed.name}</h3>
                <If condition={this.props.previewed.isMappable}>
                    <DataPreviewMap terria={this.props.terria} previewedCatalogItem={this.props.previewed}/>
                </If>
                <div className={Styles.previewedInfo}>
                    <button type='button' onClick={this.toggleOnMap}
                            className={Styles.btnAdd}>
                        {this.props.previewed.isEnabled ? 'Remove from the map' : 'Add to the map'}
                    </button>
                    <button type='button' className={Styles.btnBack} onClick={this.backToMap}>
                        Back to the map
                    </button>
                    <div className="data-info url">
                        <Choose>
                            <When
                                condition={this.props.previewed.description && this.props.previewed.description.length > 0}>
                                <div>
                                    <h4>Description</h4>
                                    {renderMarkdownInReact(this.props.previewed.description, this.props.previewed)}
                                </div>
                            </When>
                            <When condition={!this.props.previewed.hasDescription}>
                                <p>
                                    Please contact the provider of this data for more information, including information
                                    about usage rights and constraints.
                                </p>
                            </When>
                        </Choose>

                        <DataPreviewSections metadataItem={metadataItem}/>

                        <If condition={metadataItem.dataCustodian}>
                            <div>
                                <h4>Data Custodian</h4>
                                {renderMarkdownInReact(metadataItem.dataCustodian, metadataItem)}
                            </div>
                        </If>

                        <If condition={metadataItem.url && metadataItem.url.length}>
                            <DataPreviewUrl metadataItem={metadataItem}/>
                        </If>
                    </div>
                </div>
            </div>
        );
    }
});

export default MappablePreview;

