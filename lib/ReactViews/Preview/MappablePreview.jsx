import React from 'react';

import DataPreviewMap from './DataPreviewMap';
import Description from './Description';
import ObserveModelMixin from '../ObserveModelMixin';
import Styles from './mappable-preview.scss';

/**
 * CatalogItem preview that is mappable (as opposed to say, an analytics item that can't be displayed on a map without
 * configuration of other parameters.
 */
const MappablePreview = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        previewed: React.PropTypes.object.isRequired,
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
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
                <If condition={catalogItem.isMappable}>
                    <DataPreviewMap terria={this.props.terria}
                                    previewedCatalogItem={catalogItem}
                                    showMap={!this.props.viewState.explorerPanelAnimating || this.props.viewState.useSmallScreenInterface} />
                </If>
                <button type='button' onClick={this.toggleOnMap}
                        className={Styles.btnAdd}>
                    {this.props.previewed.isEnabled ? 'Remove from the map' : 'Add to the map'}
                </button>
                <div className={Styles.previewedInfo}>
                    <h3 className={Styles.h3}>{catalogItem.name}</h3>
                    <Description item={catalogItem} />
                </div>
            </div>
        );
    }
});

export default MappablePreview;

