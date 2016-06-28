'use strict';

/*global require,expect*/
// import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import React from 'react';
import ReactTestUtils from 'react-addons-test-utils';

// Note getMountedInstance will be built into React 15, and not available in v2.0.0 of react-shallow-testutils
// cf. https://github.com/sheepsteak/react-shallow-testutils/commit/8daa3c2361acfa6ec45f533cf7eea5751c51bf24
import {getMountedInstance} from 'react-shallow-testutils';

const Terria = require('../../lib/Models/Terria');

const ImageryLayerCatalogItem = require('../../lib/Models/ImageryLayerCatalogItem');
import Timeline from '../../lib/ReactViews/BottomDock/Timeline/Timeline';
import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';
const DataSourceClock = require('terriajs-cesium/Source/DataSources/DataSourceClock');

function getMounted(jsx) {
    const renderer = ReactTestUtils.createRenderer();
    renderer.render(jsx);
    return getMountedInstance(renderer);
}

describe('Timeline', function() {
    describe('dateTime format', function() {
        let terria;
        let catalogItem;

        beforeEach(function() {
            terria = new Terria({
                baseUrl: './',
            });
            // Set time
            catalogItem = new ImageryLayerCatalogItem(terria);
            catalogItem.clock = new DataSourceClock();
        });

        it('currentTime should be used if provided', function() {
            const timeline = <Timeline terria={terria}/>;
            catalogItem.dateFormat.currentTime = "mmm";
            terria.timeSeriesStack.addLayerToTop(catalogItem);
            terria.clock.currentTime = JulianDate.fromIso8601('2016-01-01');
            terria.clock.onTick.raiseEvent(terria.clock);

            const result = getMounted(timeline);
            expect(result.state.currentTimeString).toBe('Jan');
        });

        it('currentTime should not be used if not provided', function() {
            const timeline = <Timeline terria={terria}/>;
            terria.timeSeriesStack.addLayerToTop(catalogItem);
            terria.clock.currentTime = JulianDate.fromIso8601('2016-01-01');
            terria.clock.onTick.raiseEvent(terria.clock);

            const result = getMounted(timeline);
            expect(result.state.currentTimeString).toBe('01/01/2016, 00:00:00');
        });
    });
});

