"use strict";

/*global require,expect*/
// import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import React from "react";
import { findWithType } from "react-shallow-testutils";
import { getShallowRenderedOutput } from "./MoreShallowTools";

// import Entity from 'terriajs-cesium/Source/DataSources/Entity';

import { FeatureInfoPanel } from "../../lib/ReactViews/FeatureInfo/FeatureInfoPanel";
import Loader from "../../lib/ReactViews/Loader";
import PickedFeatures from "../../lib/Map/PickedFeatures";
import runLater from "../../lib/Core/runLater";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";

// var separator = ',';
// if (typeof Intl === 'object' && typeof Intl.NumberFormat === 'function') {
//     separator = (Intl.NumberFormat().format(1000)[1]);
// }

describe("FeatureInfoPanel", function() {
  let terria;
  // let feature;
  let viewState;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria
    });
  });

  it("has isVisible class when viewState.featureInfoPanelIsVisible is true", function() {
    viewState.featureInfoPanelIsVisible = true;
    const panel = (
      <FeatureInfoPanel terria={terria} viewState={viewState} t={() => {}} />
    );
    const result = getShallowRenderedOutput(panel);
    expect(result.props.children.props.className).toContain("is-visible");
  });

  it("displays loader while asychronously loading feature information", function() {
    var pickedFeatures = new PickedFeatures();
    pickedFeatures.allFeaturesAvailablePromise = runLater(function() {});
    terria.pickedFeatures = pickedFeatures;
    const panel = (
      <FeatureInfoPanel terria={terria} viewState={viewState} t={() => {}} />
    );
    const result = getShallowRenderedOutput(panel);
    expect(findWithType(result, Loader)).toBeDefined();
  });

  it("does not have isVisible class when viewState.featureInfoPanelIsVisible is false", function() {
    viewState.featureInfoPanelIsVisible = false;
    const panel = (
      <FeatureInfoPanel terria={terria} viewState={viewState} t={() => {}} />
    );
    const result = getShallowRenderedOutput(panel);
    expect(result.props.children.props.className).not.toContain("is-visible");
  });

  // This test won't work for two reasons:
  //   - the behaviour it tests occurs in ComponentDidMount
  //   - FeatureInfoPanel doesn't have FeatureInfoSections - there is a FeatureInfoCatalogItem layer in between.
  //
  // it('shows an open section even if none have any info', function() {
  //     const feature1 = new Entity({
  //         name: 'Foo'
  //     });
  //     const feature2 = new Entity({
  //         name: 'Bar'
  //     });
  //     var pickedFeatures = new PickedFeatures();
  //     pickedFeatures.allFeaturesAvailablePromise = runLater(function() {
  //         pickedFeatures.features = [feature1, feature2];
  //     });
  //     terria.pickedFeatures = pickedFeatures;
  //     const panel = <FeatureInfoPanel terria={terria} viewState={viewState}/>;
  //     const result = getShallowRenderedOutput(panel);
  //     const sections = findAllWithType(result, FeatureInfoSection);
  //     expect(sections.length).toEqual(2);
  //     expect(sections[0].props.isOpen).toBe(true);
  // });
});
