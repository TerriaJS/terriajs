'use strict';

/*global require,expect*/
// import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import React from 'react';
import ReactTestUtils from 'react-addons-test-utils';
import {findWithType} from 'react-shallow-testutils';

// import Entity from 'terriajs-cesium/Source/DataSources/Entity';

import FeatureInfoPanel  from '../../lib/ReactViews/FeatureInfo/FeatureInfoPanel';
import Loader from '../../lib/ReactViews/Loader';
import PickedFeatures from '../../lib/Map/PickedFeatures';
import runLater from '../../lib/Core/runLater';
import Terria from '../../lib/Models/Terria';
import ViewState from '../../lib/ReactViewModels/ViewState';

// var separator = ',';
// if (typeof Intl === 'object' && typeof Intl.NumberFormat === 'function') {
//     separator = (Intl.NumberFormat().format(1000)[1]);
// }

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
        viewState = new ViewState({
            terria: terria
        });
        // const properties = {
        //     'Foo': 'bar',
        //     'moo': 'd"e"r,p'
        // };
        // feature = new Entity({
        //     name: 'Bar',
        //     properties: properties
        // });
    });

    it('does not have isVisible class when viewState.featureInfoPanelIsVisible not set', function() {
        const panel = <FeatureInfoPanel terria={terria} viewState={viewState}/>;
        const result = getShallowRenderedOutput(panel);
        expect(result.props.className).not.toContain('isVisible');
    });

    it('has isVisible class when viewState.featureInfoPanelIsVisible is true', function() {
        viewState.featureInfoPanelIsVisible = true;
        const panel = <FeatureInfoPanel terria={terria} viewState={viewState}/>;
        const result = getShallowRenderedOutput(panel);
        expect(result.props.className).toContain('isVisible');
    });

    it('displays loader while asychronously loading feature information', function() {
        var pickedFeatures = new PickedFeatures();
        pickedFeatures.allFeaturesAvailablePromise = runLater(function() {});
        terria.pickedFeatures = pickedFeatures;
        const panel = <FeatureInfoPanel terria={terria} viewState={viewState}/>;
        const result = getShallowRenderedOutput(panel);
        expect(findWithType(result, Loader)).toBeDefined();
    });

});

// function treeContainsText(tree, s) {
//     if (tree.props.children === undefined) {
//         return false;
//     }
//     if (tree.props.children.props !== undefined) {
//         // A single child is sometimes present in children without being in an array.
//         return treeContainsText(tree.props.children, s)
//     }
//     if (!Array.isArray(tree.props.children)) {
//         // Text is presented as a child, with no object around it.
//         console.log(tree.props.children);
//         return tree.props.children.indexOf(s) >= 0;
//     }
//     for (var i = 0; i < tree.props.children.length; ++i) {
//         if (treeContainsText(tree.props.children[i], s)) {
//             return true;
//         }
//     }

//     return false;
// }
