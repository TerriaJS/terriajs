'use strict';

/*global require,expect*/
// import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import React from 'react';
import ReactTestUtils from 'react-addons-test-utils';

// Note getMountedInstance will be built into React 15, and not available in v2.0.0 of react-shallow-testutils
// cf. https://github.com/sheepsteak/react-shallow-testutils/commit/8daa3c2361acfa6ec45f533cf7eea5751c51bf24
import {getMountedInstance} from 'react-shallow-testutils';

import Terria from '../../lib/Models/Terria';

import MeasureTool from '../../lib/ReactViews/Map/Navigation/MeasureTool';
const Entity = require('terriajs-cesium/Source/DataSources/Entity.js');
const ConstantPositionProperty = require('terriajs-cesium/Source/DataSources/ConstantPositionProperty.js');
const Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');
const CustomDataSource = require('terriajs-cesium/Source/DataSources/CustomDataSource');


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

        // Roughly Auckland
        var positionOne = new Cartesian3(-5088454.576893678, 465233.10329933715, -3804299.6786334896);

        // Roughly L.A.
        var positionTwo = new Cartesian3(-2503231.890682526, -4660863.528418564, 3551306.84427321);

        const distance_m = instance.getGeodesicDistance(positionOne, positionTwo);
        // This is a golden distance test, but the actual distance from LA to Auckland is roughly 10,494.93 km, so
        // close.
        expect(distance_m).toEqual(10476961.667267017);
    });

    it('measures geodesic distance in 2D mode', function() {
        terria.viewerMode = '2d';
        const measureTool = <MeasureTool terria={terria}/>;
        const renderer = ReactTestUtils.createRenderer();
        renderer.render(measureTool);
        const instance = getMountedInstance(renderer);

        // Roughly Auckland
        var positionOne = new Cartesian3(-5088454.576893678, 465233.10329933715, -3804299.6786334896);

        // Roughly L.A.
        var positionTwo = new Cartesian3(-2503231.890682526, -4660863.528418564, 3551306.84427321);

        const distance_m = instance.getGeodesicDistance(positionOne, positionTwo);
        // This is a golden distance test, but the actual distance from LA to Auckland is roughly 10,494.93 km, so
        // close.
        expect(distance_m).toEqual(10476961.667267017);
    });

    it('measures distance accurately', function() {
        const measureTool = <MeasureTool terria={terria}/>;
        const renderer = ReactTestUtils.createRenderer();
        renderer.render(measureTool);
        const instance = getMountedInstance(renderer);

        // And by accurately, I mean similar to google maps. Points are visually distinguishable points on parliament
        // house.
        var pointEntities = new CustomDataSource();
        pointEntities.entities.add(new Entity({
                            name: 'Parl house 1',
                            position: new ConstantPositionProperty(new Cartesian3(-4472628.878459197, 2674320.0223987163, -3666272.9589235038))
                        }));

        pointEntities.entities.add(new Entity({
                            name: 'Parl house 2',
                            position: new ConstantPositionProperty(new Cartesian3(-4472822.49209372, 2674246.213307502, -3666094.8052623854))
                        }));

        instance.updateDistance(pointEntities);
        expect(instance.onMakeDialogMessage()).toEqual("273.23 m");
    });

    it('measures distance accurately with more points', function() {
        const measureTool = <MeasureTool terria={terria}/>;
        const renderer = ReactTestUtils.createRenderer();
        renderer.render(measureTool);
        const instance = getMountedInstance(renderer);

        // And by accurately, I mean similar to google maps. Points are visually distinguishable points on parliament
        // house. This is roughly the same distance as 'measures distance accurately' but has more points.
        var pointEntities = new CustomDataSource();
        pointEntities.entities.add(new Entity({
            position: new ConstantPositionProperty(new Cartesian3(-4472821.5616301615, 2674248.078411612, -3666094.813749141))
                        }));
        pointEntities.entities.add(new Entity({
            position: new ConstantPositionProperty(new Cartesian3(-4472782.699102473, 2674262.986482508, -3666130.2532728123))
                        }));
        pointEntities.entities.add(new Entity({
            position: new ConstantPositionProperty(new Cartesian3(-4472753.492698317, 2674274.3463433487, -3666156.7158062747))
                        }));
        pointEntities.entities.add(new Entity({
            position: new ConstantPositionProperty(new Cartesian3(-4472723.915450494, 2674288.96271715, -3666190.6009734552))
                        }));
        pointEntities.entities.add(new Entity({
            position: new ConstantPositionProperty(new Cartesian3(-4472684.617701235, 2674304.5195146934, -3666229.3233881197))
                        }));
        pointEntities.entities.add(new Entity({
            position: new ConstantPositionProperty(new Cartesian3(-4472628.62862585, 2674320.1352525284, -3666273.2152227913))
                        }));

        instance.updateDistance(pointEntities);
        expect(instance.onMakeDialogMessage()).toEqual("272.46 m");
    });

    it('updates distance when a point is removed', function() {
        const measureTool = <MeasureTool terria={terria}/>;
        const renderer = ReactTestUtils.createRenderer();
        renderer.render(measureTool);
        const instance = getMountedInstance(renderer);

        var pointEntities = new CustomDataSource();
        pointEntities.entities.add(new Entity({
            position: new ConstantPositionProperty(new Cartesian3(-4472821.5616301615, 2674248.078411612, -3666094.813749141))
                        }));
        pointEntities.entities.add(new Entity({
            position: new ConstantPositionProperty(new Cartesian3(-4472782.699102473, 2674262.986482508, -3666130.2532728123))
                        }));
        pointEntities.entities.add(new Entity({
            position: new ConstantPositionProperty(new Cartesian3(-4472628.62862585, 2674320.1352525284, -3666273.2152227913))
                        }));

        instance.updateDistance(pointEntities);
        expect(instance.onMakeDialogMessage()).toEqual("272.45 m");

        var newPointEntities = new CustomDataSource();
        newPointEntities.entities.add(new Entity({
            position: new ConstantPositionProperty(new Cartesian3(-4472821.5616301615, 2674248.078411612, -3666094.813749141))
                        }));
        newPointEntities.entities.add(new Entity({
            position: new ConstantPositionProperty(new Cartesian3(-4472782.699102473, 2674262.986482508, -3666130.2532728123))
                        }));

        instance.updateDistance(newPointEntities);
        expect(instance.onMakeDialogMessage()).toEqual("54.66 m");
    });
});

