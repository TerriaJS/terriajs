'use strict';

/*global require,expect*/
import React from 'react';
import {findWithClass} from 'react-shallow-testutils';
import {getShallowRenderedOutput} from './MoreShallowTools';
import StandardUserInterface  from '../../lib/ReactViews/StandardUserInterface/StandardUserInterface';
import Terria from '../../lib/Models/Terria';
import ViewState from '../../lib/ReactViewModels/ViewState';

describe('StandardUserInterface', function() {

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
    });

    it('has class ui-root', function() {
        const ui = <StandardUserInterface terria={terria} viewState={viewState}/>;
        const result = getShallowRenderedOutput(ui);
        expect(result.props.className).toContain('ui-root');
    });

    it('feature info panel has top-element class when it is the top element', function() {
        viewState.topElement = "FeatureInfo";
        const ui = <StandardUserInterface terria={terria} viewState={viewState}/>;
        const result = getShallowRenderedOutput(ui);
        const featureInfo = findWithClass(result, "tjs-standard-user-interface__featureInfo");
        expect(featureInfo.props.className).toContain('top-element');
    });

    it('side panel has top-element class when it is the top element', function() {
        viewState.topElement = "SidePanel";
        const ui = <StandardUserInterface terria={terria} viewState={viewState}/>;
        const result = getShallowRenderedOutput(ui);
        const sidePanel = findWithClass(result, "tjs-standard-user-interface__sidePanel");
        expect(sidePanel.props.className).toContain('top-element');
    });

    it('feature info panel does not have top-element class when it is not the top element', function() {
        viewState.topElement = "SidePanel";
        const ui = <StandardUserInterface terria={terria} viewState={viewState}/>;
        const result = getShallowRenderedOutput(ui);
        const featureInfo = findWithClass(result, "tjs-standard-user-interface__featureInfo");
        expect(featureInfo.props.className).not.toContain('top-element');
    });
});
