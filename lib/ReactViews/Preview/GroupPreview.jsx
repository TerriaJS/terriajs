import React from 'react';

import DataPreviewSections from './DataPreviewSections';
import DataPreviewUrl from './DataPreviewUrl.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import Styles from './mappable-preview.scss';
import renderMarkdownInReact from '../../Core/renderMarkdownInReact';

/**
 * A "preview" for CatalogGroup.
 */
const GroupPreview = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        previewed: React.PropTypes.object.isRequired,
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired,
    },

    backToMap() {
        this.props.viewState.explorerPanelIsVisible = false;
    },

    render() {
        const metadataItem = this.props.previewed.nowViewingCatalogItem || this.props.previewed;

        return (
            <div>
                <h3>{this.props.previewed.name}</h3>
                <div className={Styles.previewedInfo}>
                    <div className="data-info url">
                        <Choose>
                            <When
                                condition={this.props.previewed.description && this.props.previewed.description.length > 0}>
                                <div>
                                    <h4>Description</h4>
                                    {renderMarkdownInReact(this.props.previewed.description, this.props.previewed)}
                                </div>
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

export default GroupPreview;

