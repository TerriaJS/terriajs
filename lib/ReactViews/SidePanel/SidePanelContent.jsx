import createReactClass from "create-react-class";

import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Icon from "../Icon";
import SectorTabs from "./SectorTabs";
import Styles from "./side-panel-content.scss";
const SidePanelContent = createReactClass({
  displayName: "SidePanelContent",

  propTypes: {
    t: PropTypes.func.isRequired
  },
  render() {
    const { t } = this.props;
    return (
      <>
        <div className={Styles.panelHeading}>
          <span className={Styles.siteTitle}>Sectors</span>
        </div>
        <SectorTabs />
        <div className={Styles.panelHeading}>
          <span className={Styles.siteTitle}>Sector name</span>
        </div>
        <div className={Styles.sectorInfo}>
          <p>Sector information panel</p>
        </div>
      </>
    );
  }
});

module.exports = withTranslation()(SidePanelContent);
