import React from 'react';

import createReactClass from 'create-react-class';

import PropTypes from 'prop-types';

import DataPreviewMap from './DataPreviewMap';
import Description from './Description';
import measureWidth from './measureWidth';
import ObserveModelMixin from '../ObserveModelMixin';
import Styles from './mappable-preview.scss';
import SharePanel from '../Map/Panels/SharePanel/SharePanel.jsx';

/**
 * CatalogItem preview that is mappable (as opposed to say, an analytics item that can't be displayed on a map without
 * configuration of other parameters.
 */
const MappablePreview = createReactClass({
    displayName: 'MappablePreview',
    mixins: [ObserveModelMixin],

    propTypes: {
        previewed: PropTypes.object.isRequired,
        terria: PropTypes.object.isRequired,
        viewState: PropTypes.object.isRequired,
        widthFromMeasureWidthHOC: PropTypes.number,
    },

    toggleOnMap(event) {
        this.props.previewed.toggleEnabled();
        if (this.props.previewed.isEnabled === true && !event.shiftKey && !event.ctrlKey) {
            this.props.viewState.explorerPanelIsVisible = false;
            this.props.viewState.mobileView = null;
        }
    },

    backToMap() {
        this.props.viewState.explorerPanelIsVisible = false;
    },

    render() {
        const catalogItem = this.props.previewed.nowViewingCatalogItem || this.props.previewed;
        return (
            <div className={Styles.root}>
                <If condition={catalogItem.isMappable && !catalogItem.disablePreview}>
                    <DataPreviewMap terria={this.props.terria}
                                    previewedCatalogItem={catalogItem}
                                    showMap={!this.props.viewState.explorerPanelAnimating || this.props.viewState.useSmallScreenInterface} />
                </If>
                <button type='button' onClick={this.toggleOnMap}
                        className={Styles.btnAdd}>
                    {this.props.previewed.isEnabled ? 'Remove from the map' : 'Add to the map'}
                </button>
                <div className={Styles.previewedInfo}>
                    <div className={Styles.titleAndShareWrapper} ref={component => (this.refToMeasure = component)}>
                        <h3 className={Styles.h3}>{catalogItem.name}</h3>
                        <div className={Styles.shareLinkWrapper}>
                            <SharePanel
                                catalogShare
                                modalWidth={this.props.widthFromMeasureWidthHOC}
                                terria={this.props.terria}
                                viewState={this.props.viewState} />
                        </div>
                    </div>
                    <Description item={catalogItem} />
                </div>
            </div>
        );
    },
});

export default measureWidth(MappablePreview);

