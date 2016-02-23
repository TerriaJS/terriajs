'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';
import when from 'terriajs-cesium/Source/ThirdParty/when';

import ObserveModelMixin from '../ObserveModelMixin';
import PickedFeatures from '../../Map/PickedFeatures';
import React from 'react';

const ViewingControls = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        nowViewingItem: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    removeFromMap() {
        this.props.nowViewingItem.isEnabled = false;
    },

    toggleVisibility() {
        this.props.nowViewingItem.isShown = !this.props.nowViewingItem.isShown;
    },

    zoomTo() {
        this.props.nowViewingItem.zoomToAndUseClock();
    },

    openFeature() {
        const nowViewingItem = this.props.nowViewingItem;
        const pickedFeatures = new PickedFeatures();
        pickedFeatures.features.push(nowViewingItem.tableStructure.sourceFeature);
        pickedFeatures.allFeaturesAvailablePromise = when();
        pickedFeatures.isLoading = false;
        // TODO: This is bad. How can we do it better?
        setTimeout(function() {
            nowViewingItem.terria.pickedFeatures = pickedFeatures;
            nowViewingItem.terria.currentViewer.zoomTo({position: nowViewingItem.tableStructure.sourceFeature.position.getValue(nowViewingItem.terria.clock.currentTime)}, 1);
        }, 50);
    },

    previewItem() {
        this.props.viewState.viewCatalogItem(this.props.nowViewingItem);
    },

    render() {
        const nowViewingItem = this.props.nowViewingItem;
        let zoomButton = null;
        let infoButton = null;
        let removeButton = null;
        let showButton = null;
        let openFeatureButton = null;
        if (nowViewingItem.isMappable) {
            zoomButton = <li className='zoom'><button onClick={this.zoomTo} title="Zoom to data" className="btn">Zoom To</button></li>;
        }
        if (defined(nowViewingItem.tableStructure) && defined(nowViewingItem.tableStructure.sourceFeature)) {
            openFeatureButton = <li className='open-feature'><button onClick={this.openFeature} title="Open source feature" className="btn">Feature Info</button></li>;
        }
        if (nowViewingItem.showsInfo) {
            infoButton = <li className='info'><button onClick={this.previewItem} className='btn' title='info'>Info</button></li>;
        }
        removeButton = <li className='remove'><button onClick={this.removeFromMap} title="Remove this data" className="btn">Remove</button></li>;
        if (nowViewingItem.supportsToggleShown) {
            showButton = (
                <li className='visibility'>
                    <button onClick={this.toggleVisibility} title="Data show/hide" className={'btn btn--visibility ' + (nowViewingItem.isShown ? 'is-visible' : '')}></button>
                </li>
            );
        }
        return (
            <ul className="now-viewing__item__control">
                {zoomButton}
                {openFeatureButton}
                {infoButton}
                {removeButton}
                {showButton}
            </ul>
        );
    }
});
module.exports = ViewingControls;
