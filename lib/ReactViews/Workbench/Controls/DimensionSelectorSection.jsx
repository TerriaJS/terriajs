'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';
import React from 'react';
import PropTypes from 'prop-types';
import ObserveModelMixin from '../../ObserveModelMixin';

import Styles from './dimension-selector-section.scss';

const DimensionSelectorSection = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        item: PropTypes.object.isRequired
    },

    changeDimension(dimension, event) {
        const item = this.props.item;
        const dimensions = item.dimensions || {};

        dimensions[dimension.name] = event.target.value;

        item.dimensions = dimensions;
        item.refresh();
    },

    render() {
        const item = this.props.item;

        // This section only makes sense if we have a layer that has dimensions.
        if (item.disableUserChanges || !defined(item.availableDimensions) || !defined(item.layers)) {
            return null;
        }

        const dimensions = [];
        item.layers.split(',').forEach(layerName => {
            const layerDimensions = item.availableDimensions[layerName];
            layerDimensions.forEach(layerDimension => {
                // Don't include the time dimension; it is handled specially
                if (layerDimension.name.toLowerCase() === 'time') {
                    return;
                }

                // Only use the first dimension we find with each name.
                const existingDimension = dimensions.filter(dimension => dimension.name === layerDimension.name)[0];
                if (!defined(existingDimension)) {
                    dimensions.push(layerDimension);
                }
            });
        });

        return (
            <div className={Styles.dimensionSelector}>
                {dimensions.map(this.renderDimensionSelector)}
            </div>
        );

    },

    renderDimensionSelector(dimension) {
        const dimensionValues = dimension.options;
        const selectedDimensions = this.props.item.dimensions || {};
        const value = selectedDimensions[dimension.name] || dimension.default || '';
        const addDefault = value.length === 0 && dimension.options.indexOf(value) < 0;

        let title = dimension.name.length > 0 ? dimension.name.charAt(0).toUpperCase() + dimension.name.slice(1) : '';
        if (dimension.unitSymbol) {
            title += '(' + dimension.unitSymbol + ')';
        }

        return (
            <div key={dimension.name}>
                <label className={Styles.title} htmlFor={dimension.name}>{title}</label>
                <select className={Styles.field} name={dimension.name} value={value} onChange={this.changeDimension.bind(this, dimension)}>
                    {addDefault && <option key="__default__" value="">Default</option>}
                    {dimensionValues.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
            </div>
        );
    }
});

module.exports = DimensionSelectorSection;
