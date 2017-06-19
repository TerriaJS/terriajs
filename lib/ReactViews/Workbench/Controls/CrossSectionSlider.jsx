'use strict';

import Cartesian3 from 'terriajs-cesium/Source/Core/Cartesian3';
import createReactClass from 'create-react-class';
import ObserveModelMixin from '../../ObserveModelMixin';
import PropTypes from 'prop-types';
import RangeSlider from 'react-rangeslider';
import React from 'react';
import Styles from './cross-section-section.scss';

const CrossSectionSlider = createReactClass({
    displayName: 'CrossSectionSlider',
    mixins: [ObserveModelMixin],

    propTypes: {
        item: PropTypes.object.isRequired,
        isMinimum: PropTypes.bool.isRequired,
        element: PropTypes.string.isRequired
    },

    change(value) {
        if (!this.props.item.crossSectionMinimums) {
            this.props.item.crossSectionMinimums = Cartesian3.clone(this.props.item.modelMinimums, this.props.item.crossSectionMinimums);
        }

        if (!this.props.item.crossSectionMaximums) {
            this.props.item.crossSectionMaximums = Cartesian3.clone(this.props.item.modelMaximums, this.props.item.crossSectionMaximums);
        }

        const crossSectionName = this.props.isMinimum ? 'crossSectionMinimums' : 'crossSectionMaximums';
        this.props.item[crossSectionName][this.props.element] = value;

        // Make sure change notification gets triggered.
        this.props.item[crossSectionName] = this.props.item[crossSectionName];

        this.props.item.terria.currentViewer.notifyRepaintRequired();
    },

    render() {
        const item = this.props.item;

        const current = this.props.isMinimum ? (item.crossSectionMinimums || item.modelMinimums) : (item.crossSectionMaximums || item.modelMaximums);
        const element = this.props.element;
        const label = this.props.isMinimum ? 'Minimum' : 'Maximum';

        return (
            <div className={Styles.slider}>
                <label htmlFor={label + element}>{label} {element.toUpperCase()}:</label>
                <RangeSlider className={Styles.rangeSlider} name={label + element} min={item.modelMinimums[element]} max={item.modelMaximums[element]} value={current[element]} onChange={this.change}/>
            </div>
        );
    }
});

module.exports = CrossSectionSlider;
