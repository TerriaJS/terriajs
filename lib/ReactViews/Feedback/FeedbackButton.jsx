"use strict";

import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
// import { Medium } from "../Generic/Responsive";
import Icon from "../Icon";
// import Styles from "./feedback-button.scss";
import { runInAction } from "mobx";
import MapIconButton from "../MapIconButton/MapIconButton";

const FeedbackButton = observer(
  createReactClass({
    displayName: "FeedbackButton",

    propTypes: {
      viewState: PropTypes.object.isRequired,
      btnText: PropTypes.string.isRequired,
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
        <div
          css={`
            svg {
              width: 30px;
              height: 30px;
            }
          `}
        >
          <MapIconButton
            expandInPlace
            iconElement={() => <Icon glyph={Icon.GLYPHS.feedback} />}
            onClick={this.onClick}
          >
            {t("feedback.feedbackBtnText")}
          </MapIconButton>
        </div>
      );
    }
  })
);

export default withTranslation()(FeedbackButton);
