import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import Cartesian2 from 'terriajs-cesium/Source/Core/Cartesian2';
import Styles from './terria-viewer-wrapper.scss';

import ObserveModelMixin from '../ObserveModelMixin';
import TerriaViewer from '../../ViewModels/TerriaViewer';
import ViewerMode from '../../Models/ViewerMode';

const TerriaViewerWrapper = createReactClass({
    displayName: 'TerriaViewerWrapper',
    mixins: [ObserveModelMixin],

    lastMouseX: -1,
    lastMouseY: -1,

    propTypes: {
        terria: PropTypes.object.isRequired,
        viewState: PropTypes.object.isRequired
    },

    getInitialState: function() {
        const scene = this.props.terria.currentViewer.scene;
        return {value: scene ? scene.imagerySplitPosition : 0.5};
    },

    componentDidMount() {
        // Create the map/globe.
        this.terriaViewer = TerriaViewer.create(this.props.terria, {
            developerAttribution: {
                text: 'Data61',
                link: 'http://www.csiro.au/en/Research/D61'
            }
        });
    },

    componentWillUnmount() {
        this.terriaViewer && this.terriaViewer.destroy();
        this.mapElement.innerHTML = '';
    },

    onMouseMove(event) {
        // Avoid duplicate mousemove events.  Why would we get duplicate mousemove events?  I'm glad you asked:
        // http://stackoverflow.com/questions/17818493/mousemove-event-repeating-every-second/17819113
        // I (Kevin Ring) see this consistently on my laptop when Windows Media Player is running.
        if (event.clientX === this.lastMouseX && event.clientY === this.lastMouseY) {
            return;
        }

        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;

        if (this.props.terria.cesium) {
            const rect = this.mapElement.getBoundingClientRect();
            const position = new Cartesian2(event.clientX - rect.left, event.clientY - rect.top);
            this.props.viewState.mouseCoords.updateCoordinatesFromCesium(this.props.terria, position);
        } else if (this.props.terria.leaflet) {
            this.props.viewState.mouseCoords.updateCoordinatesFromLeaflet(this.props.terria, event.nativeEvent);
        }
    },

    onSliderMove(event) {
        this.setState({value: event.target.value});
        this.props.terria.currentViewer.scene.imagerySplitPosition = event.target.value;
    },

    render() {
        const terria = this.props.terria;
        return (
            <aside id="cesiumContainer"
                   className={Styles.cesiumContainer}
                   ref={element => {this.mapElement = element;}}
                   onMouseMove={this.onMouseMove}>
                <div className={Styles.mapPlaceholder}>Loading the map, please wait!</div>
                <If condition={terria.viewerMode === ViewerMode.CesiumTerrain || terria.viewerMode === ViewerMode.CesiumEllipsoid}>
                    <div className="cesiumSplitter">
                        <div className="leaflet-sbs-divider" style={{left: this.state.value*100 + "%"}}></div>
                        <input className="leaflet-sbs-range" type="range" min="0" max="1" step="any" value={this.state.value} onChange={this.onSliderMove}/>
                    </div>
                </If>
            </aside>
        );
    },
});
module.exports = TerriaViewerWrapper;
