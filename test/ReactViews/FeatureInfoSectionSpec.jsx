'use strict';

/*global require,expect*/
// import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import React from 'react';
import ReactTestUtils from 'react-addons-test-utils';

import Entity from 'terriajs-cesium/Source/DataSources/Entity';
import Iso8601 from 'terriajs-cesium/Source/Core/Iso8601';
import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';
import TimeInterval from 'terriajs-cesium/Source/Core/TimeInterval';
import TimeIntervalCollectionProperty from 'terriajs-cesium/Source/DataSources/TimeIntervalCollectionProperty';

import FeatureInfoSection from '../../lib/ReactViews/FeatureInfo/FeatureInfoSection';
import Terria from '../../lib/Models/Terria';

function getShallowRenderedOutput(jsx) {
    const renderer = ReactTestUtils.createRenderer();
    renderer.render(jsx);
    return renderer.getRenderOutput();
}

function getContentAndDescription(renderedResult) {
    const content = renderedResult.props.children[1];
    const descriptionElement = content.props.children.props.children[1][0]; // I have no idea why it's in this position, and don't want to test that it always is.
    const descriptionText = descriptionElement.props.children[1][0]; // Ditto.
    return {
        content: renderedResult.props.children[1],
        descriptionElement: descriptionElement,
        descriptionText: descriptionText
    };
}

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
            properties: properties,
            description: {
                getValue: function() { return '<p>hi!</p>'; },
                isConstant: true
            }
        });
    });

    it('renders a static description', function() {
        const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock}/>;
        const result = getShallowRenderedOutput(section);
        // expect(result.type).toBe('li');
        const {content, descriptionElement, descriptionText} = getContentAndDescription(result);
        expect(content.type).toBe('section');
        expect(descriptionElement.type).toBe('p');
        expect(descriptionText).toBe('hi!');
    });

    function timeVaryingDescription() {
        const desc = new TimeIntervalCollectionProperty();
        desc.intervals.addInterval(new TimeInterval({start: JulianDate.fromDate(new Date('2010-01-01')), stop: JulianDate.fromDate(new Date('2011-01-01')), data: '<p>hi</p>'}));
        desc.intervals.addInterval(new TimeInterval({start: JulianDate.fromDate(new Date('2011-01-01')), stop: JulianDate.fromDate(new Date('2012-01-01')), data: '<p>bye</p>'}));
        return desc;
    }

    it('renders a time-varying description', function() {
        feature.description = timeVaryingDescription();
        terria.clock.currentTime = JulianDate.fromDate(new Date('2011-06-30'));
        const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock}/>;
        const result = getShallowRenderedOutput(section);
        // expect(result.type).toBe('li');
        let {content, descriptionElement, descriptionText} = getContentAndDescription(result);
        expect(content.type).toBe('section');
        expect(descriptionElement.type).toBe('p');
        expect(descriptionText).toBe('bye');

        terria.clock.currentTime = JulianDate.fromDate(new Date('2010-06-30'));
        const section2 = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock}/>;
        const result2 = getShallowRenderedOutput(section2);
        // expect(result.type).toBe('li');
        ({content, descriptionElement, descriptionText} = getContentAndDescription(result2));
        expect(content.type).toBe('section');
        expect(descriptionElement.type).toBe('p');
        expect(descriptionText).toBe('hi');
    });

    it('removes all clock event listeners', function() {
        feature.description = timeVaryingDescription();
        const renderer = ReactTestUtils.createRenderer();
        const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock}/>;
        renderer.render(section);
        renderer._instance._instance.componentDidMount();
        expect(terria.clock.onTick.numberOfListeners).toEqual(1);
        renderer.unmount();
        expect(terria.clock.onTick.numberOfListeners).toEqual(0);
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
