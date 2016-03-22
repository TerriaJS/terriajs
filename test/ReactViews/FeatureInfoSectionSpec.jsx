'use strict';

/*global require,expect*/
// import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import React from 'react';
import ReactTestUtils from 'react-addons-test-utils';

import Entity from 'terriajs-cesium/Source/DataSources/Entity';

import FeatureInfoSection from '../../lib/ReactViews/FeatureInfo/FeatureInfoSection';
import Terria from '../../lib/Models/Terria';

describe('FeatureInfoSection', function() {

    let terria;
    let feature;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        const properties = {
            'Foo': 'bar',
            'moo': 'd"e"r,p'
        };
        feature = new Entity({
            name: 'Bar',
            properties: properties
        });
    });

    it('does something', function() {
        feature.description = {getValue: function() { return '<p>hi!</p>'; }};
        const tester = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock}/>;
        const renderer = ReactTestUtils.createRenderer();
        renderer.render(tester);
        const result = renderer.getRenderOutput();
        // expect(result.type).toBe('li');
        const content = result.props.children[1];
        expect(content.type).toBe('section');
        const p = content.props.children.props.children[1][0]; // I have no idea why it's in this position, and don't want to test that it always is.
        expect(p.type).toBe('p');
        expect(p.props.children[1][0]).toBe('hi!'); // As above.
    });

    // TODO
    it('uses a white background for complete HTML documents only', function() {
        feature.description = {getValue: function() { return '<html><body>hi!</body></html>';}};
        // var section = new FeatureInfoPanelSectionViewModel(panel, feature);
        // expect(section.useWhiteBackground).toBe(true);
        // section.destroy();

        feature.description = {getValue: function() { return '<div>hi!</div>';}};
        // section = new FeatureInfoPanelSectionViewModel(panel, feature);
        // expect(section.useWhiteBackground).toBe(false);
        // section.destroy();

        feature.description = {getValue: function() { return '<html attr="yes">\n<body>hi!</body>\n</html>';}};
        // section = new FeatureInfoPanelSectionViewModel(panel, feature);
        // expect(section.useWhiteBackground).toBe(true);
        // section.destroy();
    });


    // describe('when template is provided', function () {
    //     var section;

    //     beforeEach(function() {
    //         var catalogItem = {
    //             featureInfoTemplate: '<div>{{blah}}</div>'
    //         };

    //         section = new FeatureInfoPanelSectionViewModel(panel, feature, catalogItem);
    //     });

    //     describe('rawDataVisible', function () {
    //         it('should be false on init', function () {
    //             expect(section.rawDataVisible).toBe(false);
    //         });

    //         it('should be true once showRawData is called', function () {
    //             section.showRawData();

    //             expect(section.rawDataVisible).toBe(true);
    //         });

    //         it('should be false once hideRawData is called', function () {
    //             section.showRawData();
    //             section.hideRawData();

    //             expect(section.rawDataVisible).toBe(false);
    //         });
    //     });

    //     it('rawData should still be available', function() {
    //        expect(section.rawData).toBeDefined();
    //     });

    //     it('templatedInfo should be available', function() {
    //         expect(section.templatedInfo).toBeDefined();
    //     });
    // });

});
