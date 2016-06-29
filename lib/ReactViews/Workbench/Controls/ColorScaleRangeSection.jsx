'use strict';

import React from 'react';
import ObserveModelMixin from '../../ObserveModelMixin';

import Styles from './colorscalerange-section.scss';

const ColorScaleRangeSection = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        item: React.PropTypes.object.isRequired
    },

    minRange: -50,
    maxRange: 50,

    updateRange() {
        this.props.item.parameters.colorscalerange = [this.minRange, this.maxRange].join();
    },

    changeRangeMin(event) {
        this.minRange = event.target.value;
    },

    changeRangeMax(event) {
        this.maxRange = event.target.value;
    },

    render() {
        const item = this.props.item;
        this.minRange = item.parameters.colorscalerange.split(',')[0];
        this.maxRange = item.parameters.colorscalerange.split(',')[1];
        if (!item.isNcWMS) {
            return null;
        }
        return (
            <div className={Styles.colorscalerange}>
                <label>Colorscalerange: </label>
                <label htmlFor="rangeMin">Min: </label>
                <input type='text' name='rangeMin' defaultValue={this.minRange} onChange={this.changeRangeMin} />
                <label htmlFor="rangeMax">Max: </label>
                <input type='text' name='rangeMax' defaultValue={this.maxRange} onChange={this.changeRangeMax} />
                <button type='button' onClick={this.updateRange} title="Update Range" className={Styles.btn}>Update Range</button>
            </div>
        );
    }
});
module.exports = ColorScaleRangeSection;
