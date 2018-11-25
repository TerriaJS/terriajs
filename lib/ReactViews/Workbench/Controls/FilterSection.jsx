'use strict';

import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import ObserveModelMixin from '../../ObserveModelMixin';
import { Range } from 'rc-slider';
import Styles from './filter-section.scss';

const FilterSection = createReactClass({
    displayName: 'FilterSection',
    mixins: [ObserveModelMixin],

    propTypes: {
        item: PropTypes.object.isRequired
    },

    change(filter, values) {
        filter.minimumShown = values[0];
        filter.maximumShown = values[1];
        this.props.item.terria.currentViewer.notifyRepaintRequired();
    },

    render() {
        const item = this.props.item;
        if (!item.filters || item.filters.length === 0) {
            return null;
        }
        return (
            <div className={Styles.filters}>
                {item.filters.map(this.renderFilter)}
            </div>
        );
    },

    renderFilter(filter) {
        const values = [filter.minimumShown, filter.maximumShown];
        return (
            <div key={filter.property} className={Styles.filter}>
                <label htmlFor={filter.property}>Show {filter.name}: {filter.minimumShown} to {filter.maximumShown}</label>
                <Range value={values} allowCross={false} min={filter.minimumValue} max={filter.maximumValue} onChange={this.change.bind(this, filter)} />
            </div>
        );

        // {/* <RangeSlider className={Styles.rangeSlider} name='opacity' min={0} max={100} step={1} value={item.opacity * 100 | 0} onChange={this.changeOpacity}/> */}
    }
});
module.exports = FilterSection;
