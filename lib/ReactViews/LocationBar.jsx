'use strict';
import Cartesian2 from 'terriajs-cesium/Source/Core/Cartesian2';
import Cartographic from 'terriajs-cesium/Source/Core/Cartographic';
import CesiumMath from 'terriajs-cesium/Source/Core/Math';
import defined from 'terriajs-cesium/Source/Core/defined';
import EarthGravityModel1996 from '../Map/EarthGravityModel1996';
import EllipsoidTerrainProvider from 'terriajs-cesium/Source/Core/EllipsoidTerrainProvider';
import Intersections2D from 'terriajs-cesium/Source/Core/Intersections2D';
import ObserveModelMixin from './ObserveModelMixin';
import proj4 from 'proj4';
import React from 'react';
import when from 'terriajs-cesium/Source/ThirdParty/when';

const lastHeightSamplePosition = new Cartographic();
let accurateHeightTimer;
let tileRequestInFlight;
const accurateSamplingDebounceTime = 250;

const LocationBar = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        terria: React.PropTypes.object,
        showUtmZone: React.PropTypes.bool
    },

    getDefaultProps: function() {
        return {
            showUtmZone: true
        };
    },

    getInitialState() {
        return {
            useProjection: false,
            elevation: '28m',
            utmZone: '56',
            latitude: '43.199°S',
            longitude: '154.461°E',
            east: '618699.50',
            north: '618699.50'
        };
    },

    componentWillMount() {
        this.mapElement = document.getElementById('cesiumContainer');
        this.geoidModel = new EarthGravityModel1996(this.props.terria.baseUrl + 'data/WW15MGH.DAC');
        this.useProjection = false;
        this.proj4Projection = '+proj=utm +ellps=GRS80 +units=m +no_defs';
        this.projectionUnits = 'm';
        this.proj4longlat = '+proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees +no_defs';
    },

    componentDidMount() {
        this.mapElement.addEventListener('mousemove', (event)=>{
            if (defined(this.props.terria.cesium)) {
                const rect = this.mapElement.getBoundingClientRect();
                const position = new Cartesian2(event.clientX - rect.left, event.clientY - rect.top);
                this.updateCoordinatesFromCesium(position);
            } else if (defined(this.props.terria.leaflet)) {
                this.updateCoordinatesFromLeaflet(event);
            }
        }, false);
    },

    updateCoordinatesFromCesium(position) {
        const scene = this.props.terria.cesium.scene;
        const camera = scene.camera;
        const pickRay = camera.getPickRay(position);
        const globe = scene.globe;
        const pickedTriangle = globe.pickTriangle(pickRay, scene);
        if (defined(pickedTriangle)) {
            // Get a fast, accurate-ish height every time the mouse moves.
            const ellipsoid = globe.ellipsoid;

            const v0 = ellipsoid.cartesianToCartographic(pickedTriangle.v0);
            const v1 = ellipsoid.cartesianToCartographic(pickedTriangle.v1);
            const v2 = ellipsoid.cartesianToCartographic(pickedTriangle.v2);
            const intersection = ellipsoid.cartesianToCartographic(pickedTriangle.intersection);
            let errorBar;

            if (globe.terrainProvider instanceof EllipsoidTerrainProvider) {
                intersection.height = undefined;
            } else {
                const barycentric = Intersections2D.computeBarycentricCoordinates(
                    intersection.longitude, intersection.latitude,
                    v0.longitude, v0.latitude,
                    v1.longitude, v1.latitude,
                    v2.longitude, v2.latitude);

                if (barycentric.x >= -1e-15 && barycentric.y >= -1e-15 && barycentric.z >= -1e-15) {
                    const height = barycentric.x * v0.height +
                                 barycentric.y * v1.height +
                                 barycentric.z * v2.height;
                    intersection.height = height;
                }

                const geometricError = globe.terrainProvider.getLevelMaximumGeometricError(pickedTriangle.tile.level);
                const approximateHeight = intersection.height;
                const minHeight = Math.max(pickedTriangle.tile.data.minimumHeight, approximateHeight - geometricError);
                const maxHeight = Math.min(pickedTriangle.tile.data.maximumHeight, approximateHeight + geometricError);
                const minHeightGeoid = minHeight - (this.geoidModel ? this.geoidModel.minimumHeight : 0.0);
                const maxHeightGeoid = maxHeight + (this.geoidModel ? this.geoidModel.maximumHeight : 0.0);
                errorBar = Math.max(Math.abs(approximateHeight - minHeightGeoid), Math.abs(maxHeightGeoid - approximateHeight));
            }

            this.cartographicToFields(intersection, errorBar);
            this.debounceSampleAccurateHeight(globe, intersection);
        } else {
            this.setState({
                elevation: undefined,
                utmZone: undefined,
                latitude: undefined,
                longitude: undefined,
                north: undefined,
                east: undefined
            });
        }
    },

    updateCoordinatesFromLeaflet(mouseMoveEvent) {
        const latLng = this.props.terria.leaflet.map.mouseEventToLatLng(mouseMoveEvent);
        const coordinates = Cartographic.fromDegrees(latLng.lng, latLng.lat);
        coordinates.height = undefined;
        this.cartographicToFields(coordinates);
    },

    cartographicToFields(coordinates, errorBar) {

        const latitude = CesiumMath.toDegrees(coordinates.latitude);
        const longitude = CesiumMath.toDegrees(coordinates.longitude);

        const zone = 1 + Math.floor((longitude + 180) / 6);

        if (this.state.useProjection) {
            const projection = this.proj4Projection + ' +zone=' + zone +
            (latitude < 0 ? ' +south' : '');

            const projPoint = proj4((this.proj4longlat), (projection),
                [longitude, latitude]);

            this.setState({
                utmZone: zone + (latitude < 0.0 ? 'S' : 'N'),
                north: projPoint[1].toFixed(2) + this.projectionUnits,
                east: projPoint[0].toFixed(2) + this.projectionUnits
            });
        }

        this.setState({
            latitude: Math.abs(latitude).toFixed(3) +
            '°' + (latitude < 0.0 ? 'S' : 'N'),
            longitude: Math.abs(longitude).toFixed(3) +
            '°' + (longitude < 0.0 ? 'W' : 'E')
        });

        if (defined(coordinates.height)) {
            this.setState({
                elevation: Math.round(coordinates.height) + (defined(errorBar) ? '±' +
                  Math.round(errorBar) : '') + 'm'
            });
        } else {
            this.setState({
                elevation: undefined
            });
        }
    },

    debounceSampleAccurateHeight(globe, position) {
        // After a delay with no mouse movement, get a more accurate height.
        Cartographic.clone(position, lastHeightSamplePosition);

        const terrainProvider = globe.terrainProvider;
        if (!(terrainProvider instanceof EllipsoidTerrainProvider)) {
            clearTimeout(accurateHeightTimer);
            accurateHeightTimer = setTimeout(()=>{
                this.sampleAccurateHeight(terrainProvider, position);
            }, accurateSamplingDebounceTime);
        }
    },

    sampleAccurateHeight(terrainProvider, position) {
        accurateHeightTimer = undefined;
        if (tileRequestInFlight) {
            // A tile request is already in flight, so reschedule for later.
            accurateHeightTimer = setTimeout(()=>{
                this.sampleAccurateHeight(terrainProvider, position);
            }, accurateSamplingDebounceTime);
            return;
        }

        // Find the most detailed available tile at the last mouse position.
        const tilingScheme = terrainProvider.tilingScheme;
        const tiles = terrainProvider._availableTiles;
        let foundTileID;
        let foundLevel;

        for (let level = tiles.length - 1; !foundTileID && level >= 0; --level) {
            const levelTiles = tiles[level];
            const tileID = tilingScheme.positionToTileXY(position, level);
            const yTiles = tilingScheme.getNumberOfYTilesAtLevel(level);
            const tmsY = yTiles - tileID.y - 1;

            // Is this tile ID available from the terrain provider?
            for (let i = 0, len = levelTiles.length; !foundTileID && i < len; ++i) {
                const range = levelTiles[i];
                if (tileID.x >= range.startX && tileID.x <= range.endX && tmsY >= range.startY && tmsY <= range.endY) {
                    foundLevel = level;
                    foundTileID = tileID;
                }
            }
        }

        if (foundTileID) {
            // This tile has our most accurate available height, so go get it.
            const geoidHeightPromise = this.geoidModel ? this.geoidModel.getHeight(position.longitude, position.latitude) : undefined;
            const terrainPromise = terrainProvider.requestTileGeometry(foundTileID.x, foundTileID.y, foundLevel, false);
            tileRequestInFlight = when.all([geoidHeightPromise, terrainPromise], (result)=>{
                const geoidHeight = result[0] || 0.0;
                const terrainData = result[1];
                tileRequestInFlight = undefined;
                if (Cartographic.equals(position, lastHeightSamplePosition)) {
                    position.height = terrainData.interpolateHeight(tilingScheme.tileXYToRectangle(foundTileID.x, foundTileID.y, foundLevel), position.longitude, position.latitude) - geoidHeight;
                    this.cartographicToFields(position);
                } else {
                    // Mouse moved since we started this request, so the result isn't useful.  Try again next time.
                }
            }, function() {
                tileRequestInFlight = undefined;
            });
        }
    },

    toggleUseProjection() {
        this.setState({
            useProjection: !this.state.useProjection
        });
    },

    renderLatitudeLongitude() {
        if(!this.state.useProjection) {
            return (<li className="location-bar--long-lat">
                        <div className='lat'><span>Lat</span><span>{this.state.latitude}</span></div>
                        <div className='lon'><span>Lon</span><span>{this.state.longitude}</span></div>
                    </li>);
        }
        return (<li class="location-bar--zone">
                    <div className='zone'><span>ZONE</span><span>{this.state.utmZone}</span></div>
                    <div className='e'><span>E</span><span>{this.state.east}</span></div>
                    <div className='n'><span>N</span><span>{this.state.north}</span></div>
                </li>);

    },

    renderElevation() {
        return (<li><span>Elev</span>
                    <span>{this.state.elevation}</span>
                </li>);
    },

    render() {
        return (<button className='location-bar btn' onClick={this.toggleUseProjection}>
                          {this.renderLatitudeLongitude()}
                          {this.renderElevation()}
                </button>);
    }
});
module.exports = LocationBar;
