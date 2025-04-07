import React, { useEffect } from "react";
import { Rnd } from "react-rnd";
import Styles from "./measurable-panel.scss";
import classNames from "classnames";
import Icon, { StyledIcon } from "../../Styled/Icon";
import { action, computed, runInAction } from "mobx";
import { observer } from "mobx-react";
import EllipsoidGeodesic from "terriajs-cesium/Source/Core/EllipsoidGeodesic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Button from "../../Styled/Button";
import Text from "../../Styled/Text";
import Box from "../../Styled/Box";
import Input, { StyledTextArea } from "../../Styled/Input";
import ViewState from "../../ReactViewModels/ViewState";
import Terria from "../../Models/Terria";
import { useTheme } from "styled-components";
import MeasurableDownloadPanel from "./MeasurableDownloadPanel";
import i18next from "i18next";
import {
  MeasureLineTool,
  MeasurePolygonTool,
  MeasureAngleTool,
  MeasurePointTool
} from "../Map/MapNavigation/Items";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import MeasurablePanelManager from "../Custom/MeasurablePanelManager";
import Select from "../../Styled/Select";
import MeasurableGeometryManager from "../../ViewModels/MeasurableGeometryManager";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import isDefined from "../../Core/isDefined";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Checkbox from "../../Styled/Checkbox";
import { MeasureToolsController } from "../Map/MapNavigation/Items/MeasureTools";

interface Props {
  viewState: ViewState;
  terria: Terria;
}

const MeasurablePanel = observer((props: Props) => {
  // Variables
  const { terria, viewState } = props;
  const theme = useTheme();
  const [showDistances, setShowDistances] = React.useState(true);
  const [highlightedRow, setHighlightedRow] = React.useState<number | null>(
    null
  );
  const [samplingPathStep, setSamplingPathStep] = React.useState(
    terria.measurableGeomSamplingStep
  );
  const [isValidSamplingPathStep, setIsValidSamplingPathStep] =
    React.useState(true);
  const { width: windowWidth, height: windowHeight } = useWindowSize();

  const initialWidth = windowWidth * 0.2;
  const initialHeight = windowHeight * 0.6;
  const maxWidth = windowWidth * 0.6;
  const maxHeight = windowHeight * 0.8;

  const { selectedStopPointIdx, measurablePanelIsVisible } = viewState;

  // Initialize utils methods and variables
  MeasurablePanelManager.initialize(terria);

  runInAction(() => {
    if (
      terria.measurableGeomList &&
      terria.measurableGeomList[terria.measurableGeometryIndex]
    ) {
      terria.measurableGeomList[
        terria.measurableGeometryIndex
      ].showDistanceLabels = showDistances;
    }
  });

  const panelClassName = classNames(Styles.panel, {
    [Styles.isCollapsed]: viewState.measurablePanelIsCollapsed,
    [Styles.isVisible]: viewState.measurablePanelIsVisible,
    [Styles.isTranslucent]: viewState.explorerPanelIsVisible
  });

  const close = action(() => {
    MeasurablePanelManager.removeAllMarkers();
    terria.measurableGeomList.splice(1, terria.measurableGeomList.length - 1);
    terria.measurableGeometryManager.splice(
      1,
      terria.measurableGeometryManager.length - 1
    );
    viewState.measurablePanelIsVisible = false;
    [
      MeasureToolsController.id,
      MeasureLineTool.id,
      MeasurePolygonTool.id,
      MeasurePointTool.id,
      MeasureAngleTool.id
    ].forEach((id) => {
      const item = viewState.terria.mapNavigationModel.findItem(id)?.controller;
      if (item && item.active) {
        item.deactivate();
      }
      viewState.terria.mapNavigationModel.enable(id);
    });
  });

  const toggleCollapsed = action(() => {
    viewState.measurablePanelIsCollapsed =
      !viewState.measurablePanelIsCollapsed;
  });

  const toggleChart = action(() => {
    terria.measurableGeometryManager[terria.measurableGeometryIndex].resample();
    viewState.measurableChartIsVisible = !viewState.measurableChartIsVisible;
  });

  const toggleLineClampToGround = action(() => {
    terria.clampMeasureLineToGround = !terria.clampMeasureLineToGround;
  });

  const changeSamplingPathStep = action((val: number) => {
    terria.measurableGeomSamplingStep = val;
  });

  const getBearing = computed(() => {
    if (
      !terria?.cesium?.scene?.globe?.ellipsoid ||
      !terria?.measurableGeomList[terria.measurableGeometryIndex]?.stopPoints ||
      terria.measurableGeomList[terria.measurableGeometryIndex].stopPoints
        .length === 0
    ) {
      return "";
    }
    const ellipsoid = terria.cesium.scene.globe.ellipsoid;
    const start =
      terria.measurableGeomList[terria.measurableGeometryIndex].stopPoints[0];
    const end =
      terria.measurableGeomList[terria.measurableGeometryIndex].stopPoints.at(
        -1
      );
    const geo = new EllipsoidGeodesic(start, end, ellipsoid);
    const bearing = (CesiumMath.toDegrees(geo.startHeading) + 360) % 360;
    return `${bearing.toFixed(0)}°`;
  });

  const getHeightDifference = computed(() => {
    if (
      !terria?.measurableGeomList[terria.measurableGeometryIndex]?.stopPoints ||
      terria.measurableGeomList[terria.measurableGeometryIndex].stopPoints
        .length < 2
    ) {
      return "";
    }
    const start =
      terria.measurableGeomList[terria.measurableGeometryIndex].stopPoints[0];
    const end = terria.measurableGeomList[
      terria.measurableGeometryIndex
    ].stopPoints.at(-1) as Cartographic;
    const difference = end.height - start.height;
    return `${difference.toFixed(0)} m`;
  });

  const heights = computed(() => {
    return (
      terria?.measurableGeomList[
        terria.measurableGeometryIndex
      ]?.stopPoints?.map((elem) => elem.height) || []
    );
  });

  const rangeSamplingPathStep = computed(() => {
    if (
      !terria?.measurableGeomList[terria.measurableGeometryIndex]
        ?.geodeticDistance
    ) {
      return [0, 0];
    }
    const minExponent = 0;
    const maxExponent = 3;
    const thousandthExponent = 4;
    const exponent = Math.min(
      maxExponent,
      Math.max(
        minExponent,
        (terria.measurableGeomList[
          terria.measurableGeometryIndex
        ]?.geodeticDistance?.toFixed(0).length ?? 0) - thousandthExponent
      )
    );
    const minSamplingPathStep = 10 ** exponent;
    const maxSamplingPathStep = 2 * 10 ** maxExponent;
    return [minSamplingPathStep, maxSamplingPathStep];
  });

  const prettifyNumber = (number: number, squared: boolean = false) => {
    if (number <= 0) {
      return "";
    }
    let label = "m";
    if (squared) {
      if (number > 999999) {
        label = "km";
        number = number / 1000000.0;
      }
    } else {
      if (number > 999) {
        label = "km";
        number = number / 1000.0;
      }
    }
    let numberStr = number.toFixed(2);
    numberStr = numberStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    numberStr = `${numberStr} ${label}`;
    if (squared) {
      numberStr += "\u00B2";
    }
    return numberStr;
  };

  // UseEffects Methods
  function useWindowSize() {
    const [windowSize, setWindowSize] = React.useState({
      width: window.innerWidth,
      height: window.innerHeight
    });

    useEffect(() => {
      const handleResize = () => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    return windowSize;
  }

  useEffect(() => {
    if (selectedStopPointIdx !== null) {
      setHighlightedRow(selectedStopPointIdx);
    } else {
      setHighlightedRow(null);
    }
    terria.currentViewer.notifyRepaintRequired();
  }, [terria.currentViewer, selectedStopPointIdx]);

  const currentGeom = terria.measurableGeomList[terria.measurableGeometryIndex];
  useEffect(() => {
    if (!measurablePanelIsVisible) return;
    const handleMouseProximity = () => {
      const mouseCoords = terria.currentViewer.mouseCoords.cartographic;
      if (
        !mouseCoords ||
        !terria.measurableGeomList ||
        !terria.measurableGeomList[terria.measurableGeometryIndex]
      )
        return;

      const getDynamicRangeThreshold = (): number => {
        const fallback = 0.000025;
        if (!terria?.cesium) return fallback;

        const { scene } = terria.cesium;
        const canvas = scene.canvas;
        const centerX = Math.floor(canvas.clientWidth / 2);
        const bottomY = canvas.clientHeight - 1;

        const leftRay = scene.camera.getPickRay(
          new Cartesian2(centerX, bottomY)
        );
        const rightRay = scene.camera.getPickRay(
          new Cartesian2(centerX + 1, bottomY)
        );
        if (!isDefined(leftRay) || !isDefined(rightRay)) return fallback;

        const globe = scene.globe;
        const leftPosition = globe.pick(leftRay, scene);
        const rightPosition = globe.pick(rightRay, scene);
        if (!isDefined(leftPosition) || !isDefined(rightPosition))
          return fallback;

        const distance = Cartesian3.distance(leftPosition, rightPosition);
        const proximityPixels = 5;
        const proximityMeters = distance * proximityPixels;
        const earthRadius = 6372797;

        const threshold = proximityMeters / earthRadius;
        return Math.max(threshold, fallback);
      };

      const findNearbyPoint = (
        points: Cartographic[],
        action: (point: Cartographic | null, idx: number | null) => void
      ) => {
        const rangeThreshold = getDynamicRangeThreshold();

        const nearbyPoint = points.find((point) => {
          const latDiff = Math.abs(mouseCoords.latitude - point.latitude);
          const lonDiff = Math.abs(mouseCoords.longitude - point.longitude);
          return latDiff <= rangeThreshold && lonDiff <= rangeThreshold;
        });

        if (nearbyPoint) {
          const idx = points.indexOf(nearbyPoint);
          action(nearbyPoint, idx);
        } else {
          action(null, null);
        }
      };

      if (
        terria?.measurableGeomList[terria.measurableGeometryIndex]
          ?.onlyPoints === false
      ) {
        if (
          terria.measurableGeomList[terria.measurableGeometryIndex]
            .sampledPoints
        ) {
          findNearbyPoint(
            terria.measurableGeomList[terria.measurableGeometryIndex]
              .sampledPoints ?? [],
            (point, idx) => {
              if (point) {
                MeasurablePanelManager.addMarker(point);
                viewState.setSelectedSampledPointIdx(idx);
              } else {
                MeasurablePanelManager.removeAllMarkers();
                viewState.setSelectedSampledPointIdx(null);
              }
            }
          );
        }
      }

      if (
        terria.measurableGeomList[terria.measurableGeometryIndex].stopPoints
      ) {
        findNearbyPoint(
          terria.measurableGeomList[terria.measurableGeometryIndex].stopPoints,
          (point, idx) => {
            if (point) {
              MeasurablePanelManager.addMarker(point);
              setHighlightedRow(idx);
              viewState.setSelectedStopPointIdx(idx);
            } else {
              if (
                terria?.measurableGeomList[terria.measurableGeometryIndex]
                  ?.onlyPoints
              )
                MeasurablePanelManager.removeAllMarkers();
              setHighlightedRow(null);
              viewState.setSelectedStopPointIdx(null);
            }
          }
        );
      }

      terria.currentViewer.notifyRepaintRequired();
    };

    const disposer =
      terria.currentViewer.mouseCoords.updateEvent.addEventListener(
        handleMouseProximity
      );

    return () => disposer();
  }, [
    viewState,
    terria.cesium,
    terria.currentViewer,
    terria.measurableGeomList,
    terria.measurableGeometryIndex,
    currentGeom,
    measurablePanelIsVisible
  ]);

  // Render Methods
  const renderHeader = () => {
    return (
      <div
        className={Styles.header}
        css={`
          background: ${theme.darkTranslucent};
        `}
      >
        <div className={classNames("drag-handle", Styles.btnPanelHeading)}>
          <span style={{ display: "flex", justifyContent: "center" }}>
            <b>{i18next.t("measurableGeometry.header")}</b>
          </span>
          <button
            type="button"
            onClick={toggleCollapsed}
            className={Styles.btnToggleFeature}
            title="collapse"
            disabled={
              terria.measurableGeomList[terria.measurableGeometryIndex]
                ?.isPointAdding
            }
          >
            {props.viewState.measurablePanelIsCollapsed ? (
              <Icon glyph={Icon.GLYPHS.closed} />
            ) : (
              <Icon glyph={Icon.GLYPHS.opened} />
            )}
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            terria.measurableGeometryIndex = 0;
            close();
          }}
          className={Styles.btnCloseFeature}
          title={i18next.t("general.close")}
          disabled={
            terria.measurableGeomList[terria.measurableGeometryIndex]
              ?.isPointAdding
          }
        >
          <Icon glyph={Icon.GLYPHS.close} />
        </button>
      </div>
    );
  };

  const renderSamplingStep = () => {
    return (
      <>
        <Text textLight style={{ marginLeft: 1 }} title="">
          {i18next.t("measurableGeometry.samplingStepHeader")}:
          <br />
          [min {rangeSamplingPathStep.get()[0]}, max{" "}
          {rangeSamplingPathStep.get()[1]}]
        </Text>
        <Box styledMargin="5px">
          <Box styledWidth="120px">
            <Input
              css={`
                border: solid;
                border-width: ${isValidSamplingPathStep ? 1 : 2}px;
                border-color: ${isValidSamplingPathStep
                  ? theme.textLight
                  : "red"};
              `}
              title={i18next.t("measurableGeometry.samplingStepHeader")}
              light={false}
              dark
              type="number"
              min={1}
              max={2000}
              step={1}
              value={samplingPathStep}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setIsValidSamplingPathStep(
                  val >= rangeSamplingPathStep.get()[0] &&
                    val <= rangeSamplingPathStep.get()[1]
                );
                setSamplingPathStep(val);
              }}
            />
          </Box>
          <Button
            css={`
              color: ${theme.textLight};
              background: ${theme.colorPrimary};
              margin-left: 5px;
            `}
            disabled={
              !terria.measurableGeomList[terria.measurableGeometryIndex]
                ?.stopPoints.length
            }
            title={i18next.t("measurableGeometry.samplingStepButtonTitle")}
            onClick={() => {
              if (isValidSamplingPathStep) {
                changeSamplingPathStep(samplingPathStep);
              }
            }}
          >
            {i18next.t("measurableGeometry.samplingStepButtonText")}
          </Button>
        </Box>
      </>
    );
  };

  const renderToggleDistanceLabels = () => (
    <label style={{ display: "flex", alignItems: "center", margin: "0 10px" }}>
      <Checkbox
        isChecked={showDistances}
        isDisabled={
          !terria.measurableGeomList[terria.measurableGeometryIndex]?.stopPoints
            .length
        }
        onChange={(e) => {
          setShowDistances(e.target.checked);
          runInAction(() => {
            terria.measurableGeomList[
              terria.measurableGeometryIndex
            ]!.showDistanceLabels = e.target.checked;
          });
        }}
      />
      {i18next.t("Mostra etichette distanze")}
    </label>
  );

  const renderGeometrySummary = () => {
    const currentGeom =
      terria.measurableGeomList[terria.measurableGeometryIndex];
    if (!currentGeom) return null;

    if (currentGeom.hasArea) {
      return (
        <>
          <Text textLight style={{ marginLeft: 1 }} title="">
            {i18next.t("measurableGeometry.geometrySummaryHeader")}
          </Text>
          <small>
            {renderSummaryTable(
              [
                "measurableGeometry.geometrySummaryPerimeterGeo",
                "measurableGeometry.geometrySummaryPerimeterAir",
                "measurableGeometry.geometrySummaryAreaGeo",
                "measurableGeometry.geometrySummaryAreaAir"
              ],
              [
                prettifyNumber(currentGeom.geodeticDistance ?? 0),
                prettifyNumber(currentGeom.airDistance ?? 0),
                prettifyNumber(currentGeom.geodeticArea ?? 0, true),
                prettifyNumber(currentGeom.airArea ?? 0, true)
              ]
            )}
          </small>
        </>
      );
    }

    const tableHeaders = [
      "measurableGeometry.geometrySummaryElevationMin",
      "measurableGeometry.geometrySummaryElevationMax",
      "measurableGeometry.geometrySummaryElevationBear",
      "measurableGeometry.geometrySummaryElevationDiff"
    ];
    const tableData = [
      prettifyNumber(Math.min(...heights.get())),
      prettifyNumber(Math.max(...heights.get())),
      getBearing.get(),
      getHeightDifference.get()
    ];

    return (
      <>
        <StyledTextArea
          placeholder={i18next.t("measurableGeometry.textareaPlaceholder")}
          dark
          value={currentGeom.pathNotes}
          onChange={(e) => {
            runInAction(() => {
              if (terria.measurableGeomList && currentGeom) {
                currentGeom.pathNotes = e.target.value;
              }
            });
          }}
        />
        <Text textLight style={{ marginLeft: 1 }} title="">
          {i18next.t("measurableGeometry.geometrySummaryHeader")}
        </Text>
        <small>
          {renderSummaryTable(tableHeaders, tableData)}
          {!currentGeom.onlyPoints &&
            renderSummaryTable(
              [
                "measurableGeometry.geometrySummaryDistGeo",
                "measurableGeometry.geometrySummaryDistAir",
                "measurableGeometry.geometrySummaryDistGround"
              ],
              [
                prettifyNumber(currentGeom.geodeticDistance ?? 0),
                prettifyNumber(currentGeom.airDistance ?? 0),
                prettifyNumber(currentGeom.groundDistance ?? 0)
              ]
            )}
        </small>
      </>
    );
  };

  const renderBody = () => {
    return (
      <div className={Styles.body} style={{ padding: "1rem" }}>
        {!terria?.measurableGeomList[terria.measurableGeometryIndex]
          ?.onlyPoints && (
          <div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Select
                title={i18next.t("measurableGeometry.changePath")}
                value={terria.measurableGeometryIndex}
                disabled={
                  terria.measurableGeomList[terria.measurableGeometryIndex]
                    ?.isPointAdding
                }
                onChange={(e: any) => {
                  runInAction(() => {
                    terria.measurableGeometryIndex = parseInt(
                      e.target.value,
                      10
                    );
                    terria.currentViewer.notifyRepaintRequired();
                  });
                }}
              >
                {terria.measurableGeomList.map((mgl, index) => (
                  <option key={index} value={index}>
                    {`${i18next.t("measurableGeometry.elementPlaceholder")} ${
                      index + 1
                    }`}
                  </option>
                ))}
              </Select>
              {terria.measurableGeomList &&
                terria.measurableGeomList[terria.measurableGeometryIndex] &&
                !terria.measurableGeomList[terria.measurableGeometryIndex]
                  .isFileUploaded && (
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Button
                      disabled={
                        terria.measurableGeomList[
                          terria.measurableGeometryIndex
                        ]?.isPointAdding ||
                        viewState.measurableDownloadPanelIsVisible === true
                      }
                      css={`
                        color: ${theme.textLight};
                        background: ${theme.colorPrimary};
                        margin-left: 10px;
                      `}
                      onClick={() => {
                        runInAction(() => {
                          const newGeometry = {
                            isClosed:
                              terria?.measurableGeomList[
                                terria.measurableGeometryIndex
                              ].isClosed,
                            hasArea:
                              terria?.measurableGeomList[
                                terria.measurableGeometryIndex
                              ].hasArea,
                            stopPoints: [],
                            stopGeodeticDistances: [],
                            stopAirDistances: [],
                            stopGroundDistances: [],
                            geodeticDistance: 0,
                            airDistance: 0,
                            groundDistance: 0,
                            sampledPoints: [],
                            sampledDistances: [],
                            onlyPoints: false,
                            pointDescriptions: [],
                            pathNotes: "",
                            isFileUploaded:
                              terria?.measurableGeomList[
                                terria.measurableGeometryIndex
                              ].isFileUploaded
                          };

                          terria.measurableGeomList.push(newGeometry);
                          terria.measurableGeometryManager.push(
                            Object.freeze(new MeasurableGeometryManager(terria))
                          );

                          terria.measurableGeometryIndex =
                            terria.measurableGeomList.length - 1;
                        });
                      }}
                      title={i18next.t("measurableGeometry.addPath")}
                    >
                      <StyledIcon
                        light
                        realDark={false}
                        glyph={Icon.GLYPHS.plus}
                        styledWidth="16px"
                      />
                    </Button>
                    <Button
                      disabled={
                        terria.measurableGeomList.length <= 1 ||
                        terria.measurableGeomList[
                          terria.measurableGeometryIndex
                        ]?.isPointAdding ||
                        viewState.measurableDownloadPanelIsVisible === true
                      }
                      css={`
                        color: ${theme.textLight};
                        background: ${theme.colorPrimary};
                        margin-left: 10px;
                      `}
                      onClick={() => {
                        runInAction(() => {
                          const idx = terria.measurableGeometryIndex;
                          if (
                            idx >= 0 &&
                            idx < terria.measurableGeomList.length
                          ) {
                            terria.measurableGeomList.splice(idx, 1);
                            terria.measurableGeometryManager.splice(idx, 1);
                            terria.measurableGeometryIndex =
                              terria.measurableGeomList.length - 1;
                            terria.currentViewer.notifyRepaintRequired();
                          }
                        });
                      }}
                      title={i18next.t("measurableGeometry.removePath")}
                    >
                      <StyledIcon
                        light
                        realDark={false}
                        glyph={Icon.GLYPHS.minus}
                        styledWidth="16px"
                      />
                    </Button>
                  </div>
                )}
            </div>
            <Box
              css={`
                margin-top: 20px;
              `}
            >
              {!terria?.measurableGeomList[terria.measurableGeometryIndex]
                ?.hasArea && (
                <Button
                  css={`
                    background: #519ac2;
                    margin-left: 5px;
                    margin-bottom: 20px;
                  `}
                  onClick={toggleChart}
                  disabled={
                    !terria.measurableGeomList[terria.measurableGeometryIndex]
                      ?.stopPoints.length
                  }
                  title={i18next.t("measurableGeometry.showElevationChart")}
                >
                  <StyledIcon
                    light
                    realDark={false}
                    glyph={Icon.GLYPHS.lineChart}
                    styledWidth="24px"
                  />
                </Button>
              )}
              <Button
                css={`
                  color: ${theme.textLight};
                  background: ${theme.colorPrimary};
                  margin-left: 5px;
                  margin-bottom: 20px;
                `}
                disabled={
                  !terria.measurableGeomList[terria.measurableGeometryIndex]
                    ?.stopPoints.length
                }
                onClick={toggleLineClampToGround}
                title={i18next.t("measurableGeometry.clampLineButtonTitle")}
              >
                {terria.clampMeasureLineToGround
                  ? i18next.t("measurableGeometry.clampLineToGround")
                  : i18next.t("measurableGeometry.dontClampLineToGround")}
              </Button>
              {!terria.measurableGeomList[terria.measurableGeometryIndex]
                ?.isFileUploaded && renderToggleDistanceLabels()}
            </Box>
          </div>
        )}

        {!!terria?.cesium?.scene?.globe?.ellipsoid &&
          terria.measurableGeomList &&
          terria.measurableGeomList[terria.measurableGeometryIndex] && (
            <div
              css={`
                display: flex;
                margin-left: 5px;
                margin-top: 5px;
                margin-bottom: 5px;
              `}
            >
              <Box>
                <Button
                  css={`
                    color: ${theme.textLight};
                    background: ${theme.colorPrimary};
                    width: 100%;
                  `}
                  disabled={
                    !terria.measurableGeomList[terria.measurableGeometryIndex]
                      ?.stopPoints.length
                  }
                  onClick={() =>
                    runInAction(() => {
                      viewState.measurableDownloadPanelIsVisible = true;
                    })
                  }
                >
                  {i18next.t("downloadData.downloadPanel")}
                </Button>
              </Box>
            </div>
          )}
        {!terria?.measurableGeomList[terria.measurableGeometryIndex]?.hasArea &&
          !terria?.measurableGeomList[terria.measurableGeometryIndex]
            ?.onlyPoints &&
          renderSamplingStep()}
        <br />
        {renderGeometrySummary()}
        <br />
        {terria.measurableGeomList[terria.measurableGeometryIndex]
          ?.sampledDistances && renderStepDetails()}
      </div>
    );
  };

  const renderSummaryTable = (headers: string[], data: string[]) => (
    <table
      className={Styles.elevation}
      css={`
        width: 300px;
        border-collapse: collapse;
      `}
    >
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th
              key={index}
              css={`
                padding: 8px;
                text-align: left;
              `}
            >
              {i18next.t(header)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {data.map((item, index) => (
            <td
              key={index}
              css={`
                padding: 8px;
              `}
            >
              {item}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );

  const renderStepDetails = () => {
    const stopPoints =
      terria?.measurableGeomList[terria.measurableGeometryIndex]?.stopPoints ||
      [];
    const onlyPoints =
      terria?.measurableGeomList[terria.measurableGeometryIndex]?.onlyPoints;

    const handleDescriptionChange = action((index: number, value: string) => {
      const newDescriptions = [
        ...terria.measurableGeomList[terria.measurableGeometryIndex]
          ?.pointDescriptions!!
      ];
      newDescriptions[index] = value;
      if (
        terria.measurableGeomList &&
        terria.measurableGeomList[terria.measurableGeometryIndex]
      ) {
        terria.measurableGeomList[
          terria.measurableGeometryIndex
        ].pointDescriptions = newDescriptions;
      }
    });

    const onSortEnd = action(
      ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
        function reorder<T>(
          list: T[],
          startIndex: number,
          endIndex: number
        ): T[] {
          const result = Array.from(list);
          const [removed] = result.splice(startIndex, 1);
          result.splice(endIndex, 0, removed);
          return result;
        }

        if (oldIndex === newIndex) return;
        const newStopPoints = reorder(stopPoints, oldIndex, newIndex);
        if (
          terria.measurableGeomList &&
          terria.measurableGeomList[terria.measurableGeometryIndex]
        ) {
          const newDescriptions = reorder(
            terria.measurableGeomList[terria.measurableGeometryIndex]
              ?.pointDescriptions!!,
            oldIndex,
            newIndex
          );
          terria.measurableGeomList[terria.measurableGeometryIndex].stopPoints =
            newStopPoints;
          terria.measurableGeomList[
            terria.measurableGeometryIndex
          ].pointDescriptions = newDescriptions;
        }
        if (
          !terria.measurableGeomList[terria.measurableGeometryIndex]
            ?.onlyPoints &&
          !terria.measurableGeomList[terria.measurableGeometryIndex]
            ?.isFileUploaded
        )
          terria.measurableGeometryManager[
            terria.measurableGeometryIndex
          ].resample();
      }
    );

    return (
      <>
        <Text textLight style={{ marginLeft: 1 }} title="">
          {i18next.t("measurableGeometry.geometrySummaryStopSummary")}
        </Text>
        <small>
          <table className={Styles.elevation}>
            <thead>
              <tr>
                <th>#</th>
                <th>
                  {i18next.t("measurableGeometry.geometrySummaryElevation")}
                </th>
                {!onlyPoints && (
                  <>
                    <th>
                      {i18next.t(
                        "measurableGeometry.geometrySummaryElevationDiff"
                      )}
                    </th>
                    <th>
                      {i18next.t("measurableGeometry.geometrySummaryDistGeo")}
                    </th>
                    <th>
                      {i18next.t("measurableGeometry.geometrySummaryDistAir")}
                    </th>
                    <th>
                      {i18next.t(
                        "measurableGeometry.geometrySummaryDistGround"
                      )}
                    </th>
                    <th>
                      {i18next.t("measurableGeometry.geometrySummarySlope")}
                    </th>
                  </>
                )}
                {onlyPoints && <th>Descrizione</th>}
              </tr>
            </thead>
            <SortableList
              shouldCancelStart={() =>
                terria.measurableGeomList[terria.measurableGeometryIndex]
                  ?.isFileUploaded === true
              }
              items={stopPoints}
              onlyPoints={onlyPoints}
              pointsDescriptions={
                terria.measurableGeomList[terria.measurableGeometryIndex]
                  ?.pointDescriptions!!
              }
              onDescriptionChange={handleDescriptionChange}
              onSortEnd={onSortEnd}
              distance={5}
              prettifyNumber={prettifyNumber}
              terria={terria}
            />
          </table>
        </small>
      </>
    );
  };

  // Sortable Item and List components.
  interface SortableItemProps {
    point: any;
    idx: number;
    array: any[];
    onlyPoints?: boolean;
    pointsDescription: string;
    onDescriptionChange: (index: number, value: string) => void;
    prettifyNumber: (num: number, squared?: boolean) => string;
    terria: any;
  }

  const SortableItemComponent: React.FC<SortableItemProps> = ({
    point,
    idx,
    array,
    onlyPoints,
    pointsDescription,
    onDescriptionChange,
    prettifyNumber,
    terria
  }) => {
    const theme = useTheme();
    const isHighlighted = idx === highlightedRow;

    const renderDistanceData = React.useCallback(
      (distanceArray: any[], index: number) =>
        index > 0 && distanceArray?.length > index
          ? prettifyNumber(distanceArray[index])
          : "",
      [prettifyNumber]
    );

    const geomIndex = terria.measurableGeometryIndex;
    const renderSlope = React.useCallback(
      (index: number) => {
        if (index <= 0) return "";
        const airDistances =
          terria?.measurableGeomList[geomIndex]?.stopAirDistances;
        return airDistances?.length > index
          ? Math.abs(
              (100 * (point.height - array[index - 1].height)) /
                airDistances[index]
            ).toFixed(1)
          : "";
      },
      [geomIndex, terria.measurableGeomList, array, point.height]
    );

    const handleMouseLeave = React.useCallback(() => {
      setHighlightedRow(null);
      viewState.setSelectedStopPointIdx(null);
      MeasurablePanelManager.removeAllMarkers();
    }, []);

    const handleMouseOver = React.useCallback(() => {
      if (terria.cesium) {
        setHighlightedRow(idx);
        viewState.setSelectedStopPointIdx(idx);
        MeasurablePanelManager.addMarker(
          terria.measurableGeomList[terria.measurableGeometryIndex].stopPoints[
            idx
          ]
        );
      }
    }, [
      idx,
      terria.cesium,
      terria.measurableGeomList,
      terria.measurableGeometryIndex
    ]);

    const [localText, setLocalText] = React.useState(pointsDescription);
    useEffect(() => {
      setLocalText(pointsDescription);
    }, [pointsDescription]);

    return (
      <tr
        onMouseLeave={handleMouseLeave}
        onMouseUp={(e) => {
          if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
          handleMouseOver();
        }}
        style={{
          cursor: terria.measurableGeomList[terria.measurableGeometryIndex]
            ?.isFileUploaded
            ? "auto"
            : "row-resize",
          outline: isHighlighted ? `2px solid ${theme.colorPrimary}` : "none",
          outlineOffset: "-2px",
          backgroundColor: isHighlighted
            ? `${theme.colorPrimary}22`
            : "transparent"
        }}
      >
        <td>{idx + 1}</td>
        <td>{`${point.height.toFixed(0)} m`}</td>
        {!onlyPoints && (
          <>
            <td>
              {idx > 0 &&
                `${(point.height - array[idx - 1].height).toFixed(0)} m`}
            </td>
            <td>
              {renderDistanceData(
                terria.measurableGeomList[terria.measurableGeometryIndex]
                  ?.stopGeodeticDistances,
                idx
              )}
            </td>
            <td>
              {renderDistanceData(
                terria.measurableGeomList[terria.measurableGeometryIndex]
                  ?.stopAirDistances,
                idx
              )}
            </td>
            <td>
              {renderDistanceData(
                terria.measurableGeomList[terria.measurableGeometryIndex]
                  ?.stopGroundDistances,
                idx
              )}
            </td>
            <td>{renderSlope(idx)}</td>
          </>
        )}
        {onlyPoints && (
          <td>
            <StyledTextArea
              placeholder="Note..."
              value={localText}
              dark
              onChange={(e) => setLocalText(e.target.value)}
              onBlur={() => {
                onDescriptionChange(idx, localText);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />
          </td>
        )}
      </tr>
    );
  };

  SortableItemComponent.displayName = "SortableItemComponent";

  const SortableItem = SortableElement(React.memo(SortableItemComponent));
  SortableItem.displayName = "SortableItem";

  interface SortableListProps {
    items: any[];
    onlyPoints?: boolean;
    pointsDescriptions: string[];
    onDescriptionChange: (index: number, value: string) => void;
    prettifyNumber: (num: number, squared?: boolean) => string;
    terria: any;
  }

  const SortableListComponent: React.FC<SortableListProps> = ({
    items,
    onlyPoints,
    pointsDescriptions,
    onDescriptionChange,
    prettifyNumber,
    terria
  }) => {
    return (
      <tbody>
        {items.map((point, idx) => (
          <SortableItem
            key={`item-${idx}`}
            index={idx}
            idx={idx}
            array={items}
            onlyPoints={onlyPoints}
            pointsDescription={pointsDescriptions[idx]}
            onDescriptionChange={onDescriptionChange}
            prettifyNumber={prettifyNumber}
            terria={terria}
            point={point}
          />
        ))}
      </tbody>
    );
  };

  SortableListComponent.displayName = "SortableListComponent";

  const SortableList = SortableContainer(React.memo(SortableListComponent));
  SortableList.displayName = "SortableList";

  return (
    <Rnd
      bounds="parent"
      default={{
        x: 100,
        y: 100,
        width: initialWidth,
        height: initialHeight
      }}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
      dragHandleClassName="drag-handle"
      enableResizing={{
        right: true,
        left: true
      }}
      style={{
        pointerEvents:
          measurablePanelIsVisible && !viewState.measurablePanelIsCollapsed
            ? "auto"
            : "none"
      }}
    >
      <div
        css={`
          background: ${theme.darkTranslucent};
        `}
        className={panelClassName}
        style={{ pointerEvents: "auto" }}
        aria-hidden={!measurablePanelIsVisible}
      >
        {renderHeader()}
        {renderBody()}
        {viewState.measurableDownloadPanelIsVisible && (
          <MeasurableDownloadPanel
            terria={terria}
            viewState={viewState}
            initialWidth={initialWidth}
            maxWidth={maxWidth}
            onClose={() => {
              runInAction(() => {
                viewState.measurableDownloadPanelIsVisible = false;
              });
            }}
          />
        )}
      </div>
    </Rnd>
  );
});

export default MeasurablePanel;
