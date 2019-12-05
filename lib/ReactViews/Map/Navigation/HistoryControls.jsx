"use strict";
const React = require("react");
const PropTypes = require("prop-types");
import createReactClass from "create-react-class";
import Icon from "../../Icon.jsx";
import Styles from "./history-control.scss";
import defined from "terriajs-cesium/Source/Core/defined";
import { withTranslation } from "react-i18next";

/** the most of the stuff here are developed by Chris Scott see https://github.com/cscott530/leaflet-history
 */

const HistoryControl = createReactClass({
  propTypes: {
    terria: PropTypes.object,
    t: PropTypes.func.isRequired
  },
  _setUp: false,
  _map: null,
  _options: {
    shouldSaveMoveInHistory: function(zoomCenter) {
      return true;
    }
  },
  _state: {
    ignoringEvents: false,
    maxMovesToSave: 10,
    history: {
      items: []
    },
    future: {
      items: []
    }
  },

  getInitialState() {
    return {
      backDisabled: null,
      forwardDisabled: null,
      maxMovesToSave: 10
    };
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    this.viewerSubscriptions = [];
    this.removeUpdateSubscription = undefined;

    this.viewerSubscriptions.push(
      this.props.terria.beforeViewerChanged.addEventListener(() => {
        if (defined(this.removeUpdateSubscription)) {
          this.removeUpdateSubscription();
          this.removeUpdateSubscription = undefined;
        }
      })
    );

    this.addUpdateSubscription();

    this.viewerSubscriptions.push(
      this.props.terria.afterViewerChanged.addEventListener(() => {
        this.addUpdateSubscription();
      })
    );
  },

  componentWillUnmount() {
    this.viewerSubscriptions.push(
      this.props.terria.afterViewerChanged.addEventListener(() => {
        this.addUpdateSubscription();
      })
    );
  },

  addUpdateSubscription() {
    const that = this;
    if (defined(this.props.terria.leaflet)) {
      const map = this.props.terria.leaflet.map;
      this._map = this.props.terria.leaflet.map;

      const potentialChangeCallback = function potentialChangeCallback(e) {
        if (!that._state.ignoringEvents) {
          const current = that._buildZoomCenterObjectFromCurrent(e.target);
          if (that._options.shouldSaveMoveInHistory(current)) {
            that._state.future.items = [];
            that._push(that._state.history, current);
          }
        } else {
          that._state.ignoringEvents = false;
        }
        that._updateDisabled(map);
      };

      that.removeUpdateSubscription = function() {
        map.off("movestart", potentialChangeCallback);
      };

      map.on("movestart", function(e) {
        potentialChangeCallback(e);
      });
      this._updateDisabled(map);
    }
  },

  _updateDisabled(map) {
    const backDisabled = this._state.history.items.length === 0;
    const forwardDisabled = this._state.future.items.length === 0;

    if (backDisabled !== this.state.backDisabled) {
      this.setState({ backDisabled: backDisabled });
      // this._state.backDisabled = backDisabled;
      map.fire("historyback" + (backDisabled ? "disabled" : "enabled"));
    }
    if (forwardDisabled !== this.state.forwardDisabled) {
      this.setState({ forwardDisabled: forwardDisabled });
      // this._state.forwardDisabled = forwardDisabled;
      map.fire("historyforward" + (forwardDisabled ? "disabled" : "enabled"));
    }
  },

  performActionWithoutTriggeringEvent(action) {
    this._state.ignoringEvents = true;
    if (typeof action === "function") {
      action();
    }
  },

  moveWithoutTriggeringEvent(zoomCenter, map) {
    this.performActionWithoutTriggeringEvent(function() {
      map.setView(zoomCenter.centerPoint, zoomCenter.zoom);
    });
  },

  clearHistory() {
    this._state.history.items = [];
    this._updateDisabled();
  },

  clearFuture() {
    this._state.future.items = [];
    this._updateDisabled();
  },

  _pop(stack) {
    stack = stack.items;
    if (Array.isArray(stack) && stack.length > 0) {
      return stack.splice(stack.length - 1, 1)[0];
    }
    return undefined;
  },

  _push(stack, value) {
    const maxLength = this._state.maxMovesToSave;
    stack = stack.items;
    if (Array.isArray(stack)) {
      stack.push(value);
      if (maxLength > 0 && stack.length > maxLength) {
        stack.splice(0, 1);
      }
    }
  },

  _invokeBackOrForward(eventName, stackToPop, stackToPushCurrent, map) {
    const response = this._popStackAndUseLocation(
      stackToPop,
      stackToPushCurrent,
      map
    );
    if (response) {
      map.fire(eventName, response);
      return true;
    }
    return false;
  },

  _popStackAndUseLocation(stackToPop, stackToPushCurrent, map) {
    // check if we can pop
    if (Array.isArray(stackToPop.items) && stackToPop.items.length > 0) {
      const current = this._buildZoomCenterObjectFromCurrent(map);
      // get most recent
      const previous = this._pop(stackToPop);
      // save where we currently are in the 'other' stack
      this._push(stackToPushCurrent, current);
      this.moveWithoutTriggeringEvent(previous, map);

      return {
        previousLocation: previous,
        currentLocation: current
      };
    }
  },

  _buildZoomCenterObjectFromCurrent(map) {
    return new ZoomCenter(map.getZoom(), map.getCenter());
  },

  goBack() {
    return this._invokeBackOrForward(
      "historyback",
      this._state.history,
      this._state.future,
      this._map
    );
  },

  goForward() {
    return this._invokeBackOrForward(
      "historyforward",
      this._state.future,
      this._state.history,
      this._map
    );
  },

  render() {
    const { t } = this.props;
    return (
      <div className={Styles.historyControl}>
        <ul className={Styles.list}>
          <li>
            <button
              type="button"
              onClick={this.goBack}
              className={Styles.back}
              title={t("historyControl.back")}
              disabled={this.state.backDisabled}
            >
              <Icon glyph={Icon.GLYPHS.decrease} />
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={this.goForward}
              className={Styles.forward}
              title={t("historyControl.forward")}
              disabled={this.state.forwardDisabled}
            >
              <Icon glyph={Icon.GLYPHS.increase} />
            </button>
          </li>
        </ul>
      </div>
    );
  }
});

const ZoomCenter = function(zoom, centerPoint) {
  this.zoom = zoom;
  this.centerPoint = centerPoint;
};

module.exports = withTranslation()(HistoryControl);
