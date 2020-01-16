"use strict";

var defined = require("terriajs-cesium/Source/Core/defined").default;

/**
 * Controling viewer history
 * the basic idea is taken from Chris Scott see https://github.com/cscott530/leaflet-history
 *
 * @alias HistoryControls
 * @constructor
 *
 * @param {Object} options Object with the following properties:
 * @param {Terria} options.terria The Terria instance.
 * @param {Function} options.updateButtonState Update the state of the back and forward buttons.
 */
var HistoryControls = function(options) {
  /**
   * Instance of Terria
   * @type {Terria}
   * @default undefined
   */
  this.terria = options.terria;

  /**
   * Instance of function that update state of the buttons
   * @type {Function}
   * @default undefined
   */
  this.updateButtonState = options.updateButtonState;

  /**
   * Gets or sets the stack of history views. Used for going back through views
   * @type {Array}
   */
  this.history = [];

  /**
   * Gets or sets the stack of future views. Used for going forward through views
   * @type {Array}
   */
  this.future = [];

  /**
   * Gets or set shether we should store event. Used when user are moving through history.
   * @type {Boolean}
   * @default false
   */
  this.ignoringEvents = false;

  /**
   * Gets or set whether goBack button is dissabled. This property is observable.
   * @type {Boolean}
   * @default true
   */
  this.backDisabled = true;

  /**
   * Gets or sets whether goForward button is disabled. This property is observable.
   * @type {Boolean}
   * @default true
   */
  this.forwardDisabled = true;

  /**
   * Gets or set number of views that should be saved.
   * @type {Boolean}
   * @default 10
   */
  this.maxMovesToSave = 10;

  /**
   * We need to remove update subscription before viewer changes
   */
  this.terria.beforeViewerChanged.addEventListener(() => {
    if (defined(this.removeUpdateSubscription)) {
      this.removeUpdateSubscription();
      this.removeUpdateSubscription = undefined;
    }
  });
  /**
   * We need to update list of history and future views when viewer change, for now it is not supported to change view with history controls.
   * We also update buttons so they become disabled.
   */
  this.terria.afterViewerChanged.addEventListener(() => {
    this._clearHistory();
    this._clearFuture();
    this._updateDisabled();
    this.addUpdateSubscription();
  });

  /**
   * Function that is used to remove update subscription from the current viewer.
   */
  this.removeUpdateSubscription = undefined;
};

/**
 * Determine should we save the viewer history element. By default save everything.
 * @private
 */
HistoryControls.prototype._shouldSaveMoveInHistory = function() {
  return true;
};

/**
 * Run the updateSubscription for current viewer.
 */
HistoryControls.prototype.addUpdateSubscription = function() {
  if (defined(this.terria.leaflet)) {
    this._addUpdateSubscriptionLeaflet();
  } else if (defined(this.terria.cesium)) {
    this._addUpdateSubscriptionCesium();
  }
};

/**
 * Subscribe to map view update for Leaflet viewer.
 * On change of view the future list of views is cleared and new element is added to history.
 * We subscribe to moveStart event which returns the map object when triggered from which we store informations about current view.
 * @private
 */
HistoryControls.prototype._addUpdateSubscriptionLeaflet = function() {
  var that = this;
  const map = this.terria.leaflet.map;
  const potentialChangeCallback = function potentialChangeCallback(e) {
    if (!that.ignoringEvents) {
      const current = that._buildZoomCenterObjectFromCurrent(e.target);
      if (that._shouldSaveMoveInHistory(current)) {
        that._clearFuture();
        that._push(that.history, current);
      }
    } else {
      that.ignoringEvents = false;
    }
    that._updateDisabled();
  };

  that.removeUpdateSubscription = function() {
    map.off("movestart", potentialChangeCallback);
  };

  map.on("movestart", function(e) {
    potentialChangeCallback(e);
  });
};

/**
 * Subscribe to map view update for Leaflet viewer.
 * On change of view the future list of views is cleared and new element is added to history.
 * Subscription to moveEnd event is necessary because moveStart event doesn't return target object (camera) as it is case with Leaflet.
 * Because moveEnd event is used we have to save current view in history and future. This add extra level of logic to moving thrugh views.
 * We should be aware of https://github.com/AnalyticalGraphicsInc/cesium/issues/4753
 * @private
 */
HistoryControls.prototype._addUpdateSubscriptionCesium = function() {
  var that = this;
  const potentialChangeCallback = function potentialChangeCallback() {
    var camera = that.terria.cesium.scene.camera;
    if (!that.ignoringEvents) {
      const current = that._buildViewElementsFromCurrent(camera);
      if (that._shouldSaveMoveInHistory(current)) {
        that._clearFuture();
        that._push(that.history, current);
        that._push(that.future, current);
      }
    } else {
      that.ignoringEvents = false;
    }
    that._updateDisabled();
  };

  // subscribe to moveEnd event
  this.removeUpdateSubscription = this.terria.cesium.viewer.camera.moveEnd.addEventListener(
    function() {
      potentialChangeCallback();
    }
  );
};

/**
 * Clear history of map views.
 * @private
 */
HistoryControls.prototype._clearHistory = function() {
  this.history = [];
};

/**
 * Clear future of map views.
 * @private
 */
HistoryControls.prototype._clearFuture = function() {
  this.future = [];
};

/**
 * Function that update the state of buttons controlling goBack and goForward actions.
 * When the history list is empty goBack button is disabled.
 * When the future list is empty goForward button is disabled.
 * NOTE: because in cesium moveEnd event is used we consider list containing only current view as empty.
 * @private
 */
HistoryControls.prototype._updateDisabled = function() {
  if (defined(this.terria.leaflet)) {
    this.updateButtonState(this.history.length === 0, this.future.length === 0);
  } else if (defined(this.terria.cesium)) {
    this.updateButtonState(this.history.length === 1, this.future.length === 1);
  }
};

/**
 * Performs the move without saving the map view in history or future list.
 * Used when moving through history and future of views.
 * @param {(ZoomCenter|Camera)} view element that we are going to
 * @private
 */
HistoryControls.prototype._moveWithoutTriggeringEvent = function(view) {
  this.ignoringEvents = true;
  if (defined(this.terria.leaflet)) {
    var map = this.terria.leaflet.map;
    map.setView(view.centerPoint, view.zoom);
  } else if (defined(this.terria.cesium)) {
    this.terria.cesium.scene.camera.flyTo({
      destination: view.destination,
      orientation: view.orientation
    });
    this.terria.currentViewer.notifyRepaintRequired();
  }
};

/**
 * Custom function that performs pop from array.
 * If there are no elements in list returns undefined.
 * @param {Array} stack to perform pop on (history or future of map views)
 * @private
 */
HistoryControls.prototype._pop = function(stack) {
  if (Array.isArray(stack) && stack.length > 0) {
    return stack.splice(stack.length - 1, 1)[0];
  }
  return undefined;
};

/**
 * Custom function that push new elements to array.
 * If there is more elements in
 * @param {Array} stack to add a map view to
 * @param {(ZoomCenter|ViewElement)} value to add to the stack
 * @private
 */
HistoryControls.prototype._push = function(stack, value) {
  const maxLength = this.maxMovesToSave;
  if (Array.isArray(stack)) {
    stack.push(value);
    if (maxLength > 0 && stack.length > maxLength) {
      stack.splice(0, 1);
    }
  }
};

/**
 * When goBack or goForward buttons are clicked perform the needed action, and update the lists.
 * @param {Array} stackToPop array from which elements should be removed
 * @param {Array} stackToPushCurrent array to which element should be pushed to
 */
HistoryControls.prototype._invokeBackOrForward = function(
  stackToPop,
  stackToPushCurrent
) {
  // check if we can pop
  if (Array.isArray(stackToPop) && stackToPop.length > 0) {
    var current;
    var previous;
    if (defined(this.terria.leaflet)) {
      var map = this.terria.leaflet.map;
      current = this._buildZoomCenterObjectFromCurrent(map);
      // get most recent
      previous = this._pop(stackToPop);
      // save where we currently are
      this._push(stackToPushCurrent, current);
      this._moveWithoutTriggeringEvent(previous);
    } else if (defined(this.terria.cesium)) {
      // current view is the last element in the list for cesium
      current = this._pop(stackToPop);
      // get most recent
      previous = this._pop(stackToPop);

      // we add the view to where we are moving
      this._push(stackToPushCurrent, previous);
      // we again add the view to where we are moving
      this._push(stackToPop, previous);
      this._moveWithoutTriggeringEvent(previous);
    }
  }
};
/**
 * @returns {ZoomCenter} An object which are stored in history/future list
 * @private
 */
HistoryControls.prototype._buildZoomCenterObjectFromCurrent = function(map) {
  return new ZoomCenter(map.getZoom(), map.getCenter());
};

/**
 * @returns {ViewElement} An object which are stored in history/future list
 * @private
 */
HistoryControls.prototype._buildViewElementsFromCurrent = function(camera) {
  var viewElement = new ViewElement(camera);
  return viewElement;
};

/**
 * Function that is triggered when goBack button is clicked
 */
HistoryControls.prototype.goBack = function() {
  this._invokeBackOrForward(this.history, this.future);
  this._updateDisabled();
};
/**
 * Function that is triggered when goForward button is clicked
 */
HistoryControls.prototype.goForward = function() {
  this._invokeBackOrForward(this.future, this.history);
  this._updateDisabled();
};

/**
 * An object which stores the camera parameters, needed for moving through views.
 * @param {Camera} camera
 */
var ViewElement = function(camera) {
  this.destination = camera.positionWC.clone();
  this.orientation = {
    heading: camera.heading,
    pitch: camera.pitch,
    roll: camera.roll,
    direction: camera.direction.clone(),
    up: camera.up.clone(),
    right: camera.right.clone()
  };
};

/**
 * An object which stores zoom and centerPoint of the map.
 * @param {Number} zoom
 * @param {LatLng} centerPoint An object containing the latitude and longitude of map center point
 */
var ZoomCenter = function(zoom, centerPoint) {
  this.zoom = zoom;
  this.centerPoint = centerPoint;
  console.log(zoom);
  console.log(centerPoint);
};

module.exports = HistoryControls;
