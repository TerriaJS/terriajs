import CustomDataSource from 'terriajs-cesium/Source/DataSources/CustomDataSource';
import Entity from 'terriajs-cesium/Source/DataSources/Entity.js';
import Ellipsoid from 'terriajs-cesium/Source/Core/Ellipsoid';
import Cartographic from 'terriajs-cesium/Source/Core/Cartographic';
import Cartesian3 from 'terriajs-cesium/Source/Core/Cartesian3';
import VerticalOrigin from 'terriajs-cesium/Source/Scene/VerticalOrigin';

import markerIcon from '../../../wwwroot/images/map-pin.png';

export function addMarker(terria, viewState, result) {
    if (!viewState.searchState.mapPointerDataSource) {
        viewState.searchState.mapPointerDataSource = new CustomDataSource('Points');
    }

    if (!terria.dataSources.contains(viewState.searchState.mapPointerDataSource)) {
        terria.dataSources.add(viewState.searchState.mapPointerDataSource);
    }

    viewState.searchState.mapPointerDataSource.entities.removeAll();

    const firstPointEntity = new Entity({
        name: result.name,
        position: Ellipsoid.WGS84.cartographicToCartesian(Cartographic.fromDegrees(result.location.longitude, result.location.latitude)),
        description: `${result.location.latitude}, ${result.location.longitude}`,
        billboard: {
            image: markerIcon,
            scale: 0.5,
            eyeOffset: new Cartesian3(0.0, 0.0, 50.0),
            verticalOrigin: VerticalOrigin.BOTTOM
        }
    });
    viewState.searchState.mapPointerDataSource.entities.add(firstPointEntity);
}

export function removeMarker(terria, viewState) {
    terria.dataSources.remove(viewState.searchState.mapPointerDataSource);
}
