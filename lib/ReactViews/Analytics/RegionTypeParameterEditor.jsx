'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import defined from 'terriajs-cesium/Source/Core/defined';
import Loader from '../Loader';
import ObserveModelMixin from '../ObserveModelMixin';
import Styles from './parameter-editors.scss';

const RegionTypeParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        previewed: PropTypes.object,
        parameter: PropTypes.object
    },

    onChange(e) {
        const regionProviders = this.getRegionProviders();
        if (!regionProviders) {
            return;
        }

        const value = regionProviders.filter(r => r.regionType === e.target.value)[0];
        this.props.parameter.value = value;
    },

    getRegionProviders() {
        let regionProviders;

        // We expect this promise to resolve immediately because the parameter
        // should already be loaded before we display this React component.
        this.props.parameter.getAllRegionTypes().then(rp => {
            regionProviders = rp;
        });

        return regionProviders;
    },

    render() {
        const value = this.props.parameter.value;
        const regionProviders = this.getRegionProviders();

        if (!regionProviders) {
            return <Loader />;
        }

        return <select className={Styles.field}
                       onChange={this.onChange}
                       value={defined(value) ? value.regionType : ''}>
                       {regionProviders.map((r, i)=>
                        (<option value={r.regionType}
                                 key={i}
                         >{r.regionType}</option>))}
                </select>;
    }
});

module.exports = RegionTypeParameterEditor;
