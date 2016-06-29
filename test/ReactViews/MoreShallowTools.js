'use strict';

//*global require,expect*/
// import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import React from 'react';
import ReactTestUtils from 'react-addons-test-utils';
import {findAll} from 'react-shallow-testutils';

export function getShallowRenderedOutput(jsx) {
    const renderer = ReactTestUtils.createRenderer();
    renderer.render(jsx);
    return renderer.getRenderOutput();
}

export function findAllEqualTo(reactElement, text) {
    return findAll(reactElement, (element) => element && element === text);
}

export function findAllWithPropsChildEqualTo(reactElement, text) {
    // Returns elements with element.props.children[i] or element.props.children[i][j] equal to text, for any i or j.
    return findAll(reactElement, (element) => {
        if (!(element && element.props && element.props.children)) {
            return;
        }
        return element.props.children.indexOf(text) >= 0 || (element.props.children.some && element.props.children.some(x => x && x.length && x.indexOf(text) >= 0));
    });
}

