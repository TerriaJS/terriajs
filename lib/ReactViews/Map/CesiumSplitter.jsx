import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import Styles from './cesium-splitter.scss';

import ObserveModelMixin from '../ObserveModelMixin';
import TerriaViewer from '../../ViewModels/TerriaViewer';
import ViewerMode from '../../Models/ViewerMode';

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
        this.setState({value: event.target.value});
        this.props.terria.currentViewer.scene.imagerySplitPosition = event.target.value;
    },

    render() {
        const terria = this.props.terria;
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
