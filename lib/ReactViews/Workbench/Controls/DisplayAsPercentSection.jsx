"use strict";

import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import Checkbox from "./../../../Styled/Checkbox/Checkbox";

const DisplayAsPercentSection = createReactClass({
  displayName: "DisplayAsPercentSection",

  propTypes: {
    item: PropTypes.object,
    t: PropTypes.func.isRequired
  },

  togglePercentage() {
    this.props.item.displayPercent = !this.props.item.displayPercent;
  },

  render() {
    if (!this.props.item.canDisplayPercent) {
      return null;
    }
    const { t } = this.props;
    return (
      <Checkbox
        id="workbenchDisplayPercent"
        isChecked={this.props.item.displayPercent}
        label={t("workbench.displayPercent")}
        onChange={this.togglePercentage}
      />
    );
  }
});
module.exports = withTranslation()(DisplayAsPercentSection);
