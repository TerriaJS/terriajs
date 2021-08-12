"use strict";

import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
// import { Medium } from "../Generic/Responsive";
import Icon from "../../Styled/Icon";
import { runInAction } from "mobx";
import MapIconButton from "../MapIconButton/MapIconButton";
import withControlledVisibility from "../HOCs/withControlledVisibility";

const FeedbackButton = observer(
  createReactClass({
    displayName: "FeedbackButton",

    propTypes: {
      viewState: PropTypes.object.isRequired,
      t: PropTypes.func.isRequired
    },

    onClick() {
      runInAction(() => {
        this.props.viewState.feedbackFormIsVisible = true;
      });
    },

    render() {
      const { t } = this.props;
      return (
        <MapIconButton
          expandInPlace
          iconElement={() => <Icon glyph={Icon.GLYPHS.feedback} />}
          onClick={this.onClick}
        >
          {t("feedback.feedbackBtnText")}
        </MapIconButton>
      );
    }
  })
);

export default withTranslation()(withControlledVisibility(FeedbackButton));
