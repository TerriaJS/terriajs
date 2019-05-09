"use strict";

import defined from "terriajs-cesium/Source/Core/defined";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import CesiumMath from "terriajs-cesium/Source/Core/Math.js";
import CesiumMatrix3 from "terriajs-cesium/Source/Core/Matrix3.js";
import CesiumCartesian3 from "terriajs-cesium/Source/Core/Cartesian3.js";
import EllipsoidTerrainProvider from "terriajs-cesium/Source/Core/EllipsoidTerrainProvider";
import sampleTerrainMostDetailed from "terriajs-cesium/Source/Core/sampleTerrainMostDetailed";

/**
 * Manages state for Augmented Virtuality mode.
 *
 * This mode uses the devices orientation sensors to change the viewers viewport to match the change in orientation.
 *
 * Term Augmented Virtuality:
 * "The use of real-world sensor information (e.g., gyroscopes) to control a virtual environment is an additional form
 * of augmented virtuality, in which external inputs provide context for the virtual view."
 * {@link https://en.wikipedia.org/wiki/Mixed_reality}
 *
 * @alias AugmentedVirtuality
 * @constructor
 */
var AugmentedVirtuality = function(terria) {
  const that = this;

  this._terria = terria;

  // Note: We create a persistant object and define a transient property, since knockout needs a persistant variable
  //       to track, but for state we want a 'maybe' intervalId.
  this._eventLoopState = {};

  this._manualAlignment = false;

  this._maximumUpdatesPerSecond =
    AugmentedVirtuality.DEFAULT_MAXIMUM_UPDATES_PER_SECOND;

  this._orientationUpdated = false;
  this._alpha = 0;
  this._beta = 0;
  this._gamma = 0;
  this._realignAlpha = 0;
  this._realignHeading = 0;

  // Set the default height to be the last height so that when we first toggle (and increment) we cycle and go to the first height.
  this._hoverLevel = AugmentedVirtuality.PRESET_HEIGHTS.length - 1;

  // Always run the device orientation event, this way as soon as we enable we know where we are and set the
  // orientation rather then having to wait for the next update.
  // The following is disabled because chrome does not currently support deviceorientationabsolute correctly:
  // if ('ondeviceorientationabsolute' in window)
  // {
  //     window.addEventListener('deviceorientationabsolute', function(event) {that._orientationUpdate(event);} );
  // }
  // else
  if ("ondeviceorientation" in window) {
    window.addEventListener("deviceorientation", function(event) {
      that._storeOrientation(event);
    });
  }

  // Make the variables used by the object properties knockout observable so that changes in the state notify the UI
  // and cause a UI update. Note: These are all of the variables used just by the getters (not the setters), since
  // these unqiquely define what the current state is and are the only things that can effect/cause the state to change
  // (note: _eventLoopState is hidden behind ._eventLoopRunning() ).
  knockout.track(this, [
    "_eventLoopState",
    "_manualAlignment",
    "_maximumUpdatesPerSecond",
    "_realignAlpha",
    "_realignHeading",
    "_hoverLevel"
  ]);

  // Note: The following properties are defined as knockout properties so that they can be used to trigger updates on the UI.
  /**
   * Gets or sets whether Augmented Virtuality mode is currently enabled (true) or not (false).
   *
   * Note: If {@link AugmentedVirtuality#manualAlignment} is enabled and the state is changed it will be disabled.
   *
   * @memberOf AugmentedVirtuality.prototype
   * @member {Boolean} enabled
   */
  knockout.defineProperty(this, "enabled", {
    get: function() {
      return this._eventLoopRunning() || this._manualAlignment;
    },
    set: function(enable) {
      if (enable !== true) {
        enable = false;

        this.resetAlignment();
      }

      if (enable !== this.enabled) {
        // If we are changing the enabled state then disable manual alignment.
        // We only do this if we are changing the enabled state so that the client can repeatedly call the
        // setting without having any effect if they aren't changing the enabled state, but so that every time
        // that the state is changed that the manual alignment is turned back off initally.
        this._manualAlignment = false;

        this._startEventLoop(enable);
      }
    }
  });

  /**
   * Gets or sets whether manual realignment mode is currently enabled (true) or not (false).
   *
   * @memberOf AugmentedVirtuality.prototype
   * @member {Boolean} manualAlignment
   */
  knockout.defineProperty(this, "manualAlignment", {
    get: function() {
      return this._getManualAlignment();
    },
    set: function(startEnd) {
      this._setManualAlignment(startEnd);
    }
  });

  /**
   * Gets whether a manual realignment has been specified (true) or not (false).
   *
   * @memberOf AugmentedVirtuality.prototype
   * @member {Boolean} manualAlignmentSet
   */
  knockout.defineProperty(this, "manualAlignmentSet", {
    get: function() {
      return this._realignAlpha !== 0.0 || this._realignHeading !== 0.0;
    }
  });

  /**
   * Gets the index of the current hover level.
   *
   * Use <code>AugmentedVirtuality.PRESET_HEIGHTS.length</code> to find the total avaliable levels.
   *
   * @memberOf AugmentedVirtuality.prototype
   * @member {int} hoverLevel
   */
  knockout.defineProperty(this, "hoverLevel", {
    get: function() {
      return this._hoverLevel;
    }
  });

  /**
   * Gets or sets the the maximum number of times that the camera orientation will be updated per second. This is
   * the number of camera orientation updates per seconds is capped to (explicitly the number of times the
   * orientation is updated per second might be less but it won't be more then this number). We want the number of
   * times that the orientation is updated capped so that we don't consume to much battery life updating to
   * frequently, but responsiveness is still acceptable.
   *
   * @memberOf AugmentedVirtuality.prototype
   * @member {Float} maximumUpdatesPerSecond
   */
  knockout.defineProperty(this, "maximumUpdatesPerSecond", {
    get: function() {
      return this._maximumUpdatesPerSecond;
    },
    set: function(maximumUpdatesPerSecond) {
      this._maximumUpdatesPerSecond = maximumUpdatesPerSecond;

      // If we are currently enabled reset to update the timing interval used.
      if (this._eventLoopRunning()) {
        this._startEventLoop(false);
        this._startEventLoop(true);
      }
    }
  });

  this.enabled = false;
};

/**
 * Gets the the maximum number of times that the camera orientation will be updated per second by default. This is the
 * number of camera orientation updates per seconds is capped to by default (explicitly the number of times the
 * orientation is updated per second might be less but it won't be more then this number). We want the number of times
 * that the orientation is updated capped so that we don't consume to much battery life updating to frequently, but
 * responsiveness is still acceptable.
 */
AugmentedVirtuality.DEFAULT_MAXIMUM_UPDATES_PER_SECOND = 10.0;

/**
 * The minimum height that the viewer is allowed to hover at.
 */
AugmentedVirtuality.MINIMUM_HOVER_HEIGHT = 20.0;

/* These are the heights that we can toggle through (in meters - above the surface height).
 */
AugmentedVirtuality.PRESET_HEIGHTS = [1000, 250, 20];

/**
 * Toggles whether the AugmentedVirutuality mode is enabled or disabled.
 */
AugmentedVirtuality.prototype.toggleEnabled = function() {
  this.enabled = !this.enabled;
};

/**
 * Toggles whether manual alignement is enabled or disabled.
 */
AugmentedVirtuality.prototype.toggleManualAlignment = function() {
  this.manualAlignment = !this.manualAlignment;
};

/**
 * Resets the alignment so that the alignement matches the devices absolute alignment.
 */
AugmentedVirtuality.prototype.resetAlignment = function() {
  this._orientationUpdated = true;
  this._realignAlpha = 0;
  this._realignHeading = 0;
};

/**
 * Toggles the viewer between a range of predefined heights, setting the cameras orientation so that it matches the
 * correct orientation.
 */
AugmentedVirtuality.prototype.toggleHoverHeight = function() {
  this._hoverLevel =
    (this._hoverLevel + 1) % AugmentedVirtuality.PRESET_HEIGHTS.length;

  this.hover(AugmentedVirtuality.PRESET_HEIGHTS[this._hoverLevel]);
};

/**
 * Moves the viewer to a specified height, setting the orientation so that it matches the correct Augmented Virtuality
 * orientation.
 *
 * @param {Float} height The height in Meters above the globe surface. Note: If height is below
 *                       {@link AugmentedVirtuality.MINIMUM_HOVER_HEIGHT} the height will be set to
 *                       {@link AugmentedVirtuality.MINIMUM_HOVER_HEIGHT} to avoid visual artifacts when the viewer
 *                       becomes to close to the surface.
 * @param {Cartographic} [position] The location to hover over. If not specified the current camera location will be used.
 * @param {Boolean} [flyTo=true] Whether to fly to the location (true) or whether to jump to the location (false).
 */
AugmentedVirtuality.prototype.hover = function(height, position, flyTo) {
  const that = this;

  // Get access to the camera...if it is not avaliable we can't set the new height so just return now.
  if (
    !defined(this._terria.cesium) ||
    !defined(this._terria.cesium.viewer) ||
    !defined(this._terria.cesium.viewer.camera)
  ) {
    return;
  }
  const camera = this._terria.cesium.viewer.camera;

  if (!defined(position)) {
    position = camera.positionCartographic.clone();
  }

  flyTo = defaultValue(flyTo, true);

  // Clamp the minimum hover height (heights below this value could lead to poor visual artifacts).
  if (height < AugmentedVirtuality.MINIMUM_HOVER_HEIGHT) {
    height = AugmentedVirtuality.MINIMUM_HOVER_HEIGHT;
  }

  // Reset the viewer height.
  function flyToHeight(surfaceHeight) {
    if (defined(surfaceHeight)) {
      height += surfaceHeight;
    }

    const newPosition = CesiumCartesian3.fromRadians(
      position.longitude,
      position.latitude,
      height
    );
    const pose = that._getCurrentOrientation();
    pose.destination = newPosition;

    if (flyTo) {
      camera.flyTo(pose);
    } else {
      camera.setView(pose);
    }

    // Needed on mobile to make sure that the render is marked as dirty so that once AV mode has been disabled for a
    // while and then is reenabled the .setView() function still has effect (otherwise dispite the call the .setView()
    // the view orientation does not visually update until the user manualy moves the camera position).
    that._terria.currentViewer.notifyRepaintRequired();
  }

  // Get the ground surface height at this location and offset the height by it.
  if (
    !defined(this._terria.cesium) ||
    !defined(this._terria.cesium.scene) ||
    !defined(this._terria.cesium.scene.terrainProvider) ||
    this._terria.cesium.scene.terrainProvider instanceof
      EllipsoidTerrainProvider
  ) {
    // If we can't get access to the terrain provider or we can get access to the terrain provider and the provider is just the Ellipsoid then use the height of 0.
    flyToHeight(0);
  } else {
    const terrainProvider = this._terria.cesium.scene.terrainProvider;
    sampleTerrainMostDetailed(terrainProvider, [position]).then(function(
      updatedPosition
    ) {
      flyToHeight(updatedPosition[0].height);
    });
  }
};

/**
 * Moves the viewer to a specified location while maintaining the current height and the correct Augmented Virtuality
 * orientation.
 *
 * @param {Cartographic} position The location to hover move to.
 * @param {Float} [maximumHeight] The maximum height (in meters) to cap the current camera height to (if this value is
 *                                specified and the viewer is above this height the camera will be restricted to this height).
 * @param {Boolean} [flyTo] Whether to fly to the location (true) or whether to jump to the location (false).
 *
 * When the manual alignment is enabled this function has no effect.
 */
AugmentedVirtuality.prototype.moveTo = function(
  position,
  maximumHeight,
  flyTo
) {
  const that = this;

  // If we are in manual alignment mode we don't allow the viewer to move (since this would create a jaring UX for most use cases).
  if (this._manualAlignment) {
    return;
  }

  // Get access to the camera...if it is not avaliable we can't get the current height (or set the new location) so just return now.
  if (
    !defined(this._terria.cesium) ||
    !defined(this._terria.cesium.viewer) ||
    !defined(this._terria.cesium.viewer.camera)
  ) {
    return;
  }
  const camera = this._terria.cesium.viewer.camera;

  const cameraPosition = camera.positionCartographic.clone();
  const viewerHeight = cameraPosition.height;

  // Reset the viewer height.
  function moveToLocation(surfaceHeight) {
    if (!defined(surfaceHeight)) {
      surfaceHeight = 0;
    }

    let hoverHeight = viewerHeight - surfaceHeight;
    if (defined(maximumHeight) && hoverHeight > maximumHeight) {
      hoverHeight = maximumHeight;
    }

    that.hover(hoverHeight, position, flyTo);
  }

  // Get the ground surface height at this location and offset the height by it.
  if (
    !defined(this._terria.cesium) ||
    !defined(this._terria.cesium.scene) ||
    !defined(this._terria.cesium.scene.terrainProvider) ||
    this._terria.cesium.scene.terrainProvider instanceof
      EllipsoidTerrainProvider
  ) {
    // If we can't get access to the terrain provider or we can get access to the terrain provider and the provider is just the Ellipsoid then use the height of 0.
    moveToLocation(undefined);
  } else {
    const terrainProvider = this._terria.cesium.scene.terrainProvider;
    sampleTerrainMostDetailed(terrainProvider, [cameraPosition]).then(function(
      updatedPosition
    ) {
      moveToLocation(updatedPosition[0].height);
    });
  }
};

/**
 * Whether the user is currently setting a manual alignment.
 *
 * See also {@link AugmentedVirtuality#_setManualAlignment}.
 *
 * @return {Boolean} Whether the user is currently setting a manual alignment (true) or not (false).
 * @private
 */
AugmentedVirtuality.prototype._getManualAlignment = function() {
  return this.enabled && this._manualAlignment;
};

/**
 * Starts / stops manual alignment.
 *
 * When manual realignment is enabled it allows the user to specify a new origin for the alignment between the devices
 * physical and virtual alignment. When manual alignment is enabled the orientation is locked, to allow the user to
 * realign a visual landmark with a physical landmark.
 *
 * Note: Manual alignment is only done for the heading axis, this is because in practice we have found that the heading
 * axis is often out as mobile devices seem to have difficulty obtaining the compass direction, but seem to perform
 * relatively well in the other axes.
 *
 * Note: Realignment is only possible when AugmentedVirtuality is enabled. If AugmentedVirtuality is disabled while
 *       manual alignment is in progress it will be cancelled.
 *
 * See also {@link AugmentedVirtuality#_getManualAlignment}.
 *
 * @param {Boolean} startEnd Whether the user is starting (true) or ending (false) the realignment.
 * @private
 */
AugmentedVirtuality.prototype._setManualAlignment = function(startEnd) {
  // Only allow manual alignment changes when the module is enabled.
  if (this.enabled !== true) {
    return;
  }

  // Sanitise the input value to a boolean.
  if (startEnd !== true) {
    startEnd = false;
  }

  if (
    startEnd === false &&
    defined(this._terria.cesium) &&
    defined(this._terria.cesium.viewer) &&
    defined(this._terria.cesium.viewer.camera)
  ) {
    this._realignAlpha = this._alpha;
    this._realignHeading = CesiumMath.toDegrees(
      this._terria.cesium.viewer.camera.heading
    );
  }

  if (this._manualAlignment !== startEnd) {
    this._manualAlignment = startEnd;
    this._startEventLoop(!this._manualAlignment);
  }
};

/**
 * Whether the event loop is currently running.
 *
 * @return {Boolean} enable Whether to start the event loop is currently running (true) or not (false).
 * @private
 */
AugmentedVirtuality.prototype._eventLoopRunning = function() {
  return defined(this._eventLoopState.intervalId);
};

/**
 * Start or stop the Augmented Virutuality mode event loop. When enabled the orientation will effect the cameras
 * view and when disabled the device orientation will not effect the cameras view.
 *
 * @param {Boolean} enable Whether to start the event loop (true) or stop the event loop (false).
 * @private
 */
AugmentedVirtuality.prototype._startEventLoop = function(enable) {
  // Are we actually changing the state?
  if (this._eventLoopRunning() !== enable) {
    if (enable === true) {
      const that = this;

      this._orientationUpdated = true;

      const intervalMs = 1000 / this._maximumUpdatesPerSecond;
      const id = setInterval(function() {
        that._updateOrientation();
      }, intervalMs);
      this._eventLoopState = { intervalId: id };
    } else {
      clearInterval(this._eventLoopState.intervalId);
      this._eventLoopState = {};
    }
  }
};

/**
 * Device orientation update event callback function. Stores the updated orientation into the object state.
 *
 * @param {Object} event Contains the updated device orientation (in .alpha, .beta, .gamma).
 * @private
 */
AugmentedVirtuality.prototype._storeOrientation = function(event) {
  this._alpha = event.alpha;
  this._beta = event.beta;
  this._gamma = event.gamma;
  this._orientationUpdated = true;
};

/**
 * This function updates the cameras orientation using the last orientation recorded and the current screen orientation.
 *
 * @private
 */
AugmentedVirtuality.prototype._updateOrientation = function() {
  // Check if the screen orientation has changed and mark the orientation updated if it has.
  const screenOrientation = this._getCurrentScreenOrientation();
  if (screenOrientation !== this._lastScreenOrientation) {
    this._orientationUpdated = true;
  }
  this._lastScreenOrientation = screenOrientation;

  // Optomise by only updating the camera view if some part of the orientation calculation has changed.
  if (!this._orientationUpdated) {
    // The orientation has not been updated so don't waste time changing the orientation.
    return;
  }
  this._orientationUpdated = false;

  // Get access to the camera...if it is not avaliable we can't set the orientation so just return now.
  if (
    !defined(this._terria.cesium) ||
    !defined(this._terria.cesium.viewer) ||
    !defined(this._terria.cesium.viewer.camera)
  ) {
    return;
  }
  const camera = this._terria.cesium.viewer.camera;

  camera.setView(this._getCurrentOrientation(screenOrientation));

  // Needed on mobile to make sure that the render is marked as dirty so that once AV mode has been disabled for a
  // while and then is reenabled the .setView() function still has effect (otherwise dispite the call the .setView()
  // the view orientation does not visually update until the user manualy moves the camera position).
  this._terria.currentViewer.notifyRepaintRequired();
};

/**
 * Gets the current orientation stored in the object state and returns the roll, pitch and heading which can be used to set the cameras orientation.
 *
 * @param {Float} screenOrientation The screen orientation in degrees. Note: This field is optional, if supplied this value will be used for the screen orientation, otherwise the screen orientation will be obtained during the execution of this function.
 * @return {Object} A object with the roll, pitch and heading stored into the orientation.
 * @private
 */
AugmentedVirtuality.prototype._getCurrentOrientation = function(
  screenOrientation
) {
  const alpha = this._alpha;
  const beta = this._beta;
  const gamma = this._gamma;

  const realignAlpha = this._realignAlpha;
  const realignHeading = this._realignHeading;

  if (!defined(screenOrientation)) {
    screenOrientation = this._getCurrentScreenOrientation();
  }

  return this._computeTerriaOrientation(
    alpha,
    beta,
    gamma,
    screenOrientation,
    realignAlpha,
    realignHeading
  );
};

/**
 * Turns the orientation in the device frame of reference into an orientation suitable for specifying the Terria camera orientation.
 *
 * @param {Float} alpha The alpha value of the device orientation in degrees (this is the alpha value in the device's frame of reference).
 * @param {Float} beta  The beta  value of the device orientation in degrees (this is the beta  value in the device's frame of reference).
 * @param {Float} gamma The gamma value of the device orientation in degrees (this is the gamma value in the device's frame of reference).
 * @param {Float} screenOrientation The screen orientation in degrees.
 * @param {Float} realignAlpha   The value of the alpha   value the last time realignment was completed (supply zero if realignment is not supported).
 * @param {Float} realignHeading The value of the heading value the last time realignment was completed (supply zero if realignment is not supported).
 * @return {Object} An object with the roll, pitch and heading stored into the orientation.
 * @private
 */
AugmentedVirtuality.prototype._computeTerriaOrientation = function(
  alpha,
  beta,
  gamma,
  screenOrientation,
  realignAlpha,
  realignHeading
) {
  // Note: The algorithmic formulation in this function is for simplicity of mathematical expression, readability,
  //       maintainability and modification (i.e. it is easy to understand how to update or insert new offsets or features).
  //       This is not the simplest form which clearly flows from the current formuleation and clearly simplify the
  //       logic and operations but would increase the cost of future modifications and reduce the readability of the
  //       expression. It is not anticipated that the current verbose implementation would have a significant impact
  //       on performance or accuracy, but obviously there will be some impact on both and it can be simplified in
  //       future if needed.

  const rotation = CesiumMatrix3.clone(CesiumMatrix3.IDENTITY, rotation);
  let rotationIncrement;

  // Roll - Counteract the change in the (orientation) frame of reference when the screen is rotated and the
  //        rotation lock is not on (the browser reorients the frame of reference to align with the new screen
  //        orientation - where as we want it of the device relative to the world).
  rotationIncrement = CesiumMatrix3.fromRotationZ(
    CesiumMath.toRadians(screenOrientation)
  );
  CesiumMatrix3.multiply(rotation, rotationIncrement, rotation);

  // Pitch - Align the device orientation frame with the ceasium orientation frame.
  rotationIncrement = CesiumMatrix3.fromRotationX(CesiumMath.toRadians(90));
  CesiumMatrix3.multiply(rotation, rotationIncrement, rotation);

  // Roll - Apply the deivce roll.
  rotationIncrement = CesiumMatrix3.fromRotationZ(CesiumMath.toRadians(gamma));
  CesiumMatrix3.multiply(rotation, rotationIncrement, rotation);

  // Pitch - Apply the deivce pitch.
  rotationIncrement = CesiumMatrix3.fromRotationX(CesiumMath.toRadians(-beta));
  CesiumMatrix3.multiply(rotation, rotationIncrement, rotation);

  // Heading - Apply the incremental deivce heading (from when start was last triggered).
  rotationIncrement = CesiumMatrix3.fromRotationY(
    CesiumMath.toRadians(-(alpha - realignAlpha))
  );
  CesiumMatrix3.multiply(rotation, rotationIncrement, rotation);

  // Heading - Use the offset when the orientation was last started.
  //           Note: This is logically different from the alpha value and can only be applied here in the same way
  //                 since Cesium camera is RPH (Heading last - most local). See Cesium camera rotation decomposition
  //                 for more information on the Cesium camera formuleation.
  rotationIncrement = CesiumMatrix3.fromRotationY(
    CesiumMath.toRadians(realignHeading)
  );
  CesiumMatrix3.multiply(rotation, rotationIncrement, rotation);

  // Decompose rotation matrix into roll, pitch and heading to supply to Cesium camera.
  //
  // Use notation:
  //     R = Roll, P = Pitch, H = Heading
  //     SH = Sin(Heading), CH = Cos(Heading)
  //
  // Ceasium camera rotation = RPH:
  //     [ CR, -SR,   0][  1,   0,   0][ CH,   0,  SH]   [CRCH-SRSPSH, -SRCP, CRSH-SRSPCH]
  //     [ SR,  CR,   0][  0,  CP,  SP][  0,   1,   0] = [SRCH-CRSPSH,  CRCP, SRSH+CRSPCH]
  //     [  0,   0,   1][  0, -SP,  CP][-SH,   0,  CH]   [   -CPSH   ,   -SP,    CPCH    ]
  //     Note: The sign difference of the Sin terms in pitch is different to the standard right handed rotation since
  //           Cesium rotates pitch in the left handed direction. Both heading and roll are right handed rotations.
  //
  // Use the following notation to refer to elements in the Cesium camera rotation matrix:
  //     [R00, R10, R20]
  //     [R01, R11, R21]
  //     [R02, R12, R22]
  //
  // Also note: Tan(X) = Sin(X) / Cos(X)
  //
  // Decompose matrix:
  //    H = ATan(Tan(H)) = ATan(Sin(H)/Cos(H)) = ATan (SH / CH) = ATan(CPSH/CPCH) = ATan (-R02 / R22)
  //    R = ATan(Tan(R)) = ATan(Sin(R)/Cos(R)) = ATan (SR / CR) = ATan(SRCP/CRCP) = ATan (-R10 / R11)
  //    P = ATan(Tan(P)) = ATan(Sin(P)/Cos(P)) = ATan (SP / CP)
  //                                             SP = -R12
  //                                             Need to find CP:
  //                                                 CP = Sqrt(CP^2)
  //                                                    = Sqrt(CP^2*(CH^2+SH^2))              Since: (Cos@^2 + Sin@^2) = 1
  //                                                    = Sqrt((CP^2)*(CH^2) + (CP^2)*(SH^2)) Expand
  //                                                    = Sqrt((CPCH)^2 + (CPSH)^2)           Since: N^2*M^2 = (NM)^2
  //                                                    = Sqrt(R22^2 + (-R02)^2)              Substitute
  //                                                    = Sqrt(R22^2 + R02^2)                 Since: (-N)^2 = N^2
  //  So P = ATan (-R12 / Sqrt(R22^2 + R02^2))

  // Simplify notation for readability:
  const r10 = rotation[CesiumMatrix3.COLUMN1ROW0];
  const r11 = rotation[CesiumMatrix3.COLUMN1ROW1];
  const r02 = rotation[CesiumMatrix3.COLUMN0ROW2];
  const r12 = rotation[CesiumMatrix3.COLUMN1ROW2];
  const r22 = rotation[CesiumMatrix3.COLUMN2ROW2];

  const heading = CesiumMath.toDegrees(Math.atan2(-r02, r22));
  const roll = CesiumMath.toDegrees(Math.atan2(-r10, r11));
  const pitch = CesiumMath.toDegrees(
    Math.atan2(-r12, Math.sqrt(r02 * r02 + r22 * r22))
  );

  // Create an object with the roll, pitch and heading we just computed.
  return {
    orientation: {
      roll: CesiumMath.toRadians(roll),
      pitch: CesiumMath.toRadians(pitch),
      heading: CesiumMath.toRadians(heading)
    }
  };
};

/**
 * Gets the current screen orientation.
 *
 * @return {Object} The current screen orientation in degrees.
 * @private
 */
AugmentedVirtuality.prototype._getCurrentScreenOrientation = function() {
  if (defined(screen.orientation) && defined(screen.orientation.angle)) {
    return screen.orientation.angle;
  }

  if (defined(window.orientation)) {
    return window.orientation;
  }

  return 0;
};

module.exports = AugmentedVirtuality;
