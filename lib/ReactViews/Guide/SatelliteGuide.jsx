import ObserveModelMixin from "../ObserveModelMixin";
import createReactClass from "create-react-class";

import React from "react";
import PropTypes from "prop-types";
import Guide from "./Guide.jsx";
import SatelliteGuideData from "./satellite-guidance.js";

export const SATELLITE_GUIDE_KEY = "satelliteGuidance";

const SatelliteGuide = createReactClass({
  displayName: "SatelliteGuide",

  mixins: [ObserveModelMixin],
  propTypes: {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired
  },
  render() {
    const { terria, viewState } = this.props;

    return (
      <Guide
        hasIntroSlide
        terria={terria}
        guideKey={SATELLITE_GUIDE_KEY}
        guideData={SatelliteGuideData}
        showGuide={viewState.showSatelliteGuidance}
        setShowGuide={bool => {
          viewState.showSatelliteGuidance = bool;
          // If we're closing for any reason, set prompted to true
          if (!bool) {
            viewState.toggleFeaturePrompt("satelliteGuidance", true, true);
          }
        }}
      />
    );
  }
});

export default SatelliteGuide;
