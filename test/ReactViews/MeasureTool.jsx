'use strict';

/*global require,expect*/
// import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import React from 'react';
import ReactTestUtils from 'react-addons-test-utils';

// Note getMountedInstance will be built into React 15, and not available in v2.0.0 of react-shallow-testutils
// cf. https://github.com/sheepsteak/react-shallow-testutils/commit/8daa3c2361acfa6ec45f533cf7eea5751c51bf24
import {getMountedInstance} from 'react-shallow-testutils';

import {findWithType} from 'react-shallow-testutils';
import Terria from '../../lib/Models/Terria';

import MeasureTool from '../../lib/ReactViews/Map/Navigation/MeasureTool';
const Entity = require('terriajs-cesium/Source/DataSources/Entity.js');
const ConstantPositionProperty = require('terriajs-cesium/Source/DataSources/ConstantPositionProperty.js');


function getShallowRenderedOutput(jsx) {
    const renderer = ReactTestUtils.createRenderer();
    renderer.render(jsx);
    return renderer.getRenderOutput();
}

describe('MeasureTool-jsx', function() {

    let terria;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
    });

    it('prettifies distance when distance is in metres', function() {
        const measureTool = <MeasureTool terria={terria}/>;
        const renderer = ReactTestUtils.createRenderer();
        renderer.render(measureTool);
        const instance = getMountedInstance(renderer);
        const prettyDistance = instance.prettifyDistance(480);

        expect(prettyDistance).toEqual("480.00 m");
    });

    it('prettifies distance when distance is in kilometres', function() {
        const measureTool = <MeasureTool terria={terria}/>;
        const renderer = ReactTestUtils.createRenderer();
        renderer.render(measureTool);
        const instance = getMountedInstance(renderer);
        const prettyDistance = instance.prettifyDistance(1280.23);

        expect(prettyDistance).toEqual("1.28 km");
    });

    it('prettifies distance when distance is very large', function() {
        const measureTool = <MeasureTool terria={terria}/>;
        const renderer = ReactTestUtils.createRenderer();
        renderer.render(measureTool);
        const instance = getMountedInstance(renderer);
        const prettyDistance = instance.prettifyDistance(123123280.23);

        expect(prettyDistance).toEqual("123,123.28 km");
    });

    it('measures geodesic distance in 3D mode', function() {
        const measureTool = <MeasureTool terria={terria}/>;
        const renderer = ReactTestUtils.createRenderer();
        renderer.render(measureTool);
        const instance = getMountedInstance(renderer);
        const prettyDistance = instance.getGeodesicDistance();

        var pointOne = new Entity({
                    name: 'Wellington, NZ',
                    point: {
                               color: Color.WHITE,
                               pixelSize: 8,
                               outlineColor: Color.BLACK,
                               outlineWidth: 2
                           },
                    position: ConstantPositionProperty(Cartesian3())
                });

        var pointTwo = new Entity({
                    name: 'Los Angeles, USA',
                    point: {
                               color: Color.WHITE,
                               pixelSize: 8,
                               outlineColor: Color.BLACK,
                               outlineWidth: 2
                           },
                    position: ConstantPositionProperty(Cartesian3())
                });

        expect(prettyDistance).toEqual("123,123.28 km");
    });

    // it measures geodesic distance in leaflet mode
    // it measures distance accurately
    // it measures distance accurately with more points
    // it updates distance when a point is removed
});

