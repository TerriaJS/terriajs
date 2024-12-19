import React from "react";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import Guide from "./Guide.jsx";
import satelliteGuideData from "./satelliteGuideData.js";
import { action, makeObservable } from "mobx";
import { observer } from "mobx-react";

export const SATELLITE_GUIDE_KEY = "satelliteGuidance";

@observer
class SatelliteGuide extends React.Component {
  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  };

  constructor() {
    // @ts-expect-error TS(2554): Expected 1-2 arguments, but got 0.
    super();
    makeObservable(this);
  }

  @action.bound
  handleMakeTopElement() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.topElement = "Guide";
  }

  @action.bound
  setShowSatelliteGuidance(bool: any) {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.showSatelliteGuidance = bool;
  }

  render() {
    // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
    const { terria, viewState, t } = this.props;
    const guideData = satelliteGuideData(t);
    return (
      <Guide
        terria={terria}
        guideKey={SATELLITE_GUIDE_KEY}
        guideData={guideData}
        setShowGuide={(bool) => {
          this.setShowSatelliteGuidance(bool);
          // If we're closing for any reason, set prompted to true
          if (!bool) {
            viewState.toggleFeaturePrompt("satelliteGuidance", true, true);
          }
        }}
      />
    );
  }
}

export default withTranslation()(SatelliteGuide);
