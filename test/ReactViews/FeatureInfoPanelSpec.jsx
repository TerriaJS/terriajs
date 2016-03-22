'use strict';

/*global require,expect*/
// import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import React from 'react';
import ReactTestUtils from 'react-addons-test-utils';

import Entity from 'terriajs-cesium/Source/DataSources/Entity';

import FeatureInfoPanel from 'terriajs/lib/ReactViews/FeatureInfo/FeatureInfoPanel';
import Terria from 'terriajs/lib/Models/Terria';
import ViewState from 'terriajs/lib/ReactViewModels/ViewState.js';

var separator = ',';
if (typeof Intl === 'object' && typeof Intl.NumberFormat === 'function') {
    separator = (Intl.NumberFormat().format(1000)[1]);
}

function getShallowRenderedOutput(jsx) {
    const renderer = ReactTestUtils.createRenderer();
    renderer.render(jsx);
    return renderer.getRenderOutput();
}

describe('FeatureInfoPanel-jsx', function() {

    let terria;
    // let feature;
    let viewState;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        viewState = new ViewState();
        // const properties = {
        //     'Foo': 'bar',
        //     'moo': 'd"e"r,p'
        // };
        // feature = new Entity({
        //     name: 'Bar',
        //     properties: properties
        // });
    });

    it('does not have visible class when isVisible false', function() {
        const panel = <FeatureInfoPanel terria={terria} viewState={viewState} isVisible={false}/>;
        const result = getShallowRenderedOutput(panel);
        expect(result.props.className).not.toContain('visible');
    });

    it('has visible class when isVisible true', function() {
        const panel = <FeatureInfoPanel terria={terria} viewState={viewState} isVisible={true}/>;
        const result = getShallowRenderedOutput(panel);
        expect(result.props.className).toContain('visible');
    });

});
