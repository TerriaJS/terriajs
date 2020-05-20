import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import classNames from "classnames";
import ObserveModelMixin from "../ObserveModelMixin";
import Styles from "./terrain-settings.scss";
import { withTranslation } from "react-i18next";
import Slider from "rc-slider";
import Icon from "../Icon.jsx";

var Material = require("terriajs-cesium/Source/Scene/Material").default;
var Color = require("terriajs-cesium/Source/Core/Color").default;
var Clock = require("terriajs-cesium/Source/Core/Clock").default;
var JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;
var CesiumTerrainProvider = require("terriajs-cesium/Source/Core/CesiumTerrainProvider")
  .default;
var IonResource = require("terriajs-cesium/Source/Core/IonResource").default;

const TerrainSettingsPanel = createReactClass({
  displayName: "TerrainSettings",
  mixins: [ObserveModelMixin],
  propTypes: {
    terria: PropTypes.object.isRequired,
    isVisible: PropTypes.bool,
    viewState: PropTypes.object.isRequired,
    animationDuration: PropTypes.number,
    t: PropTypes.func.isRequired
  },

  getColorRamp(selectedShading) {
    const elevationRamp = [0.0, 0.045, 0.1, 0.15, 0.37, 0.54, 1.0];
    const slopeRamp = [0.0, 0.29, 0.5, Math.sqrt(2) / 2, 0.87, 0.91, 1.0];
    const aspectRamp = [0.0, 0.2, 0.4, 0.6, 0.8, 0.9, 1.0];
    const hillshadeRamp = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
    let ramp = document.createElement("canvas");
    ramp.width = 100;
    ramp.height = 1;
    let ctx = ramp.getContext("2d");

    let values;
    if (selectedShading === "elevation") {
      values = elevationRamp;
    } else if (selectedShading === "slope") {
      values = slopeRamp;
    } else if (selectedShading === "aspect") {
      values = aspectRamp;
    } else if (selectedShading === "hillshade") {
      values = hillshadeRamp;
    }

    let grd = ctx.createLinearGradient(0, 0, 100, 0);
    grd.addColorStop(values[0], "#000000"); //black
    grd.addColorStop(values[1], "#2747E0"); //blue
    grd.addColorStop(values[2], "#D33B7D"); //pink
    grd.addColorStop(values[3], "#D33038"); //red
    grd.addColorStop(values[4], "#FF9742"); //orange
    grd.addColorStop(values[5], "#ffd700"); //yellow
    grd.addColorStop(values[6], "#ffffff"); //white

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 100, 1);

    return ramp;
  },

  getSlopeContourMaterial() {
    // Creates a composite material with both slope shading and contour lines
    return new Material({
      fabric: {
        type: "SlopeColorContour",
        materials: {
          contourMaterial: {
            type: "ElevationContour"
          },
          slopeRampMaterial: {
            type: "SlopeRamp"
          }
        },
        components: {
          diffuse:
            "contourMaterial.alpha == 0.0 ? slopeRampMaterial.diffuse : contourMaterial.diffuse",
          alpha: "max(contourMaterial.alpha, slopeRampMaterial.alpha)"
        }
      },
      translucent: false
    });
  },

  getAspectContourMaterial() {
    // Creates a composite material with both aspect shading and contour lines
    return new Material({
      fabric: {
        type: "AspectColorContour",
        materials: {
          contourMaterial: {
            type: "ElevationContour"
          },
          aspectRampMaterial: {
            type: "AspectRamp"
          }
        },
        components: {
          diffuse:
            "contourMaterial.alpha == 0.0 ? aspectRampMaterial.diffuse : contourMaterial.diffuse",
          alpha: "max(contourMaterial.alpha, aspectRampMaterial.alpha)"
        }
      },
      translucent: false
    });
  },

  getElevationContourMaterial() {
    // Creates a composite material with both elevation shading and contour lines
    return new Material({
      fabric: {
        type: "ElevationColorContour",
        materials: {
          contourMaterial: {
            type: "ElevationContour"
          },
          elevationRampMaterial: {
            type: "ElevationRamp"
          }
        },
        components: {
          diffuse:
            "contourMaterial.alpha == 0.0 ? elevationRampMaterial.diffuse : contourMaterial.diffuse",
          alpha: "max(contourMaterial.alpha, elevationRampMaterial.alpha)"
        }
      },
      translucent: false
    });
  },

  updateMaterial() {
    let globe = this.props.terria.cesium.viewer.scene.globe;
    this.props.terria.cesium.viewer.terrainProvider.hasVertexNormals;

    // TerrainProvider requestVertexNormals is needed to visualize slope.
    // To activate requestVertexNormals we need to define a new terrainProvider
    // using the existing terrain asset.
    if (
      !this.props.terria.cesium.viewer.scene.terrainProvider
        .requestVertexNormals
    ) {
      let url = this.props.terria.cesium.viewer.scene.terrainProvider._layers[0]
        .resource._url;
      const substring = "assets.cesium";
      if (url.includes(substring)) {
        url = url.match(/\d+/)[0];
        url = IonResource.fromAssetId(url);
      }
      this.props.terria.cesium.viewer.terrainProvider = new CesiumTerrainProvider(
        {
          url: url,
          requestVertexNormals: true
        }
      );
    }

    globe.enableLighting = true;

    let selectedShading = this.props.viewState.terrainMaterialSelection;
    let contourColor = Color.RED.clone();
    this.selectedShading = "elevation";
    this.changeColor = function() {
      this.props.viewState.contourUniforms.color = Cesium.Color.fromRandom(
        { alpha: 1.0 },
        contourColor
      );
    };

    let material;

    if (this.props.viewState.enableContour) {
      if (selectedShading === "elevation") {
        material = this.getElevationContourMaterial();
        this.props.viewState.shadingUniforms =
          material.materials.elevationRampMaterial.uniforms;
        this.props.viewState.shadingUniforms.minimumHeight = this.props.viewState.elevationColorRampRang[0];
        this.props.viewState.shadingUniforms.maximumHeight = this.props.viewState.elevationColorRampRang[1];
        this.props.viewState.contourUniforms =
          material.materials.contourMaterial.uniforms;
      } else if (selectedShading === "slope") {
        material = this.getSlopeContourMaterial();
        this.props.viewState.shadingUniforms =
          material.materials.slopeRampMaterial.uniforms;
        this.props.viewState.contourUniforms =
          material.materials.contourMaterial.uniforms;
      } else if (selectedShading === "aspect") {
        material = this.getAspectContourMaterial();
        this.props.viewState.shadingUniforms =
          material.materials.aspectRampMaterial.uniforms;
        this.props.viewState.contourUniforms =
          material.materials.contourMaterial.uniforms;
      } else if (selectedShading === "hillshade") {
        material = this.getAspectContourMaterial();
        this.props.viewState.shadingUniforms =
          material.materials.aspectRampMaterial.uniforms;
        this.props.viewState.contourUniforms =
          material.materials.contourMaterial.uniforms;
      } else {
        material = Material.fromType("ElevationContour");
        this.props.viewState.contourUniforms = material.uniforms;
      }
      this.props.viewState.contourUniforms.width = this.props.viewState.contourWidth;
      this.props.viewState.contourUniforms.spacing = this.props.viewState.contourSpacing;
      this.props.viewState.contourUniforms.color = contourColor;
    } else if (selectedShading === "elevation") {
      material = Material.fromType("ElevationRamp");
      this.props.viewState.shadingUniforms = material.uniforms;
      this.props.viewState.shadingUniforms.minimumHeight = this.props.viewState.elevationColorRampRang[0];
      this.props.viewState.shadingUniforms.maximumHeight = this.props.viewState.elevationColorRampRang[1];
    } else if (selectedShading === "slope") {
      material = Material.fromType("SlopeRamp");
      this.props.viewState.shadingUniforms = material.uniforms;
    } else if (selectedShading === "aspect") {
      material = Material.fromType("AspectRamp");
      this.props.viewState.shadingUniforms = material.uniforms;
    } else if (selectedShading === "hillshade") {
      material = Material.fromType("ElevationRamp");
      this.props.viewState.shadingUniforms = material.uniforms;
    }
    if (selectedShading !== "none") {
      this.props.viewState.shadingUniforms.image = this.getColorRamp(
        selectedShading
      );
    }
    globe.material = material;
  },

  onChangeTerrainMaterial(e) {
    viewState.terrainMaterialSelection = e.target.value;
    this.updateMaterial();
  },

  onChangeContourSpacing(value) {
    this.props.viewState.contourSpacing = value;
    this.props.viewState.contourUniforms.spacing = value;
  },

  onChangeContourWidth(value) {
    this.props.viewState.contourWidth = value;
    this.props.viewState.contourUniforms.width = value;
  },

  enableContourCheckBox() {
    if (this.props.viewState.enableContour) {
      this.props.viewState.enableContour = false;
    } else {
      this.props.viewState.enableContour = true;
    }
    this.updateMaterial();
  },

  onChangeElevationRampRange(values) {
    this.props.viewState.elevationColorRampRang = values;
    this.props.viewState.shadingUniforms.minimumHeight = values[0];
    this.props.viewState.shadingUniforms.maximumHeight = values[1];
  },

  onChangeClock(value) {
    this.props.viewState.time = value;
    const currentTime = JulianDate.fromDate(new Date());
    let timeOffset = JulianDate.addSeconds(
      currentTime,
      value * 60 * 60,
      new JulianDate()
    );
    this.props.terria.cesium.viewer.clock.currentTime = timeOffset;
  },

  formatDate() {
    const currentDate = new Date();
    let newDate = currentDate.setHours(
      currentDate.getHours() + this.props.viewState.time
    );
    return new Date(newDate).getHours() + ":" + new Date(newDate).getMinutes();
  },

  handleCloseTerrainSettings() {
    this.props.viewState.terrainSettingShown = false;
  },

  render() {
    const { t } = this.props;
    const className = classNames({
      [Styles.terrainPanel]: true,
      [Styles.terrainIsVisible]: this.props.isVisible,
      [Styles.terrainIsHidden]: !this.props.isVisible
    });
    return (
      <>
        <div className={className}>
          <button
            type="button"
            className={classNames(Styles.innerCloseBtn)}
            onClick={this.handleCloseTerrainSettings}
            title={t("general.close")}
            aria-label={t("general.close")}
          >
            <Icon glyph={Icon.GLYPHS.close} />
          </button>
          <div className={Styles.header}>
            <div className={Styles.actions}>
              <h3>{t("settingPanel.terrainSettings")}</h3>
            </div>
          </div>

          <div className="container">
            <div className={Styles.terrainSettings}>
              <div>
                <form>
                  <div className={Styles.radio}>
                    <label>
                      <input
                        type="radio"
                        value="none"
                        checked={
                          this.props.viewState.terrainMaterialSelection ===
                          "none"
                        }
                        onChange={this.onChangeTerrainMaterial}
                      />
                      {t("terrainSettingsPanel.noShading")}
                    </label>
                  </div>
                  <div className={Styles.radio}>
                    <label>
                      <input
                        type="radio"
                        value="elevation"
                        checked={
                          this.props.viewState.terrainMaterialSelection ===
                          "elevation"
                        }
                        onChange={this.onChangeTerrainMaterial}
                      />
                      {t("terrainSettingsPanel.elevation")}
                    </label>
                  </div>
                  <div className={Styles.radio}>
                    <label>
                      <input
                        type="radio"
                        value="slope"
                        checked={
                          this.props.viewState.terrainMaterialSelection ===
                          "slope"
                        }
                        onChange={this.onChangeTerrainMaterial}
                      />
                      {t("terrainSettingsPanel.slope")}
                    </label>
                  </div>
                  <div className={Styles.radio}>
                    <label>
                      <input
                        type="radio"
                        value="aspect"
                        checked={
                          this.props.viewState.terrainMaterialSelection ===
                          "aspect"
                        }
                        onChange={this.onChangeTerrainMaterial}
                      />
                      {t("terrainSettingsPanel.aspect")}
                    </label>
                  </div>
                  <div className={Styles.radio}>
                    <label>
                      <input
                        type="radio"
                        value="hillshade"
                        checked={
                          this.props.viewState.terrainMaterialSelection ===
                          "hillshade"
                        }
                        onChange={this.onChangeTerrainMaterial}
                      />
                      {t("terrainSettingsPanel.hillshade")}
                    </label>
                  </div>
                </form>
              </div>

              {this.props.viewState.terrainMaterialSelection ===
                "elevation" && (
                <div>
                  {t("terrainSettingsPanel.elevationColorRampRange")}
                  <Slider.Range
                    min={-414}
                    max={8777}
                    step={1}
                    allowCross={false}
                    defaultValue={[-414, 8777]}
                    onChange={this.onChangeElevationRampRange}
                  />
                </div>
              )}

              {(this.props.viewState.terrainMaterialSelection === "elevation" ||
                this.props.viewState.terrainMaterialSelection ===
                  "hillshade") && (
                <div>
                  {t("terrainSettingsPanel.timeOfDay") +
                    ": " +
                    this.formatDate()}
                  <Slider
                    min={1}
                    max={24}
                    step={1}
                    onChange={this.onChangeClock}
                  />
                </div>
              )}

              <hr className={Styles.topMargin} />

              <div>
                <div className={Styles.topMargin}>
                  <label>
                    <input
                      type="checkbox"
                      checked={this.props.viewState.enableContour}
                      onChange={this.enableContourCheckBox}
                    />
                    {t("terrainSettingsPanel.enableContourLines")}
                  </label>
                </div>
                <div>
                  {t("terrainSettingsPanel.spacing")}{" "}
                  {": " + this.props.viewState.contourSpacing}
                  <Slider
                    id="terrainSettingsSpacingSlider"
                    min={1}
                    max={500}
                    step={1}
                    value={this.props.viewState.contourSpacing}
                    onChange={this.onChangeContourSpacing}
                  />
                </div>
                <div>
                  {t("terrainSettingsPanel.width")}{" "}
                  {": " + this.props.viewState.contourWidth}
                  <Slider
                    id="terrainSettingsSpacingSlider"
                    min={1}
                    max={10}
                    step={1}
                    value={this.props.viewState.contourWidth}
                    onChange={this.onChangeContourWidth}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
});

// export default TerrainSettingsPanel;
export default withTranslation()(TerrainSettingsPanel);
