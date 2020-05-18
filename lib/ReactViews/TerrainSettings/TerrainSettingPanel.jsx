import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import classNames from "classnames";
import ObserveModelMixin from "../ObserveModelMixin";
import Styles from "./terrain-settings.scss";
import { withTranslation } from "react-i18next";

var Material = require("terriajs-cesium/Source/Scene/Material").default;
var Color = require("terriajs-cesium/Source/Core/Color").default;
var createWorldTerrain = require("terriajs-cesium/Source/Core/createWorldTerrain")
  .default;
var CesiumTerrainProvider = require("terriajs-cesium/Source/Core/CesiumTerrainProvider")
  .default;
var IonResource = require("terriajs-cesium/Source/Core/IonResource").default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;

var viewModel = {
  enableContour: false,
  contourSpacing: 150.0,
  contourWidth: 2.0,
  selectedShading: "elevation",
  changeColor: function() {
    contourUniforms.color = Cesium.Color.fromRandom(
      { alpha: 1.0 },
      contourColor
    );
  }
};

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
    var elevationRamp = [0.0, 0.045, 0.1, 0.15, 0.37, 0.54, 1.0];
    var slopeRamp = [0.0, 0.29, 0.5, Math.sqrt(2) / 2, 0.87, 0.91, 1.0];
    var aspectRamp = [0.0, 0.2, 0.4, 0.6, 0.8, 0.9, 1.0];
    var ramp = document.createElement("canvas");
    ramp.width = 100;
    ramp.height = 1;
    var ctx = ramp.getContext("2d");

    var values;
    if (selectedShading === "elevation") {
      values = elevationRamp;
    } else if (selectedShading === "slope") {
      values = slopeRamp;
    } else if (selectedShading === "aspect") {
      values = aspectRamp;
    }

    var grd = ctx.createLinearGradient(0, 0, 100, 0);
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
    this.props.terria.cesium.viewer.terrainProvider = new CesiumTerrainProvider(
      {
        url: IonResource.fromAssetId(1),
        requestVertexNormals: true
      }
    );
    globe.enableLighting = true;

    var selectedShading = this.props.viewState.terrainMaterialSelection;
    let hasContour = false;
    var minHeight = -414.0; // approximate dead sea elevation
    var maxHeight = 8777.0; // approximate everest elevation
    var contourColor = Color.RED.clone();
    var contourUniforms = {};
    var shadingUniforms = {};

    this.enableContour = false;
    this.contourSpacing = 150.0;
    this.contourWidth = 2.0;
    this.selectedShading = "elevation";
    this.changeColor = function() {
      contourUniforms.color = Cesium.Color.fromRandom(
        { alpha: 1.0 },
        contourColor
      );
    };

    let material;

    if (hasContour) {
      if (selectedShading === "elevation") {
        material = this.getElevationContourMaterial();
        shadingUniforms = material.materials.elevationRampMaterial.uniforms;
        shadingUniforms.minimumHeight = minHeight;
        shadingUniforms.maximumHeight = maxHeight;
        contourUniforms = material.materials.contourMaterial.uniforms;
      } else if (selectedShading === "slope") {
        material = this.getSlopeContourMaterial();
        shadingUniforms = material.materials.slopeRampMaterial.uniforms;
        contourUniforms = material.materials.contourMaterial.uniforms;
      } else if (selectedShading === "aspect") {
        material = this.getAspectContourMaterial();
        shadingUniforms = material.materials.aspectRampMaterial.uniforms;
        contourUniforms = material.materials.contourMaterial.uniforms;
      } else {
        material = Material.fromType("ElevationContour");
        contourUniforms = material.uniforms;
      }
      contourUniforms.width = this.viewModel.contourWidth;
      contourUniforms.spacing = this.viewModel.contourSpacing;
      contourUniforms.color = contourColor;
    } else if (selectedShading === "elevation") {
      material = Material.fromType("ElevationRamp");
      shadingUniforms = material.uniforms;
      shadingUniforms.minimumHeight = minHeight;
      shadingUniforms.maximumHeight = maxHeight;
    } else if (selectedShading === "slope") {
      material = Material.fromType("SlopeRamp");
      shadingUniforms = material.uniforms;
    } else if (selectedShading === "aspect") {
      material = Material.fromType("AspectRamp");
      shadingUniforms = material.uniforms;
    }
    if (selectedShading !== "none") {
      shadingUniforms.image = this.getColorRamp(selectedShading);
    }
    globe.material = material;
  },

  onChange(e) {
    viewState.terrainMaterialSelection = e.target.value;
    //this.foobar(this)
    this.updateMaterial();
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
          <div className={Styles.header}>
            <div className={Styles.actions}>Terrain Settings</div>
          </div>

          <div className="container">
            <div className="row">
              <div className="col-sm-12" id="toolbar">
                <form>
                  <div className="radio">
                    <label>
                      <input
                        type="radio"
                        value="none"
                        checked={
                          this.props.viewState.terrainMaterialSelection ===
                          "none"
                        }
                        onChange={this.onChange}
                      />
                      No Shading
                    </label>
                  </div>
                  <div className="radio">
                    <label>
                      <input
                        type="radio"
                        value="elevation"
                        checked={
                          this.props.viewState.terrainMaterialSelection ===
                          "elevation"
                        }
                        onChange={this.onChange}
                      />
                      Elevation
                    </label>
                  </div>
                  <div className="radio">
                    <label>
                      <input
                        type="radio"
                        value="slope"
                        checked={
                          this.props.viewState.terrainMaterialSelection ===
                          "slope"
                        }
                        onChange={this.onChange}
                      />
                      Slope
                    </label>
                  </div>
                  <div className="radio">
                    <label>
                      <input
                        type="radio"
                        value="aspect"
                        checked={
                          this.props.viewState.terrainMaterialSelection ===
                          "aspect"
                        }
                        onChange={this.onChange}
                      />
                      Aspect
                    </label>
                  </div>
                </form>
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
