import {
  IReactionDisposer,
  action,
  computed,
  makeObservable,
  observable,
  reaction
} from "mobx";
import ContextLimits from "terriajs-cesium/Source/Renderer/ContextLimits";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import Icon from "../../../Styled/Icon";
import Cesium from "../../Cesium";
import { CesiumOptionsSchema } from "../../CesiumOptions";
import {
  SelectableDimensionButton,
  SelectableDimensionCheckbox,
  SelectableDimensionCheckboxGroup,
  SelectableDimensionGroup,
  SelectableDimensionNumericRange
} from "../../SelectableDimensions/SelectableDimensions";
import Terria from "../../Terria";
import AppWorkflow, { closeAppWorkflow } from "./AppWorkflow";

const fpsDisplayCss = `
.cesium-performanceDisplay-defaultContainer {
  position: absolute;
  top: 10px;
  left: 50%;
  border-radius: 5px;
  border: 1px solid #444;
  font: bold 20px sans-serif;
  padding: 7px;
  background: rgba(40, 40, 40, 0.7);
}

.cesium-performanceDisplay-ms { color: #de3; }
.cesium-performanceDisplay-fps { color: white; }
.cesium-performanceDisplay-throttled {color: #a42; }
`;

export default class CesiumSettingsWorkflow implements AppWorkflow {
  private readonly cesium: Cesium;

  // Copy of initial options to track and reset changes
  @observable
  private initialOptions: CesiumOptionsSchema;

  // Reactive copy of cesium options and view changes
  @observable
  private viewModel: CesiumOptionsSchema;

  // True if custom options exist in localStorage
  @observable
  private hasSavedChanges: boolean;

  private cesiumReactionDisposer: IReactionDisposer;

  private fpsDisplayStyle: HTMLStyleElement;

  constructor(terria: Terria, cesium: Cesium) {
    this.cesium = cesium;
    this.initialOptions = cesium.options.toJson();
    this.viewModel = cesium.options.toJson();
    this.hasSavedChanges = this.cesium.options.hasSavedPreferences;

    this.fpsDisplayStyle = document.createElement("style");
    this.fpsDisplayStyle.textContent = fpsDisplayCss;
    if (window) {
      window.document.body.appendChild(this.fpsDisplayStyle);
    }

    this.cesium.scene.debugShowFramesPerSecond = true;

    // Self-close workflow if cesium instance has changed so that we don't keep
    // reference to the instance
    this.cesiumReactionDisposer = reaction(
      () => terria.cesium !== cesium,
      (instanceChanged) => {
        if (instanceChanged) {
          closeAppWorkflow(terria, this);
        }
      }
    );

    makeObservable(this);
  }

  get name() {
    return "3D Graphics Settings";
  }

  get icon() {
    return Icon.GLYPHS.settings;
  }

  onClose() {
    if (!this.cesium.cesiumWidget.isDestroyed()) {
      this.discardUnsavedChanges();
    }
    this.cesium.scene.debugShowFramesPerSecond = false;
    this.fpsDisplayStyle.remove();
    this.cesiumReactionDisposer();
  }

  /**
   * Returns current value for the option as per the view
   */
  private getOption<K extends keyof CesiumOptionsSchema>(name: K) {
    return this.viewModel[name];
  }

  /**
   * Set a new value for the option
   */
  @action
  private setOption<K extends keyof CesiumOptionsSchema>(
    name: K,
    value: CesiumOptionsSchema[K] | undefined
  ) {
    (this.cesium.options as CesiumOptionsSchema)[name] =
      value ?? this.initialOptions[name];
    this.viewModel[name] = this.cesium.options[name];
    this.cesium.notifyRepaintRequired();
  }

  /**
   * Returns true if there are view local changes that will be discarded when the workflow is closed
   */
  @computed
  private get hasUnsavedChanges() {
    const diff = Object.entries(this.viewModel).filter(
      ([name, value]) => (this.initialOptions as any)[name] !== value
    );
    return diff.length > 0;
  }

  /**
   * Write options and update state
   */
  private writeOptions(options: CesiumOptionsSchema) {
    this.cesium.options.updateFromJson(options);
    this.cesium.options.saveUserPreferences();
    this.initialOptions = this.cesium.options.toJson();
    this.viewModel = this.cesium.options.toJson();
    this.hasSavedChanges = this.cesium.options.hasSavedPreferences;
    this.cesium.notifyRepaintRequired();
  }

  /**
   * Discard view local changes
   */
  @action
  private discardUnsavedChanges() {
    this.writeOptions(this.initialOptions);
  }

  /**
   * Save view local changes
   */
  @action
  private saveChanges() {
    this.writeOptions(this.viewModel);
  }

  /**
   * Discard all customizations user has made
   */
  @action
  private resetToAppDefaults() {
    this.writeOptions(this.cesium.options.defaultOptions);
  }

  @computed
  get inputs() {
    return filterOutUndefined([this.qualityAndPerformance, this.effects]);
  }

  @computed
  get footer() {
    return [this.saveChangesButton, this.resetToAppDefaultsButton];
  }

  @computed
  get saveChangesButton(): SelectableDimensionButton {
    return {
      id: "save-changes",
      type: "button",
      value: `Save changes`,
      disable: !this.hasUnsavedChanges,
      variant: "primary",
      setDimensionValue: () => {
        this.saveChanges();
      }
    };
  }

  @computed
  get resetToAppDefaultsButton(): SelectableDimensionButton {
    return {
      id: "reset-to-app-defaults",
      type: "button",
      value: `Reset to app defaults`,
      disable: !this.hasSavedChanges,
      setDimensionValue: () => {
        this.resetToAppDefaults();
      }
    };
  }

  @computed
  get qualityAndPerformance(): SelectableDimensionGroup {
    return {
      id: "quality-and-performance",
      name: "Quality and Performance",
      type: "group",
      selectableDimensions: filterOutUndefined([
        this.targetFrameRate,
        this.resolutionScale,
        this.baseMaximumScreenSpaceError,
        this.fxaa,
        this.msaaSamples
      ])
    };
  }

  @computed
  get effects(): SelectableDimensionGroup {
    return {
      id: "effects",
      name: "Effects",
      type: "group",
      selectableDimensions: filterOutUndefined([
        this.highDynamicRange,
        this.bloom
      ])
    };
  }

  @computed
  get targetFrameRate(): SelectableDimensionNumericRange {
    // Here we map value above 60 to "any"
    const self = this;
    const name = `Target frame rate (${this.getOption("targetFrameRate")})`;
    const targetFrameRate = self.getOption("targetFrameRate");
    const value = targetFrameRate === "any" ? 70 : targetFrameRate;
    return {
      id: "target-frame-rate",
      type: "numeric-range",
      name,
      value,
      min: 0,
      max: 70,
      step: 1,
      marks: Object.fromEntries([
        [value, value?.toString()],
        ...[0, 10, 20, 30, 40, 50, 60, 70].map((fps) => [
          fps,
          fps > 60 ? "Any" : fps.toString()
        ])
      ]),
      setDimensionValue: (_, value) => {
        this.setOption(
          "targetFrameRate",
          value === undefined ? "any" : value > 60 ? "any" : value
        );
      }
    };
  }

  @computed
  get resolutionScale(): SelectableDimensionNumericRange {
    const value = this.getOption("resolutionScale");
    const name = `Resolution (${this.getOption("resolutionScale")}x)`;
    const native = window.devicePixelRatio;
    const max = Math.max(2, native);
    return {
      id: "resolution-scale",
      type: "numeric-range",
      name,
      value,
      description: "Lower resolution looks grainier but improves performance",
      min: 0.1,
      max,
      step: 0.1,
      marks: {
        [value]: `${value}x`,
        0.1: "0.1x",
        1: "1x",
        2: "2x",
        [native]: `${native}x`
      },
      setDimensionValue: (_, value) => {
        this.setOption("resolutionScale", value);
      }
    };
  }

  @computed
  get baseMaximumScreenSpaceError(): SelectableDimensionNumericRange {
    const value = this.cesium.terria.baseMaximumScreenSpaceError;
    const name = `Base Maximum SSE`;
    return {
      id: "bmsse",
      type: "numeric-range",
      name,
      value,
      description:
        "The base maximum screen space error determines the level-of-detail that is rendered. Higher values tolerate more error, decreasing visual quality but improving performance.",
      min: 1,
      max: 3,
      step: 0.1,
      marks: {
        [value]: value.toString(),
        1: "Quality",
        2: "Balanced",
        3: "Performance"
      },
      setDimensionValue: (_, bmsse) => {
        if (typeof bmsse === "number" && bmsse >= 1 && bmsse <= 3) {
          this.cesium.terria.baseMaximumScreenSpaceError = bmsse;
          // FIXME: save only when user asks to save
          this.cesium.terria.setLocalProperty(
            "baseMaximumScreenSpaceError",
            bmsse.toString()
          );
          this.cesium.notifyRepaintRequired();
        }
      }
    };
  }

  @computed
  get highDynamicRange(): SelectableDimensionCheckbox | undefined {
    if (!this.cesium.scene.highDynamicRangeSupported) {
      return;
    }

    const label = "Enable HDR rendering";
    return {
      id: "high-dynamic-range",
      name: "High dynamic range (HDR)",
      type: "checkbox",
      selectedId: this.getOption("highDynamicRange") ? "true" : "false",
      options: [
        { id: "true", name: label },
        { id: "false", name: label }
      ],
      setDimensionValue: (_, value) => {
        this.setOption("highDynamicRange", value === "true" ? true : false);
      }
    };
  }

  @computed
  get fxaa(): SelectableDimensionCheckbox {
    const label = "Enabled";
    return {
      id: "fxaa",
      name: "FXAA - fast smooth edges",
      type: "checkbox",
      selectedId: this.getOption("fxaa") ? "true" : "false",
      options: [
        { id: "true", name: label },
        { id: "false", name: label }
      ],
      setDimensionValue: (_, value) => {
        this.setOption("fxaa", value === "true" ? true : false);
      }
    };
  }

  @computed
  private get msaaSamples(): SelectableDimensionNumericRange | undefined {
    const maximumSamples = ContextLimits.maximumSamples;
    if (maximumSamples === 0 || !this.cesium.scene.msaaSupported) {
      // Multi-sampling not supported
      return;
    }

    const value = this.getOption("msaaSamples");
    return {
      id: "msaa-samples",
      name: `MSAA Samples (${value})`,
      description:
        "Higher values improves edge smoothness but can greatly reduce performance",
      type: "numeric-range",
      value,
      min: 1,
      max: maximumSamples,
      step: 1,
      marks: Object.fromEntries(
        [...new Array(maximumSamples)].map((_, i) => [
          i + 1,
          (i + 1).toString()
        ])
      ),
      setDimensionValue: (_, value) => {
        this.setOption("msaaSamples", value);
      }
    };
  }

  @computed
  get bloom(): SelectableDimensionCheckboxGroup {
    const label = "Enable glow";
    return {
      id: "bloom",
      name: "Glow",
      type: "checkbox-group",
      selectedId: this.getOption("bloom") ? "true" : "false",
      options: [
        { id: "true", name: label },
        { id: "false", name: label }
      ],
      setDimensionValue: (_, value) => {
        const enabled = value === "true";
        this.setOption("bloom", enabled);
        if (!enabled) {
          this.setOption("bloomBrightness", undefined);
          this.setOption("bloomContrast", undefined);
        }
      },
      selectableDimensions: [
        {
          id: "brightness",
          name: "Brightness",
          type: "numeric-range",
          min: -1,
          max: 1,
          step: 0.1,
          value: this.getOption("bloomBrightness"),
          marks: {
            "-1": "-1",
            0: "0",
            1: "1"
          },
          setDimensionValue: (_, value) => {
            this.setOption("bloomBrightness", value);
          }
        },
        {
          id: "contrast",
          name: "Contrast",
          type: "numeric-range",
          min: -255,
          max: 255,
          step: 1,
          value: this.getOption("bloomContrast"),
          marks: {
            "-255": "-255",
            0: "0",
            255: "255"
          },
          setDimensionValue: (_, value) => {
            this.setOption("bloomContrast", value);
          }
        }
      ]
    };
  }
}
