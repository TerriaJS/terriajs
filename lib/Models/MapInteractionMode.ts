import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import PickedFeatures from "../Map/PickedFeatures";
import { observable } from "mobx";

interface Options {
  onCancel: () => void;
  message: string;
  customUi?: () => unknown;
  buttonText?: string;
  drawRectangle?: boolean;
}

/**
 * A mode for interacting with the map.
 */
export default class MapInteractionMode {
  readonly onCancel: () => void;

  readonly buttonText: string;
  readonly drawRectangle: boolean;

  @observable
  customUi: (() => unknown) | undefined;

  @observable
  message: () => string;

  @observable
  pickedFeatures?: PickedFeatures;

  constructor(options: Options) {
    /**
     * Gets or sets a callback that is invoked when the user cancels the interaction mode.  If this property is undefined,
     * the interaction mode cannot be canceled.
     */
    this.onCancel = options.onCancel;

    /**
     * Gets or sets the details of a custom user interface for this map interaction mode. This property is not used by
     * the `MapInteractionMode` itself, so it can be anything that is suitable for the user interface. In the standard
     * React-based user interface included with TerriaJS, this property is a function that is called with no parameters
     * and is expected to return a React component.
     */
    this.customUi = options.customUi;

    /**
     * Gets or sets the html formatted message displayed on the map when in this mode.
     */
    this.message = function() {
      return options.message;
    };

    /**
     * Set the text of the button for the dialog the message is displayed on.
     */
    this.buttonText = defaultValue(options.buttonText, "Cancel");

    /**
     * Gets or sets the features that are currently picked.
     */
    this.pickedFeatures = undefined;

    /**
     * Determines whether a rectangle will be requested from the user rather than a set of pickedFeatures.
     */
    this.drawRectangle = defaultValue(options.drawRectangle, false);
  }
}
