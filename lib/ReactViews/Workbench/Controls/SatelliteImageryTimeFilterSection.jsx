import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import React from 'react';
import LocationItem from '../../LocationItem.jsx';
import ObserveModelMixin from '../../ObserveModelMixin';
import Styles from './satellite-imagery-time-filter-section.scss';

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
        alert('TODO');
    },

    render() {
        if (this.props.item.featureTimesProperty === undefined) {
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
