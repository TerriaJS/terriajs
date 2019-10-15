"use strict";

import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";
import Styles from "./map-interaction-window.scss";
import classNames from "classnames";
import defined from "terriajs-cesium/Source/Core/defined";
import { observer } from "mobx-react";

const MapInteractionWindow = observer(
  createReactClass({
    displayName: "MapInteractionWindow",

    propTypes: {
      terria: PropTypes.object,
      viewState: PropTypes.object
    },

    /* eslint-disable-next-line camelcase */
    UNSAFE_componentWillUnmount() {
      this.removeContextItem();
    },

    /* eslint-disable-next-line camelcase */
    UNSAFE_componentWillReceiveProps(nextProps) {
      // Only enable context item if MapInteractionWindow is rendering
      const interactionMode =
        this.props.terria.mapInteractionModeStack &&
        this.props.terria.mapInteractionModeStack[
          this.props.terria.mapInteractionModeStack.length - 1
        ];
      if (defined(interactionMode)) {
        this.enableContextItem(nextProps);
      } else {
        this.removeContextItem();
      }
    },

    enableContextItem(props) {
      this.removeContextItem();
      if (
        defined(props.viewState.previewedItem) &&
        defined(props.viewState.previewedItem.contextItem)
      ) {
        props.viewState.previewedItem.contextItem.isEnabled = true;
        this._lastContextItem = props.viewState.previewedItem.contextItem;
      }
    },

    removeContextItem() {
      if (defined(this._lastContextItem)) {
        this._lastContextItem.isEnabled = false;
        this._lastContextItem = undefined;
      }
    },

    render() {
      const interactionMode =
        this.props.terria.mapInteractionModeStack &&
        this.props.terria.mapInteractionModeStack[
          this.props.terria.mapInteractionModeStack.length - 1
        ];
      const windowClass = classNames(Styles.window, {
        [Styles.isActive]: interactionMode
      });

      return (
        <div className={windowClass} aria-hidden={!interactionMode}>
          <div className={Styles.content}>
            {interactionMode &&
              parseCustomHtmlToReact(interactionMode.message())}
          </div>
          {interactionMode &&
            interactionMode.customUi &&
            interactionMode.customUi()}
          <button
            type="button"
            onClick={interactionMode && interactionMode.onCancel}
            className={Styles.btn}
          >
            {interactionMode && interactionMode.buttonText}
          </button>
        </div>
      );
    }
  })
);

module.exports = MapInteractionWindow;
