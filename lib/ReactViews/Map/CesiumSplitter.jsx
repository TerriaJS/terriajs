import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import Styles from './cesium-splitter.scss';

import ObserveModelMixin from '../ObserveModelMixin';
import TerriaViewer from '../../ViewModels/TerriaViewer';
import ViewerMode from '../../Models/ViewerMode';

// When the range slider has value 0, the left edge of the thumb is at the left edge of the screen,
// However, the divider is at the _center_ of the thumb, which is thumbWidth/2 pixels (say 20px).
// Thus the imagerySplitPosition is not 0, but 20 / canvasWidth.
// On the right edge, imagerySplitPosition is not 1, but (canvasWidth - 20) / canvasWidth.

const CesiumSplitter = createReactClass({
    displayName: 'CesiumSplitter',
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: PropTypes.object.isRequired
    },

    getInitialState: function() {
        const scene = this.props.terria.currentViewer.scene;
        return {value: scene ? scene.imagerySplitPosition : 0.5};
    },

    onSliderMove(event) {
        const scene = this.props.terria.currentViewer.scene;
        const thumbWidth = this.props.terria.currentViewer.splitterThumbWidth;
        const canvasWidth = scene.canvas.clientWidth;
        this.setState({value: event.target.value});
        this.props.terria.currentViewer.scene.imagerySplitPosition = (event.target.value * (canvasWidth - thumbWidth) + thumbWidth / 2) / canvasWidth;
    },

    render() {
        const terria = this.props.terria;
        if (!terria.showSplitter) {
            return null;
        }
        if (terria.viewerMode === ViewerMode.CesiumTerrain || terria.viewerMode === ViewerMode.CesiumEllipsoid) {
            return (
                <div className="cesiumSplitter">
                    <div className={Styles.dividerWrapper}>
                        <div className="leaflet-sbs-divider" style={{left: this.state.value * 100 + "%"}}></div>
                    </div>
                    <input className="leaflet-sbs-range" type="range" min="0" max="1" step="any" value={this.state.value} onChange={this.onSliderMove}/>
                </div>
            );
        } else {
            return null;
        }
    }
});

module.exports = CesiumSplitter;
