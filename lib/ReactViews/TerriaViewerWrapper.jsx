import React from 'react';
import TerriaViewer from '../ViewModels/TerriaViewer';
import Cartesian2 from 'terriajs-cesium/Source/Core/Cartesian2';

const TerriaViewerWrapper = React.createClass({
    //mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        mouseCoords: React.PropTypes.object.isRequired
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
        this.terriaViewer.destroy();
        document.getElementById('cesiumContainer').innerHTML = '';
    },

    onMouseMove(event) {
        if (this.props.terria.cesium) {
            const rect = this.mapElement.getBoundingClientRect();
            const position = new Cartesian2(event.clientX - rect.left, event.clientY - rect.top);
            this.props.mouseCoords.updateCoordinatesFromCesium(this.props.terria, position);
        } else if (this.props.terria.leaflet) {
            this.props.mouseCoords.updateCoordinatesFromLeaflet(this.props.terria, event.nativeEvent);
        }
    },

    render() {
        return (
            <aside className="map overflow-hidden" onMouseMove={this.onMouseMove}>
                <div id="cesiumContainer" ref={element => this.mapElement = element}></div>
            </aside>
        );
    }
});
module.exports = TerriaViewerWrapper;
