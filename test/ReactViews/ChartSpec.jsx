'use strict';

/*global require,expect*/
import React from 'react';
import ReactTestUtils from 'react-addons-test-utils';

// Note getMountedInstance will be built into React 15, and not available in v2.0.0 of react-shallow-testutils
// cf. https://github.com/sheepsteak/react-shallow-testutils/commit/8daa3c2361acfa6ec45f533cf7eea5751c51bf24
import {getMountedInstance} from 'react-shallow-testutils';

import Chart  from '../../lib/ReactViews/Chart/Chart';
// import Loader from '../../lib/ReactViews/Loader';
// import Terria from '../../lib/Models/Terria';
// import ViewState from '../../lib/ReactViewModels/ViewState';

// var separator = ',';
// if (typeof Intl === 'object' && typeof Intl.NumberFormat === 'function') {
//     separator = (Intl.NumberFormat().format(1000)[1]);
// }

function getShallowRenderedOutput(jsx) {
    const renderer = ReactTestUtils.createRenderer();
    renderer.render(jsx);
    return renderer.getRenderOutput();
}

describe('Chart', function() {

    it('loads data from a url', function(done) {
        // React.createElement(Chart, {
        //     key: 'chart',
        //     axisLabel: {
        //         x: previewXLabel,
        //         y: undefined
        //     },
        //     url: defined(sources) ? sources[0] : undefined,
        //     data: sourceDataAsTableStructure(sourceData),
        //     xColumn: node.attribs['x-column'],
        //     yColumns: yColumns,
        //     styling: styling,
        //     highlightX: node.attribs['highlight-x'],
        //     // columnNames: columnNames,  // Not sure yet if we need this; ideally Chart would get it direct from data.
        //     // columnUnits: columnUnits,
        //     transitionDuration: 300
        // });
        const chart = <Chart url='test/csv_nongeo/time_series.csv'/>;
        const renderer = ReactTestUtils.createRenderer();
        renderer.render(chart);
        const instance = getMountedInstance(renderer);
        instance.getChartDataPromise().then(function(data) {
            expect(data.length).toEqual(1);
            expect(data[0].points.length).toEqual(8);
        }).then(done).otherwise(fail);
    });

});