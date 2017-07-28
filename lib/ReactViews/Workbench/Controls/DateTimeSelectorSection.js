'use strict';

import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import defined from 'terriajs-cesium/Source/Core/defined';
import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';

import ObserveModelMixin from '../../ObserveModelMixin';
import Styles from './style-selector-section.scss';

const DateTimeSelectorSection = createReactClass({
    displayName: 'DateTimeSelectorSection',

    mixins: [ObserveModelMixin],

    propTypes: {
        item: PropTypes.object.isRequired
    },

    getDateTimes() {
        const item = this.props.item;
        const datetimes = [];
        // Only show the start of each interval. If only time instants were given, this is the instant.
        for (let i = 0; i < item.intervals.length; i++) {
            datetimes.push(JulianDate.toIso8601(item.intervals.get(i).start));
        }
        return datetimes;
    },

    changeDateTime(layer, event) {
        const item = this.props.item;
        const layers = item.layers.split(',');
        const datetimes = this.getDateTimes();

        const layerIndex = layers.indexOf(layer.name);
        if (layerIndex === -1) {
            // Not a valid layer?  Something went wrong.
            return;
        }
        // TODO: This sets the wrong time - want to set the item's own clock?
        item.terria.clock.currentTime = item.intervals.get(event.target.value).start;
    },

    render() {
        const item = this.props.item;

        // This section only makes sense if we have a layer that supports it.
        // if (item.disableUserChanges || !defined(item.availableStyles) || !defined(item.styles) || !defined(item.layers) || item.layers.length === 0) {
        //     return null;
        // }

        const layerTitles = item.layerTitles;
        const layers = item.layers.split(',').map((item, i) => ({
            name: item.trim(),
            title: (layerTitles && layerTitles[i]) || item.trim()
        }));

        return (
            <div className={Styles.styleSelector}>
                {layers.map(this.renderSelectorForLayer)}
            </div>
        );
    },

    renderSelectorForLayer(layer) {
        const item = this.props.item;
        if (!item.showDatetimePicker || !defined(item.intervals)) {
            return null;
        }
        const datetimes = this.getDateTimes();
        if (!defined(datetimes) || datetimes.length < 2) {
            return null;
        }

        const label = item.layers.indexOf(',') >= 0 ? layer.title + ' freeze at:' : 'Freeze at:';
        // TODO: use its own time?
        const currentIntervalIndex = item.intervals.indexOf(item.terria.clock.currentTime);
        return (
            <div key={layer.name}>
                <label className={Styles.title} htmlFor={layer.name}>{label}</label>
                <select className={Styles.field} name={layer.name} value={currentIntervalIndex} onChange={this.changeDateTime.bind(this, layer)}>
                    {datetimes.map((title, index) => <option key={index} value={index}>{title}</option>)}
                </select>
            </div>
        );
    },
});
module.exports = DateTimeSelectorSection;
