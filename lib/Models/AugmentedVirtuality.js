'use strict';

var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

const CesiumMath = require('terriajs-cesium/Source/Core/Math.js');
const CesiumMatrix3 = require('terriajs-cesium/Source/Core/Matrix3.js');
const CesiumCartesian3 = require('terriajs-cesium/Source/Core/Cartesian3.js');



/**
 * Manages state for Augmented Virtuality mode.
 *
 * This mode uses the devices orientation sensors to change the viewers viewport to match the change in orientation.
 *
 * Term Augmented Virtuality:
 * "The use of real-world sensor information (e.g., gyroscopes) to control a virtual environment is an additional form
 * of augmented virtuality, in which external inputs provide context for the virtual view."
 * https://en.wikipedia.org/wiki/Mixed_reality
 *
 * @alias AugmentedVirtuality
 * @constructor
 */
var AugmentedVirtuality = function(terria) {
    const that = this;

    this._terria = terria;

    // Note: We create a persistant object and define a transient property, since knockout needs a persistant variable
    //       to track, but for state we want a 'maybe' interval_id.
    this._event_loop_state = {};

    this._manual_alignment = false;

    this._maximum_updates_per_second = AugmentedVirtuality.DEFAULT_MAXIMUM_UPDATES_PER_SECOND;

    this._orientation_updated = false;
    this._alpha = 0;
    this._beta = 0;
    this._gamma = 0;
    this._realign_alpha = 0;
    this._realign_heading = 0;


    // Always run the device orientation event, this way as soon as we enable we know where we are and set the
    // orientation rather then having to wait for the next update.
    // The following is disabled because chrome does not currently support deviceorientationabsolute correctly:
    // if ('ondeviceorientationabsolute' in window)
    // {
    //     window.addEventListener('deviceorientationabsolute', function(event) {that._orientationUpdate(event);} );  // todo note....I'm guessing that there is a cleaner way to call this on the instance then function(event) {that._storeOrientation(event);} ...but it works for now.
    //     // console.log("Debug: Device Orientation Absolute");
    // }
    // else
    if ('ondeviceorientation' in window)
    {
        window.addEventListener('deviceorientation', function(event) {that._storeOrientation(event);});  // todo note....I'm guessing that there is a cleaner way to call this on the instance then function(event) {that._storeOrientation(event);} ...but it works for now.
        // console.log("Debug: Device Orientation");
    }
    else
    {
        // console.log("Debug: Device Orientation Not Supported");
    }



    // Make the variables used by the object properties knockout observable so that changes in the state notify the UI
    // and cause a UI update. Note: These are all of the variables used just by the getters (not the setters), since
    // these unqiquely define what the current state is and are the only things that can effect/cause the state to change
    // (note: _event_loop_state is hidden behind ._eventLoopRunning() ).
    knockout.track(this, ['_event_loop_state', '_manual_alignment', '_maximum_updates_per_second']);

    // Note: The following properties are defined as knockout properties so that they can be used to trigger updates on the UI.
    /**
      * Gets whether Augmented Virtuality mode is currently enabled (true) or not (false). todo comment on setter.
      *
      * Note: If manual alignment is enable and the state is changed it will be disabled.
      *
      * @memberOf AugmentedVirtuality.prototype
      * @type {Boolean}
      */
    knockout.defineProperty(this, 'enabled', {
        get : function() {
            return this._eventLoopRunning() || this._manual_alignment;
        },
        set : function(enable) {
            if (enable !== true) {
                enable = false;

                this.resetAlignment();
            }

            if (enable !== this.enabled) {
                // If we are changing the enabled state then disable manual alignment.
                // We only do this if we are changing the enabled state so that the client can repeatedly call the
                // setting without having any effect if they aren't changing the enabled state, but so that every time
                // that the state is changed that the manual alignment is turned back off initally.
                this._manual_alignment = false;

                this._startEventLoop(enable);
            }
        }
    });

    /**
      * Gets whether manual realignment is currently enabled (true) or not (false). todo comment on setter.
      *
      * @memberOf AugmentedVirtuality.prototype
      * @type {Boolean}
      */
    knockout.defineProperty(this, 'manualAlignment', {
        get : function() {
            return this._getManualAlignment();
        },
        set : function(start_end) {
            this._setManualAlignment(start_end);
        }
    });

    /**
      * Gets and sets the the maximum number of times that the camera orientation will be updated per second. This is
      * the number of camera orientation updates per seconds is capped to (explicitly the number of times the
      * orientation is updated per second might be less but it won't be more then this number). We want the number of
      * times that the orientation is updated capped so that we don't consume to much battery life updating to
      * frequently, but responsiveness is still acceptable.
      * @memberOf AugmentedVirtuality.prototype
      * @type {Float}
      */
    knockout.defineProperty(this, 'maximumUpdatesPerSecond', {
        get : function() {
            return this._maximum_updates_per_second;
        },
        set : function(maximum_updates_per_second) {
            this._maximum_updates_per_second = maximum_updates_per_second;

            // If we are currently enabled reset to update the timing interval used.
            if (this._eventLoopRunning())
            {
                this._startEventLoop(false);
                this._startEventLoop(true);
            }
        }
    });




    this.enabled = false;

    // todo remove this - here for debugging only so that I can overload the use of the button.
    this.enabled = true;

};

/**
 * Gets the the maximum number of times that the camera orientation will be updated per second by default. This is the
 * number of camera orientation updates per seconds is capped to by default (explicitly the number of times the
 * orientation is updated per second might be less but it won't be more then this number). We want the number of times
 * that the orientation is updated capped so that we don't consume to much battery life updating to frequently, but
 * responsiveness is still acceptable.
 */
AugmentedVirtuality.DEFAULT_MAXIMUM_UPDATES_PER_SECOND = freezeObject(10.0);

/**
 * Toggles whether the Augmented Virutuality mode is enabled or disabled.
 */
AugmentedVirtuality.prototype.toggleEnabled = function() {
    this.enabled = !this.enabled;
}

/**
 * todo
 */
AugmentedVirtuality.prototype.toggleManualAlignment = function() {
    this.manualAlignment = !this.manualAlignment;
}

/**
 * Resets the alignment so that the alignement matches the devices absolute alignment.
 */
AugmentedVirtuality.prototype.resetAlignment = function() {
    this._orientation_updated = true;
    this._realign_alpha = 0;
    this._realign_heading = 0;
};

/**
 * Toggles the viewer between a range of predefined heights, setting the cameras orientation so that it matches the
 * correct direction.
 *
 * @param {Float} height The height in Meters above the globe surface.
 */
AugmentedVirtuality.prototype.toggleHoverHeight = function() {
    // These are the heights that we can toggle through (in meters - above the surface height).
    const preset_heights = [1000, 250, 20]

    // Toggle the hover height.
    if (!Number.isInteger(this._hover_level))
    {
        // If it hasn't been initalised then initalise.
        this._hover_level = 0;
    }
    else
    {
        this._hover_level = (this._hover_level + 1) % preset_heights.length;
    }
    this.hover(preset_heights[this._hover_level]);
};

/**
 * Moves the viewer to a specified height, setting the orientation so that it matches the correct Augmented Virtuality
 * direction.
 *
 * @param {Float} height The height in Meters above the globe surface.
 */
AugmentedVirtuality.prototype.hover = function(height) {
    // Get access to the camera...if it is not avaliable we can't set the new height so just return now.
    if (!defined(this._terria.cesium) ||
        !defined(this._terria.cesium.viewer) ||
        !defined(this._terria.cesium.viewer.camera))
    {
        return;
    }
    let camera = this._terria.cesium.viewer.camera;

    // Reset the viewer height.
    let original_position = camera.positionCartographic;
    // Get the ground surface height at this location and offset the height by it.
    let surface_height = this._terria.cesium.viewer.scene.globe.getHeight(original_position);
    if (defined(surface_height))
    {
        height += surface_height;
    }
    let new_position = CesiumCartesian3.fromRadians(original_position.longitude, original_position.latitude, height);
    let pose = this._getCurrentOrientation();
    pose.destination = new_position;
    camera.flyTo(pose);

    // Needed on mobile to make sure that the render is marked as dirty so that once AV mode has been disabled for a
    // while and then is reenabled the .setView() function still has effect (otherwise dispite the call the .setView()
    // the view orientation does not visually update until the user manualy moves the camera position).
    this._terria.currentViewer.notifyRepaintRequired();
};

/**
 * Gets whether the current platform is supported for enabling AV mode (currently only Apple and Android).
 *
 * At the moment we have severaly reduced the number of platforms supported to just android and mobile apple devices.
 * This is probably an artifical limitation in so much as this probably works just as nicely on other platforms, but
 * this gives us an opertunity for a softer launch and only enabling platforms that we have explicitly been able to
 * test on. Hopefully though these two platforms being the dominant players should give us enough exposure to start
 * with and we can always add more later. Note: This check is not robust and the agent could spoof the data here to
 * allow this to work on other platforms, but if they go to this length then its probably the sort of user that can
 * deal with any fallout.
 *
 * @return Wheather the plaftorm is supported (true) or not (false).
 */
AugmentedVirtuality.prototype.suitableBrowser = function() {
    if (navigator.userAgent.match(/Android/i)) {
        return true;
    }
    if (navigator.userAgent.match(/iPhone|iPad/i)) {
        return true;
    }

    return true; // todo have made this true for now to disable for ongoing debugging on desktop...but just make it false to make this work nicely again.
}

/**
 * todo
 */
AugmentedVirtuality.prototype._getManualAlignment = function() {
    return this.enabled && this._manual_alignment;
}

/**
 * todo
 */
AugmentedVirtuality.prototype._setManualAlignment = function(start_end) {
    // Only allow manual alignment changes when the module is enabled.
    if (this.enabled !== true) {
        return;
    }

    // Sanitise the input value to a boolean.
    if (start_end !== true) {
        start_end = false;
    }

    if ((start_end === false) &&
        defined(this._terria.cesium) &&
        defined(this._terria.cesium.viewer) &&
        defined(this._terria.cesium.viewer.camera))
    {
        this._realign_alpha = this._alpha;
        this._realign_heading = CesiumMath.toDegrees(this._terria.cesium.viewer.camera.heading);
    }

    if (this._manual_alignment !== start_end) {
        this._manual_alignment = start_end;
        this._startEventLoop(!this._manual_alignment);
    }
};

/**
 * todo
 */
AugmentedVirtuality.prototype._eventLoopRunning = function() {
    return defined(this._event_loop_state.interval_id);
}

/**
 * Enable or disable the Augmented Virutuality mode event loop. When enabled the orientation will effect the cameras
 * view and when disabled the device orientation will not effect the cameras view.
 * @param {Boolean} enable Whether to start the event loop (true) or stop the event loop (false).
 * @private
 */
AugmentedVirtuality.prototype._startEventLoop = function(enable) {
    // Are we actually changing the state?
    if (this._eventLoopRunning() !== enable)
    {
        if (enable === true)
        {
            const that = this;

            this._orientation_updated = true;

            let interval_ms = 1000 / this._maximum_updates_per_second;
            let id = setInterval(function() {
                that._updateOrientation();
                }, interval_ms);
            this._event_loop_state = {interval_id:id};
        }
        else
        {
            clearInterval(this._event_loop_state.interval_id);
            this._event_loop_state = {};
        }
    }
};

/**
 * Device orientation update event callback function. Stores the updated orientation into the object state.
 * @param {Object} event Contains the updated device orientation.
 * @private
 */
AugmentedVirtuality.prototype._storeOrientation = function(event) {
    this._alpha = event.alpha;
    this._beta = event.beta;
    this._gamma = event.gamma;
    this._orientation_updated = true;
};

/**
 * This function updates the cameras orientation using the last orientation recorded and the current screen orientation.
 *
 * @private
 */
AugmentedVirtuality.prototype._updateOrientation = function() {

    // Check if the screen orientation has changed and mark the orientation updated if it has.
    let screen_orientation = this._getCurrentScreenOrientation();
    if (screen_orientation !== this._last_screen_orientation)
    {
        this._orientation_updated = true;
    }
    this._last_screen_orientation = screen_orientation;


    // Optomise by only updating the camera view if some part of the orientation calculation has changed.
    if (!this._orientation_updated)
    {
	// The orientation has not been updated so don't waste time changing the orientation.
        return;
    }
    this._orientation_updated = false;

    // Get access to the camera...if it is not avaliable we can't set the orientation so just return now.
    if (!defined(this._terria.cesium) ||
        !defined(this._terria.cesium.viewer) ||
        !defined(this._terria.cesium.viewer.camera))
    {
        return;
    }
    let camera = this._terria.cesium.viewer.camera;

    camera.setView(this._getCurrentOrientation(screen_orientation));

    // Needed on mobile to make sure that the render is marked as dirty so that once AV mode has been disabled for a
    // while and then is reenabled the .setView() function still has effect (otherwise dispite the call the .setView()
    // the view orientation does not visually update until the user manualy moves the camera position).
    this._terria.currentViewer.notifyRepaintRequired();
};

/**
 * Gets the current orientation stored in the object state and returns the roll, pitch and heading which can be used to set the cameras orientation.
 * @param {Float} screen_orientation The screen orientation in degrees. Note: This field is optional, if supplied this value will be used for the screen orientation, otherwise the screen orientation will be obtained during the execution of this function.
 * @param {Object} A object with the roll, pitch and heading stored into the orientation.
 * @private
 */
AugmentedVirtuality.prototype._getCurrentOrientation = function(screen_orientation){
    const alpha = this._alpha;
    const beta = this._beta;
    const gamma = this._gamma;

    const realign_alpha = this._realign_alpha;
    const realign_heading = this._realign_heading;

    if (!defined(screen_orientation))
    {
        screen_orientation = this._getCurrentScreenOrientation();
    }


    let rotation = CesiumMatrix3.clone(CesiumMatrix3.IDENTITY, rotation);
    let rotation_increment;

    // Roll - Counteract the change in the (orientation) frame of reference when the screen is rotated and the
    //        rotation lock is not on (the browser reorients the frame of reference to align with the new screen
    //        orientation - where as we want it of the device relative to the world).
    rotation_increment = CesiumMatrix3.fromRotationZ(CesiumMath.toRadians(screen_orientation));
    CesiumMatrix3.multiply(rotation, rotation_increment, rotation);

    // Pitch - Align the device orientation frame with the ceasium orientation frame.
    rotation_increment = CesiumMatrix3.fromRotationX(CesiumMath.toRadians(90));
    CesiumMatrix3.multiply(rotation, rotation_increment, rotation);

    // Roll - Apply the deivce roll.
    rotation_increment = CesiumMatrix3.fromRotationZ(CesiumMath.toRadians(gamma));
    CesiumMatrix3.multiply(rotation, rotation_increment, rotation);

    // Pitch - Apply the deivce pitch.
    rotation_increment = CesiumMatrix3.fromRotationX(CesiumMath.toRadians(-beta));
    CesiumMatrix3.multiply(rotation, rotation_increment, rotation);

    // Heading - Apply the incremental deivce heading (from when start was last triggered).
    rotation_increment = CesiumMatrix3.fromRotationY(CesiumMath.toRadians(-(alpha-realign_alpha)));
    CesiumMatrix3.multiply(rotation, rotation_increment, rotation);

    // Heading - Use the offset when the orientation was last started.
    rotation_increment = CesiumMatrix3.fromRotationY(CesiumMath.toRadians(realign_heading));
    CesiumMatrix3.multiply(rotation, rotation_increment, rotation);

    // Relable the matrix elements to match with the math formulation.
    // TODO Insert documentation here on the math.
    let rotation_vector = CesiumMatrix3.toArray(rotation);
    let r11 = rotation_vector[0];
    let r12 = rotation_vector[3];
    let r13 = rotation_vector[6];
    let r21 = rotation_vector[1];
    let r22 = rotation_vector[4];
    let r23 = rotation_vector[7];
    let r31 = rotation_vector[2];
    let r32 = rotation_vector[5];
    let r33 = rotation_vector[8];

    let heading = CesiumMath.toDegrees(Math.atan2(-r31, r33));
    let roll    = CesiumMath.toDegrees(Math.atan2(-r12, r22));
    let pitch   = CesiumMath.toDegrees(Math.atan2(-r32, Math.sqrt(r31*r31 + r33*r33)));

    // Create an object with the roll, pitch and heading we just computed.
    return {
        orientation:
        {
            roll    : CesiumMath.toRadians(roll),
            pitch   : CesiumMath.toRadians(pitch),
            heading : CesiumMath.toRadians(heading)
        }
    };
};

/**
 * todo
 */
AugmentedVirtuality.prototype._getCurrentScreenOrientation = function(){
    if (defined(screen.orientation.angle)) {
        return screen.orientation.angle;
    }

    if (defined(window.orientation)) {
        return window.orientation;
    }

    return 0;
}

module.exports = AugmentedVirtuality;
