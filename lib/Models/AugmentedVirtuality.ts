import { action, computed, observable, runInAction } from "mobx";
import CesiumCartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import EllipsoidTerrainProvider from "terriajs-cesium/Source/Core/EllipsoidTerrainProvider";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import CesiumMatrix3 from "terriajs-cesium/Source/Core/Matrix3";
import Camera from "terriajs-cesium/Source/Scene/Camera";
import Scene from "terriajs-cesium/Source/Scene/Scene";
import Terria from "./Terria";

const sampleTerrainMostDetailed =
  require("terriajs-cesium/Source/Core/sampleTerrainMostDetailed").default;

interface EventLoopState {
  intervalId?: any;
}

interface TerriaOrientation {
  orientation: {
    roll: number;
    pitch: number;
    heading: number;
  };
  destination?: CesiumCartesian3;
}

export default class AugmentedVirtuality {
  /**
   * Gets the the maximum number of times that the camera orientation will be
   * updated per second by default. This is the number of camera orientation
   * updates per seconds is capped to by default (explicitly the number of times
   * the orientation is updated per second might be less but it won't be more
   * then this number). We want the number of times that the orientation is
   * updated capped so that we don't consume to much battery life updating to
   * frequently, but responsiveness is still acceptable.
   */
  static readonly DEFAULT_MAXIMUM_UPDATES_PER_SECOND = 10.0;

  /**
   * The minimum height that the viewer is allowed to hover at.
   */
  static readonly MINIMUM_HOVER_HEIGHT = 20.0;

  /* These are the heights that we can toggle through (in meters - above the surface height).
   */
  static readonly PRESET_HEIGHTS = [1000, 250, 20];

  @observable manualAlignment = false;
  @observable private eventLoopState: EventLoopState = {};
  @observable private orientationUpdated = false;
  @observable private alpha = 0;
  @observable private beta = 0;
  @observable private gamma = 0;
  @observable private realignAlpha = 0;
  @observable private realignHeading = 0;
  @observable private lastScreenOrientation?: number;

  @observable private maximumUpdatesPerSecond =
    AugmentedVirtuality.DEFAULT_MAXIMUM_UPDATES_PER_SECOND;

  // Set the default height to be the last height so that when we first toggle
  // (and increment) we cycle and go to the first height.
  @observable hoverLevel = AugmentedVirtuality.PRESET_HEIGHTS.length - 1;

  constructor(readonly terria: Terria) {}

  toggleEnabled() {
    if (this.active) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  @computed
  get scene(): Scene | undefined {
    return this.terria.cesium && this.terria.cesium.scene;
  }

  @computed
  get camera(): Camera | undefined {
    return this.terria.cesium && this.terria.cesium.scene.camera;
  }

  @computed
  get active() {
    return this.isEventLoopRunning || this.manualAlignment;
  }

  @action
  activate() {
    this.manualAlignment = false;
    this.startEventLoop(true);
  }

  @action
  deactivate() {
    this.resetAlignment();
    this.manualAlignment = false;
    this.startEventLoop(false);
  }

  /**
   * Toggles whether manual alignement is enabled or disabled.
   */
  @action
  toggleManualAlignment() {
    this.setManualAlignment(!this.manualAlignment);
  }

  @computed
  get manualAlignmentSet() {
    return this.realignAlpha !== 0.0 || this.realignHeading !== 0.0;
  }

  @computed
  private get isEventLoopRunning() {
    return this.eventLoopState.intervalId !== undefined;
  }

  /**
   * Toggles the viewer between a range of predefined heights, setting the
   * cameras orientation so that it matches the * correct orientation.
   */
  @action
  toggleHoverHeight() {
    this.hoverLevel =
      (this.hoverLevel + 1) % AugmentedVirtuality.PRESET_HEIGHTS.length;
    this.hover(AugmentedVirtuality.PRESET_HEIGHTS[this.hoverLevel]);
  }

  /** Moves the viewer to a specified height, setting the orientation so that
   * it matches the correct Augmented Virtuality * orientation.
   *
   * @param height The height in Meters above the globe surface. Note: If height is below
   *               {@link AugmentedVirtuality.MINIMUM_HOVER_HEIGHT} the height will be set to
   *               {@link AugmentedVirtuality.MINIMUM_HOVER_HEIGHT} to avoid visual artifacts when the viewer
   *               becomes to close to the surface.
   *
   * @param [position] The location to hover over. If not specified the current camera location will be used.
   * @param [flyTo=true] Whether to fly to the location (true) or whether to jump to the location (false).
   */
  private hover(height: number, position?: Cartographic, flyTo?: boolean) {
    // Get access to the camera...if it is not avaliable we can't set the new height so just return now.
    if (!this.camera) return;
    const camera = this.camera;
    const hoverPosition = position
      ? position
      : camera.positionCartographic.clone();

    flyTo = flyTo === undefined ? true : flyTo;

    // Clamp the minimum hover height (heights below this value could lead to poor visual artifacts).
    if (height < AugmentedVirtuality.MINIMUM_HOVER_HEIGHT) {
      height = AugmentedVirtuality.MINIMUM_HOVER_HEIGHT;
    }

    // Reset the viewer height.
    const flyToHeight = (surfaceHeight: number) => {
      height += surfaceHeight;
      const newPosition = CesiumCartesian3.fromRadians(
        hoverPosition.longitude,
        hoverPosition.latitude,
        height
      );
      const pose = {
        destination: newPosition,
        ...this.getCurrentOrientation()
      };
      if (flyTo) {
        camera.flyTo(pose);
      } else {
        camera.setView(pose);
      }

      // Needed on mobile to make sure that the render is marked as dirty so
      // that once AV mode has been disabled for a while and then is reenabled
      // the .setView() function still has effect (otherwise dispite the call
      // the .setView() the view orientation does not visually update until the
      // user manualy moves the camera position).
      this.terria.currentViewer.notifyRepaintRequired();
    };

    // Get the ground surface height at this location and offset the height by it.
    if (
      !this.scene ||
      !this.scene.terrainProvider ||
      this.scene.terrainProvider instanceof EllipsoidTerrainProvider
    ) {
      // If we can't get access to the terrain provider or we can get access to
      // the terrain provider and the provider is just the Ellipsoid then use
      // the height of 0.
      flyToHeight(0);
    } else {
      const terrainProvider = this.scene.terrainProvider;
      sampleTerrainMostDetailed(terrainProvider, [hoverPosition]).then(
        function (updatedPosition: Cartographic[]) {
          flyToHeight(updatedPosition[0].height);
        }
      );
    }
  }

  /**
   * Moves the viewer to a specified location while maintaining the current
   * height and the correct Augmented Virtuality * orientation.
   *
   * @param position The location to hover move to.

   * @param [maximumHeight] The maximum height (in meters) to cap the current
   * camera height to (if this value is specified and the viewer is above this
   * height the camera will be restricted to this height).

   * @param [flyTo] Whether to fly to the location (true) or whether to jump to
   * the location (false).
   *
   * When the manual alignment is enabled this function has no effect.
   */
  moveTo(position: Cartographic, maximumHeight: number, flyTo: boolean) {
    // If we are in manual alignment mode we don't allow the viewer to move
    // (since this would create a jaring UX for most use cases).
    if (this.manualAlignment) return;

    // Get access to the camera...if it is not avaliable we can't get the
    // current height (or set the new location) so just return now.
    if (this.camera === undefined) return;
    const camera = this.camera;
    const cameraPosition = camera.positionCartographic.clone();
    const viewerHeight = cameraPosition.height;

    // Reset the viewer height.
    const moveToLocation = (surfaceHeight: number) => {
      let hoverHeight = viewerHeight - surfaceHeight;
      if (hoverHeight > maximumHeight) hoverHeight = maximumHeight;
      this.hover(hoverHeight, position, flyTo);
    };

    const scene = this.scene;
    // Get the ground surface height at this location and offset the height by it.
    if (
      scene === undefined ||
      scene.terrainProvider === undefined ||
      scene.terrainProvider instanceof EllipsoidTerrainProvider
    ) {
      // If we can't get access to the terrain provider or we can get access to
      // the terrain provider and the provider is just the Ellipsoid then use
      // the height of 0.
      moveToLocation(0);
    } else {
      const terrainProvider = scene.terrainProvider;
      sampleTerrainMostDetailed(terrainProvider, [cameraPosition]).then(
        function (updatedPosition: Array<Cartographic>) {
          moveToLocation(updatedPosition[0].height);
        }
      );
    }
  }

  /**
   * Whether the user is currently setting a manual alignment.
   *
   * @return Whether the user is currently setting a manual alignment (true) or not (false).
   */
  private getManualAlignment(): boolean {
    return this.active && this.manualAlignment;
  }

  /**
   * Starts / stops manual alignment.
   *
   * When manual realignment is enabled it allows the user to specify a new
   * origin for the alignment between the devices physical and virtual
   * alignment. When manual alignment is enabled the orientation is locked, to
   * allow the user to realign a visual landmark with a physical landmark.
   *
   * Note: Manual alignment is only done for the heading axis, this is because in
   * practice we have found that the heading axis is often out as mobile devices
   * seem to have difficulty obtaining the compass direction, but seem to perform
   * relatively well in the other axes.
   *
   * Note: Realignment is only possible when AugmentedVirtuality is enabled. If
   *       AugmentedVirtuality is disabled while manual alignment is in progress
   *       it will be cancelled.
   *
   *
   * @param startEnd Whether the user is starting (true) or ending (false) the realignment.
   */
  private setManualAlignment(startEnd: boolean) {
    // Only allow manual alignment changes when the module is enabled.
    if (this.active === false) return;

    if (startEnd === false && this.camera !== undefined) {
      this.realignAlpha = this.alpha;
      this.realignHeading = CesiumMath.toDegrees(this.camera.heading);
    }

    if (this.manualAlignment !== startEnd) {
      this.manualAlignment = startEnd;
      this.startEventLoop(!this.manualAlignment);
    }
  }

  /**
   * Resets the alignment so that the alignement matches the devices absolute alignment.
   */
  resetAlignment() {
    this.orientationUpdated = true;
    this.realignAlpha = 0;
    this.realignHeading = 0;
  }

  /**
   * Start or stop the Augmented Virutuality mode event loop. When enabled the
   * orientation will effect the cameras view and when disabled the device
   * orientation will not effect the cameras view.
   *
   * @param enable Whether to start the event loop (true) or stop the event loop (false).
   */
  private startEventLoop(enable: boolean) {
    if (this.isEventLoopRunning === enable) return;
    if (enable === true) {
      this.orientationUpdated = true;
      const intervalMs = 1000 / this.maximumUpdatesPerSecond;
      const id: any = setInterval(
        () => runInAction(() => this.updateOrientation()),
        intervalMs
      );
      if ("ondeviceorientation" in window) {
        window.addEventListener(
          "deviceorientation",
          this.boundStoreOrientation
        );
      }
      this.eventLoopState = { intervalId: id };
    } else {
      clearInterval(this.eventLoopState.intervalId);
      window.removeEventListener(
        "deviceorientation",
        this.boundStoreOrientation
      );
      this.eventLoopState = {};
    }
  }

  /**
   * Device orientation update event callback function. Stores the updated
   * orientation into the object state.
   *
   * @param  event Contains the updated device orientation (in .alpha, .beta, .gamma).
   */
  storeOrientation(event: DeviceOrientationEvent) {
    const { alpha, beta, gamma } = event;
    if (alpha !== null && beta !== null && gamma !== null) {
      this.alpha = alpha;
      this.beta = beta;
      this.gamma = gamma;
      this.orientationUpdated = true;
    }
  }

  /**
   * A bound version of `storeOrientation` that makes it easy to pass to
   * add/removeEventListener calls.
   */
  private boundStoreOrientation = this.storeOrientation.bind(this);

  /**
   * This function updates the cameras orientation using the last orientation
   * recorded and the current screen orientation.
   *
   */
  private updateOrientation() {
    // Check if the screen orientation has changed and mark the orientation updated if it has.
    const screenOrientation = getCurrentScreenOrientation();
    if (screenOrientation !== this.lastScreenOrientation)
      this.orientationUpdated = true;
    this.lastScreenOrientation = screenOrientation;

    // Optimize by only updating the camera view if some part of the
    // orientation calculation has changed.
    if (!this.orientationUpdated) {
      // The orientation has not been updated so don't waste time changing the
      // orientation.
      return;
    }
    this.orientationUpdated = false;

    // Get access to the camera...if it is not avaliable we can't set the orientation so just return now.
    if (this.camera) {
      this.camera.setView(this.getCurrentOrientation(screenOrientation));

      // Needed on mobile to make sure that the render is marked as dirty so that
      // once AV mode has been disabled for a while and then is reenabled the
      // .setView() function still has effect (otherwise dispite the call the
      // .setView() the view orientation does not visually update until the user
      // manualy moves the camera position).
      this.terria.currentViewer.notifyRepaintRequired();
    }
  }

  /**
   * Gets the current orientation stored in the object state and returns the
   * roll, pitch and heading which can be used to set the cameras orientation.
   *
   * @param screenOrientation The screen orientation in degrees. Note: This
   * field is optional, if supplied this value will be used for the screen
   * orientation, otherwise the screen orientation will be obtained during the
   * execution of this function.
   *
   * @return A object with the roll, pitch and heading stored into the orientation.
   */
  private getCurrentOrientation(screenOrientation?: number) {
    const alpha = this.alpha;
    const beta = this.beta;
    const gamma = this.gamma;

    const realignAlpha = this.realignAlpha;
    const realignHeading = this.realignHeading;

    if (screenOrientation === undefined)
      screenOrientation = getCurrentScreenOrientation();
    return computeTerriaOrientation(
      alpha,
      beta,
      gamma,
      screenOrientation,
      realignAlpha,
      realignHeading
    );
  }
}

function getCurrentScreenOrientation(): number {
  if (screen.orientation && screen.orientation.angle !== undefined)
    return screen.orientation.angle;

  if (window.orientation) {
    return Number(window.orientation);
  }

  return 0;
}

/**
 * Turns the orientation in the device frame of reference into an orientation
 * suitable for specifying the Terria camera orientation.
 *
 * @param alpha The alpha value of the device orientation in degrees (this is
 * the alpha value in the device's frame of reference).
 *
 * @param beta The beta value of the device orientation in degrees (this is the
 * beta value in the device's frame of reference).
 *
 * @param gamma The gamma value of the device orientation in degrees (this is
 * the gamma value in the device's frame of reference).
 *
 * @param screenOrientation The screen orientation in degrees.
 *
 * @param realignAlpha The value of the alpha value the last time realignment
 * was completed (supply zero if realignment is not supported).
 *
 * @param realignHeading The value of the heading value the last time
 * realignment was completed (supply zero if realignment is not supported).
 *
 * @return An object with the roll, pitch and heading stored into the orientation.
 */
function computeTerriaOrientation(
  alpha: number,
  beta: number,
  gamma: number,
  screenOrientation: number,
  realignAlpha: number,
  realignHeading: number
): TerriaOrientation {
  // Note: The algorithmic formulation in this function is for simplicity of
  //       mathematical expression, readability, maintainability and
  //       modification (i.e. it is easy to understand how to update or insert
  //       new offsets or features).  This is not the simplest form which
  //       clearly flows from the current formuleation and clearly simplify the
  //       logic and operations but would increase the cost of future
  //       modifications and reduce the readability of the expression. It is
  //       not anticipated that the current verbose implementation would have a
  //       significant impact on performance or accuracy, but obviously there
  //       will be some impact on both and it can be simplified in future if
  //       needed.

  const rotation = CesiumMatrix3.clone(CesiumMatrix3.IDENTITY);
  let rotationIncrement;

  // Roll - Counteract the change in the (orientation) frame of reference when
  //        the screen is rotated and the rotation lock is not on (the browser
  //        reorients the frame of reference to align with the new screen
  //        orientation - where as we want it of the device relative to the
  //        world).
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

  // Heading - Use the offset when the orientation was last started.  Note:
  //           This is logically different from the alpha value and can only be
  //           applied here in the same way since Cesium camera is RPH (Heading
  //           last - most local). See Cesium camera rotation decomposition for
  //           more information on the Cesium camera formuleation.
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

  const getColumn = (mat: CesiumMatrix3, col: number): number => {
    return (<any>mat)[col];
  };

  // Simplify notation for readability:
  const r10: number = getColumn(rotation, CesiumMatrix3.COLUMN1ROW0);
  const r11: number = getColumn(rotation, CesiumMatrix3.COLUMN1ROW1);
  const r02: number = getColumn(rotation, CesiumMatrix3.COLUMN0ROW2);
  const r12: number = getColumn(rotation, CesiumMatrix3.COLUMN1ROW2);
  const r22: number = getColumn(rotation, CesiumMatrix3.COLUMN2ROW2);

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
}
