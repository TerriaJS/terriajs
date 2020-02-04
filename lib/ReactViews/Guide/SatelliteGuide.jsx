import ObserveModelMixin from "../ObserveModelMixin";
import createReactClass from "create-react-class";

import React from "react";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import Guide from "./Guide.jsx";
import satelliteGuideData from "./satelliteGuideData.js";
import { runInAction, action } from "mobx";
import { observer } from "mobx-react";

export const SATELLITE_GUIDE_KEY = "satelliteGuidance";

const SatelliteGuide = observer(
  createReactClass({
    displayName: "SatelliteGuide",

    mixins: [ObserveModelMixin],
    propTypes: {
      terria: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      t: PropTypes.func.isRequired
    },

    handleMakeTopElement() {
      runInAction(() => {
        this.props.viewState.topElement = "Guide";
      });
    },

    setShowSatelliteGuidance(bool) {
      runInAction(() => {
        this.props.viewState.showSatelliteGuidance = bool;
      });
    },

    render() {
      const { terria, viewState, t } = this.props;
      const guideData = satelliteGuideData(t);

      return (
        <Guide
          hasIntroSlide
          // Use this as guide won't track viewstate
          isTopElement={viewState.topElement === "Guide"}
          handleMakeTopElement={this.handleMakeTopElement}
          terria={terria}
          guideKey={SATELLITE_GUIDE_KEY}
          guideData={guideData}
          showGuide={viewState.showSatelliteGuidance}
          setShowGuide={bool => {
            this.setShowSatelliteGuidance(bool);
            // If we're closing for any reason, set prompted to true
            if (!bool) {
              viewState.toggleFeaturePrompt("satelliteGuidance", true, true);
            }
          }}
        />
      );
    }
  })
);

export default withTranslation()(SatelliteGuide);
