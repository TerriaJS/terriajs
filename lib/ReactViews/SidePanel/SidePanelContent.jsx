import createReactClass from "create-react-class";

import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Icon from "../Icon";
import Styles from "./side-panel.scss";
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
        <div className={Styles.tabsContainer}>
          <Icon glyph={Icon.GLYPHS.agriculture} />
          <Icon glyph={Icon.GLYPHS.manufacturing} />
          <Icon glyph={Icon.GLYPHS.internationalCooperationAndDevelopment} />
          <Icon glyph={Icon.GLYPHS.coastalInfrastructure} />
          <Icon glyph={Icon.GLYPHS.finance} />
        </div>
        <div className={Styles.panelHeading}>
          <span className={Styles.siteTitle}>Agriculture</span>
        </div>
        <div className={Styles.sectorInfo}>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
            convallis ex nulla, eu volutpat urna faucibus quis. Aliquam porta
            urna eu urna posuere dignissim. Sed bibendum ipsum in eros rhoncus
            elementum. Sed nec aliquam velit, bibendum volutpat justo. Proin
            semper viverra risus at porta. Nunc tincidunt felis eget bibendum
            elementum. In hac habitasse platea dictumst. Ut eu ullamcorper orci.
            Suspendisse potenti. Sed eu dolor consectetur ex pulvinar porttitor
            sit amet a augue. Quisque cursus blandit orci, mattis accumsan dolor
            auctor a. Mauris et velit eget massa placerat aliquet. Donec eu
            risus mi.
          </p>
        </div>
      </>
    );
  }
});

module.exports = withTranslation()(SidePanelContent);
