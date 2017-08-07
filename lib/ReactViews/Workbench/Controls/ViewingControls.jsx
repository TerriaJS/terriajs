'use strict';
import Cartographic from 'terriajs-cesium/Source/Core/Cartographic';
import defined from 'terriajs-cesium/Source/Core/defined';
import Ellipsoid from 'terriajs-cesium/Source/Core/Ellipsoid';
import Icon from "../../Icon.jsx";
import ObserveModelMixin from '../../ObserveModelMixin';
import PickedFeatures from '../../../Map/PickedFeatures';
import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import Rectangle from 'terriajs-cesium/Source/Core/Rectangle';
import when from 'terriajs-cesium/Source/ThirdParty/when';
import classNames from 'classnames';
import Styles from './viewing-controls.scss';

import createCatalogMemberFromType from '../../../Models/createCatalogMemberFromType';
import ImagerySplitDirection from 'terriajs-cesium/Source/Scene/ImagerySplitDirection';

const ViewingControls = createReactClass({
    displayName: 'ViewingControls',
    mixins: [ObserveModelMixin],

    propTypes: {
        item: PropTypes.object.isRequired,
        viewState: PropTypes.object.isRequired
    },

    removeFromMap() {
        this.props.item.isEnabled = false;
    },

    zoomTo() {
        this.props.item.zoomToAndUseClock();
    },

    openFeature() {
        const item = this.props.item;
        const pickedFeatures = new PickedFeatures();
        pickedFeatures.features.push(item.tableStructure.sourceFeature);
        pickedFeatures.allFeaturesAvailablePromise = when();
        pickedFeatures.isLoading = false;
        const xyzPosition = item.tableStructure.sourceFeature.position.getValue(item.terria.clock.currentTime);
        const ellipsoid = Ellipsoid.WGS84;
        // Code replicated from GazetteerSearchProviderViewModel.
        const bboxRadians = 0.1;  // GazetterSearchProviderViewModel uses 0.2 degrees ~ 0.0035 radians. 1 degree ~ 110km. 0.1 radian ~ 700km.

        const latLonPosition = Cartographic.fromCartesian(xyzPosition, ellipsoid);
        const south = latLonPosition.latitude + bboxRadians / 2;
        const west = latLonPosition.longitude - bboxRadians / 2;
        const north = latLonPosition.latitude - bboxRadians / 2;
        const east = latLonPosition.longitude + bboxRadians / 2;
        const rectangle = new Rectangle(west, south, east, north);
        const flightDurationSeconds = 1;
        // TODO: This is bad. How can we do it better?
        setTimeout(function() {
            item.terria.pickedFeatures = pickedFeatures;
            item.terria.currentViewer.zoomTo(rectangle, flightDurationSeconds);
        }, 50);
    },

    splitItem() {
        const item = this.props.item;
        item.splitDirection = ImagerySplitDirection.LEFT;
        const serializedItem = item.serializeToJson();
        serializedItem.name = serializedItem.name + ' (copy)';
        serializedItem.splitDirection = ImagerySplitDirection.RIGHT;
        delete serializedItem.id;

        const newItem = createCatalogMemberFromType(item.type, item.terria);
        newItem.updateFromJson(serializedItem);
        item.duplicateItemUniqueId = newItem.uniqueId;
        newItem.duplicateItemUniqueId = item.uniqueId;

        item.terria.showSplitter = true;
    },

    previewItem() {
        let item = this.props.item;
        // If this is a chartable item opened from another catalog item, get the info of the original item.
        if (defined(item.sourceCatalogItem)) {
            item = item.sourceCatalogItem;
        }
        // Open up all the parents (doesn't matter that this sets it to enabled as well because it already is).
        item.enableWithParents();
        this.props.viewState.viewCatalogItem(item);
        this.props.viewState.switchMobileView(this.props.viewState.mobileViewOptions.preview);
    },

    render() {
        const item = this.props.item;
        const canZoom = item.isMappable || (item.tableStructure && item.tableStructure.sourceFeature);
        const canSplit = defined(item.splitDirection) && item.terria.currentViewer.canShowSplitter && !item.preventDuplication;
        const classList = {[Styles.noZoom]: !canZoom, [Styles.noSplit]: !canSplit, [Styles.noInfo]: !item.showsInfo};
        return (
            <ul className={Styles.control}>
                <If condition={item.isMappable}>
                    <li className={classNames(Styles.zoom, classList)}><button type='button' onClick={this.zoomTo} title="Zoom to data" className={Styles.btn}>Zoom To Extent</button></li>
                </If>
                <If condition={item.tableStructure && item.tableStructure.sourceFeature}>
                    <li className={classNames(Styles.zoom, classList)}><button type='button' onClick={this.openFeature} title="Zoom to data" className={Styles.btn}>Zoom To</button></li>
                </If>
                <If condition={item.showsInfo}>
                    <li className={classNames(Styles.info, classList)}><button type='button' onClick={this.previewItem} className={Styles.btn} title='info'>About This Data</button></li>
                </If>
                <If condition={canSplit}>
                    <li className={classNames(Styles.split, classList)}><button type='button' onClick={this.splitItem} title="Duplicate and show splitter" className={Styles.btn}>Split</button></li>
                </If>
                <li className={classNames(Styles.remove, classList)}>
                    <button type='button' onClick={this.removeFromMap} title="Remove this data" className={Styles.btn}>
                        Remove <Icon glyph={Icon.GLYPHS.remove}/>
                    </button>
                </li>
            </ul>
        );
    },
});
module.exports = ViewingControls;
