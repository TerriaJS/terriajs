import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import ObserveModelMixin from '../ObserveModelMixin';
import Cesium from '../../Models/Cesium';
import CesiumSplitter from './CesiumSplitter';

// Shows <CesiumSplitter> if it is appropriate.
// This is done as two separate components so that the cesium splitter can forget its state when it is unmounted -
// because terria.currentViewer forgets its value of imagerySplitPosition.

const CesiumSplitterIfNeeded = createReactClass({
    displayName: 'CesiumSplitterIfNeeded',
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: PropTypes.object.isRequired
    },

    render() {
        const terria = this.props.terria;
        if (!terria.showSplitter) {
            return null;
        }
        return (
            <CesiumSplitter terria={terria} />
        );
    }
});

module.exports = CesiumSplitterIfNeeded;
