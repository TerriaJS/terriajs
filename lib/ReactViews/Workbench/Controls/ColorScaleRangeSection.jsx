'use strict';

import React from 'react';
import ObserveModelMixin from '../../ObserveModelMixin';
import defined from 'terriajs-cesium/Source/Core/defined';
import Styles from './colorscalerange-section.scss';

const ColorScaleRangeSection = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        item: React.PropTypes.object.isRequired
    },

    minRange: -50,
    maxRange: 50,

    updateRange(e) {
        e.preventDefault();
        this.props.item.parameters.colorscalerange = [this.minRange, this.maxRange].join();
        this.props.item.refresh();
    },

    changeRangeMin(event) {
        this.minRange = event.target.value;
    },

    changeRangeMax(event) {
        this.maxRange = event.target.value;
    },

    render() {
        const item = this.props.item;
        if (!defined(item.parameters) || !defined(item.parameters.colorscalerange)) {
            return null;
        }

        this.minRange = item.parameters.colorscalerange.split(',')[0];
        this.maxRange = item.parameters.colorscalerange.split(',')[1];
        return (
            <form className={Styles.colorscalerange} onSubmit={this.updateRange}>
                <div className={Styles.title}>Color Scale Range </div>
                <label htmlFor="rangeMin">Minimum: </label>
                <input className={Styles.field} type='text' name='rangeMin' defaultValue={this.minRange} onChange={this.changeRangeMin} />
                <label htmlFor="rangeMax">Maximum: </label>
                <input className={Styles.field} type='text' name='rangeMax' defaultValue={this.maxRange} onChange={this.changeRangeMax} />
                <button type='submit' title="Update Range" className={Styles.btn}>Update Range</button>
            </form>
        );
    }
});
module.exports = ColorScaleRangeSection;
