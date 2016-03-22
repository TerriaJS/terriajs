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
            properties: properties,
            description: {getValue: function() { return '<p>hi!</p>'; }}
        });
    });

    it('does something', function() {
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

    // it('calls forceUpdate when observables used in the render change', function() {
    //     var result = renderAndSubscribe(spy, function() {
    //         return someObject.foo;
    //     });

    //     expect(result).toBe(5);
    //     expect(spy.forceUpdate).not.toHaveBeenCalled();

    //     someObject.foo = 6;
    //     expect(spy.forceUpdate).toHaveBeenCalled();
    // });

    // it('does not call forceUpdate for observables accessed in a nested call to renderAndSubscribe', function() {
    //     var secondSpy = jasmine.createSpyObj('nested component', ['forceUpdate']);

    //     var result = renderAndSubscribe(spy, function() {
    //         renderAndSubscribe(secondSpy, function() {
    //             return someObject.bar;
    //         });
    //         return someObject.foo;
    //     });

    //     expect(result).toBe(5);
    //     expect(spy.forceUpdate).not.toHaveBeenCalled();
    //     expect(secondSpy.forceUpdate).not.toHaveBeenCalled();

    //     someObject.bar = 'goodbye';
    //     expect(spy.forceUpdate).not.toHaveBeenCalled();
    //     expect(secondSpy.forceUpdate).toHaveBeenCalled();
    // });

    // it('unsubscribes when the component is unmounted', function() {
    //     var spy = jasmine.createSpyObj('component', ['forceUpdate', 'componentWillUnmount']);

    //     var result = renderAndSubscribe(spy, function() {
    //         return someObject.foo;
    //     });

    //     spy.componentWillUnmount();

    //     expect(result).toBe(5);
    //     expect(spy.componentWillUnmount).toHaveBeenCalled();

    //     someObject.foo = 6;
    //     expect(spy.forceUpdate).not.toHaveBeenCalled();
    // });
});
