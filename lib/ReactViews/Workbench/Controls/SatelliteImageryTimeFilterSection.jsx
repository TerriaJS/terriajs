import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import React from 'react';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import MapInteractionMode from '../../../Models/MapInteractionMode';
import LocationItem from '../../LocationItem.jsx';
import ObserveModelMixin from '../../ObserveModelMixin';
import Styles from './satellite-imagery-time-filter-section.scss';
import Loader from '../../Loader';

const SatelliteImageryTimeFilterSection = createReactClass({
    displayName: 'SatelliteImageryTimeFilterSection',
    mixins: [ObserveModelMixin],

    propTypes: {
        item: PropTypes.object
    },

    removeFilter() {
        this.props.item._intervalFilterFeature = undefined;
    },

    zoomTo() {
        alert('TODO');
    },

    newLocation() {
        // Cancel any feature picking already in progress.
        const terria = this.props.item.terria;
        terria.pickedFeatures = undefined;

        const pickPointMode = new MapInteractionMode({
            message: 'Select a point by clicking on the map.',
            onCancel: () => {
                terria.mapInteractionModeStack.pop();
            }
        });
        terria.mapInteractionModeStack.push(pickPointMode);

        knockout.getObservable(pickPointMode, 'pickedFeatures').subscribe(pickedFeatures => {
            pickPointMode.customUi = function() {
                return (
                    <Loader message="Querying position..." />
                );
            };

            pickedFeatures.allFeaturesAvailablePromise.then(() => {
                const item = this.props.item;
                const thisLayerFeature = pickedFeatures.features.filter(feature => {
                    return feature.imageryLayer === item.imageryLayer && item.canFilterIntervalsByFeature(feature);
                })[0];

                if (thisLayerFeature !== undefined) {
                    item.filterIntervalsByFeature(thisLayerFeature);
                }

                terria.mapInteractionModeStack.pop();
            });
        });
    },

    render() {
        if (this.props.item.canFilterIntervalsByFeature === undefined) {
            return null;
        }

        const feature = this.props.item._intervalFilterFeature;
        if (feature === undefined) {
            return this.renderNoFeatureSelected();
        } else {
            return this.renderFeatureSelected(feature);
        }
    },

    renderNoFeatureSelected() {
        return (
            <div className={Styles.inactive}>
                <div className={Styles.btnGroup}>
                    <button className={Styles.btn} onClick={this.newLocation}>Filter by location</button>
                </div>
            </div>
        );
    },

    renderFeatureSelected(feature) {
        // TODO: if the feature itself doesn't have a position, we should be able to use the position the user clicked on.
        const position = feature.position !== undefined ? feature.position.getValue(this.props.item.currentTime) : undefined;

        return (
            <div className={Styles.active}>
                <div className={Styles.infoGroup}>
                    <div>Only showing available capture times for:</div>
                    <LocationItem position={position} />
                </div>
                <div className={Styles.btnGroup}>
                    <button className={Styles.btn} onClick={this.removeFilter}>Remove filter</button>
                    <button className={Styles.btn} onClick={this.zoomTo}>Zoom to</button>
                    <button className={Styles.btn} onClick={this.newLocation}>New location</button>
                </div>
            </div>
        );
    }
});

module.exports = SatelliteImageryTimeFilterSection;
