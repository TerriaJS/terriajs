import * as z from "zod";
import Cesium from "./Cesium";

const CESIUM_OPTIONS_KEY = "cesiumOptions";

export interface CesiumOptionsSchema {
  msaaSamples: number;
  resolutionScale: number;
  highDynamicRange: boolean;
  fxaa: boolean;
  enableCollisionDetection: boolean;
  targetFrameRate?: number | "any";
  bloom: boolean;
  bloomBrightness: number;
  bloomContrast: number;
}

export const CesiumOptionsSchema = z.object({
  msaaSamples: z.number(),
  resolutionScale: z.number(),
  highDynamicRange: z.boolean(),
  fxaa: z.boolean(),
  enableCollisionDetection: z.boolean(),
  targetFrameRate: z.union([z.number(), z.string("any")]).optional(),
  bloom: z.boolean(),
  bloomBrightness: z.number(),
  bloomContrast: z.number()
});

/**
 * Manage Cesium options
 */
export default class CesiumOptions implements CesiumOptionsSchema {
  private readonly cesium: Cesium;
  readonly defaultOptions: CesiumOptionsSchema;

  constructor(cesium: Cesium, initialOptions: Partial<CesiumOptionsSchema>) {
    this.cesium = cesium;
    this.updateFromJson(initialOptions);

    // Save snapshot of initial state so that we can diff and reset changes
    this.defaultOptions = this.toJson();
  }

  /**
   * Reset all options to terria/cesium defaults
   */
  resetAll() {
    this.updateFromJson(this.defaultOptions);
  }

  /**
   * Reset specified option to terria/cesium default
   */
  resetOption<K extends keyof CesiumOptionsSchema>(name: K) {
    (this as CesiumOptionsSchema)[name] = this.defaultOptions[name];
  }

  /**
   * Return snapshot of all options as JSON object
   */
  toJson(): CesiumOptionsSchema {
    return Object.fromEntries(
      Object.keys(CesiumOptionsSchema.shape).map((name) => [
        name,
        (this as any)[name]
      ])
    ) as any;
  }

  /**
   * Update options from JSON
   */
  updateFromJson(json: any) {
    const parsed = CesiumOptionsSchema.partial().parse(json);
    (Object.keys(parsed) as Array<keyof CesiumOptionsSchema>).forEach(
      (name) => {
        (this as any)[name] = parsed[name];
      }
    );
  }

  /**
   * Return locally stored options
   */
  getUserPreferences() {
    const str = this.cesium.terria.getLocalProperty(CESIUM_OPTIONS_KEY);
    try {
      const localChanges = typeof str === "string" ? JSON.parse(str) : {};
      return CesiumOptionsSchema.partial().parse(localChanges);
    } catch (error) {
      console.error("Ignoring invalid cesium options from local storage");
      console.error(error);
      return {};
    }
  }

  /**
   * Load user preferences
   */
  loadUserPreferences(): any {
    this.updateFromJson(this.getUserPreferences());
  }

  /**
   * Save user preferences
   */
  saveUserPreferences() {
    const currentOptions = this.toJson();
    // Save only those options that differ from default options
    const onlyChangedOptions = Object.fromEntries(
      Object.entries(currentOptions).filter(
        ([name, value]) => (this.defaultOptions as any)[name] !== value
      )
    );
    // TODO: remove item if empty instead of setting to empty object {}
    this.cesium.terria.setLocalProperty(
      CESIUM_OPTIONS_KEY,
      JSON.stringify(onlyChangedOptions)
    );
  }

  /**
   * Returns true if user has any stored preferences
   */
  get hasSavedPreferences() {
    return Object.keys(this.getUserPreferences()).length > 0;
  }

  get msaaSamples() {
    return this.cesium.scene.msaaSamples;
  }

  set msaaSamples(value: number) {
    this.cesium.scene.msaaSamples = value;
  }

  get resolutionScale(): number {
    return this.cesium.cesiumWidget.resolutionScale;
  }

  set resolutionScale(value: number) {
    this.cesium.cesiumWidget.resolutionScale = value;
  }

  get highDynamicRange(): boolean {
    return this.cesium.scene.highDynamicRange;
  }

  set highDynamicRange(value: boolean) {
    this.cesium.scene.highDynamicRange = value;
  }

  get fxaa(): boolean {
    return this.cesium.scene.postProcessStages.fxaa.enabled;
  }

  set fxaa(value: boolean) {
    this.cesium.scene.postProcessStages.fxaa.enabled = value;
  }

  get enableCollisionDetection(): boolean {
    return this.cesium.scene.screenSpaceCameraController
      .enableCollisionDetection;
  }

  set enableCollisionDetection(value: boolean) {
    this.cesium.scene.screenSpaceCameraController.enableCollisionDetection =
      value;
  }

  get targetFrameRate(): number | "any" {
    return this.cesium.cesiumWidget.targetFrameRate ?? "any";
  }

  set targetFrameRate(value: number | "any") {
    //@ts-expect-error 2322 - Cesium typings does not allow setting
    //targetFrameRate=undefined but it is still valid as per doc
    this.cesium.cesiumWidget.targetFrameRate =
      value === "any" ? undefined : value;
  }

  get bloom(): boolean {
    return this.cesium.scene.postProcessStages.bloom.enabled;
  }

  set bloom(value: boolean) {
    this.cesium.scene.postProcessStages.bloom.enabled = value;
  }

  get bloomBrightness(): number {
    return this.cesium.scene.postProcessStages.bloom.uniforms.brightness;
  }

  set bloomBrightness(value: number) {
    this.cesium.scene.postProcessStages.bloom.uniforms.brightness = value;
  }

  get bloomContrast(): number {
    return this.cesium.scene.postProcessStages.bloom.uniforms.contrast;
  }

  set bloomContrast(value: number) {
    this.cesium.scene.postProcessStages.bloom.uniforms.contrast = value;
  }
}
