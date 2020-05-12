"use strict";
import React from "react";
import createReactClass from "create-react-class";
import Icon from "../Icon";
import Styles from "./sector_tabs.scss";
const SectorTabs = createReactClass({
  render() {
    return (
      <div className={Styles.tabsContainer}>
        <Icon glyph={Icon.GLYPHS.agriculture} />
        <Icon glyph={Icon.GLYPHS.manufacturing} />
        <Icon glyph={Icon.GLYPHS.internationalCooperationAndDevelopment} />
        <Icon glyph={Icon.GLYPHS.coastalInfrastructure} />
        <Icon glyph={Icon.GLYPHS.finance} />
      </div>
    );
  }
});

module.exports = SectorTabs;
