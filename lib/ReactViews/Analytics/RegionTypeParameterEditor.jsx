'use strict';

/*global require*/
import React from 'react';
import defined from 'terriajs-cesium/Source/Core/defined';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import loadView from '../../Core/loadView';

const RegionTypeParameterEditor = React.createClass({
    propTypes: {
        previewed: React.PropTypes.object,
        parameter: React.PropTypes.object,
        parameterValues: React.PropTypes.object
    },

    getInitialState() {
        return {
            regionProviders: []
        };
    },

    componentWillMount() {
        if(!defined(this.props.parameterValues[this.props.parameter.id])) {
            this.props.parameterValues[this.props.parameter.id] = this.getDefaultValue();
        }
        this.getAllOptions();
    },

    onChange(e) {
        if(!defined(e.target.value)) {
            this.props.parameterValues[this.props.parameter.id] = this.getDefaultValue();
        } else {
            this.props.parameterValues[this.props.parameter.id] = e.target.value;
        }
        this.getAllOptions();
    },

    getDefaultValue() {
        const nowViewingItems = this.props.previewed.terria.nowViewing.items;
        for (let i = 0; i < nowViewingItems.length; ++i) {
            const item = nowViewingItems[i];
            if (defined(item.regionMapping) && defined(item.regionMapping.regionDetails) && item.regionMapping.regionDetails.length > 0) {
                return item.regionMapping.regionDetails[0].regionProvider;
            }
        }
    },

    getAllOptions() {
        const that = this;
        this.props.parameter.getAllRegionTypes().then(function(_regionProviders) {
            that.setState({
                regionProviders: _regionProviders
            });
        });
    },

    render() {
        return <select value={this.props.parameterValues[this.props.parameter.id]}
                       onChange={this.onChange}>
                       {this.state.regionProviders.map((r, i)=>(<option value={r.regionType} key={i}>{r.regionType}</option>))}
                </select>;
    }
});

module.exports = RegionTypeParameterEditor;
