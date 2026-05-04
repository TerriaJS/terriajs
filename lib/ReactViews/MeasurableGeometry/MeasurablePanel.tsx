import React, { useEffect } from "react";
import { Rnd } from "react-rnd";
import Styles from "./measurable-panel.scss";
import classNames from "classnames";
import Icon, { StyledIcon } from "../../Styled/Icon";
import { action, computed, runInAction } from "mobx";
import { observer } from "mobx-react";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import EllipsoidGeodesic from "terriajs-cesium/Source/Core/EllipsoidGeodesic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import Button from "../../Styled/Button";
import Text from "../../Styled/Text";
import Box from "../../Styled/Box";
import Input, { StyledTextArea } from "../../Styled/Input";
import ViewState from "../../ReactViewModels/ViewState";
import Terria from "../../Models/Terria";
import ViewerMode from "../../Models/ViewerMode";
import { useTheme } from "styled-components";
import i18next from "i18next";
import {
  MeasureLineTool,
  MeasurePolygonTool,
  MeasureAngleTool,
  MeasurePointTool
} from "../Map/MapNavigation/Items";
import MeasurablePanelManager from "../Custom/MeasurablePanelManager";
import Select from "../../Styled/Select";
import MeasurableGeometryManager from "../../ViewModels/MeasurableGeometry/MeasurableGeometryManager";
import Checkbox from "../../Styled/Checkbox";
import { MeasureToolsController } from "../Map/MapNavigation/Items/MeasureTools";
import MeasurableTransform from "./MeasurableTransform";
import MeasurableMouseProximity from "./MeasurableMouseProximity";
import DataUri from "../../Core/DataUri";
import {
  generatePathSummaryTxtData,
  getSummaryKind
} from "../../ViewModels/MeasurableGeometry/MeasurableGeometrySummary";
import MeasurableGeometryExporter from "../../ViewModels/MeasurableGeometry/MeasurableGeometryExporter";

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
  const [layerName, setLayerName] = React.useState("temp_layer");
  const [isValidSamplingPathStep, setIsValidSamplingPathStep] =
    React.useState(true);
  const [showTourPrompt, setShowTourPrompt] = React.useState(false);
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const isMobile = props.viewState.useSmallScreenInterface;

  const initialWidth = windowWidth * 0.2;
  const initialHeight = windowHeight * 0.6;
  const maxWidth = windowWidth * 0.6;
  const maxHeight = windowHeight * 0.8;
  const defaultX = 0;
  const defaultY = (windowHeight - initialHeight) / 2;

  const { selectedStopPointIdx, measurablePanelIsVisible } = viewState;

  const panelRef = React.useRef<HTMLDivElement>(null);
  const summaryTableRef = React.useRef<HTMLDivElement>(null);
  const stopSummaryRef = React.useRef<HTMLDivElement>(null);
  const samplingStepRef = React.useRef<HTMLDivElement>(null);
  const chartButtonRef = React.useRef<HTMLButtonElement>(null);
  const clampButtonRef = React.useRef<HTMLButtonElement>(null);
  const transformButtonRef = React.useRef<HTMLDivElement>(null);
  const multiPathControlsRef = React.useRef<HTMLDivElement>(null);

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
    const isMultiPath = terria.measurableGeomList.length > 1;
    MeasurablePanelManager.removeAllMarkers();
    terria.measurableGeomList.splice(1, terria.measurableGeomList.length - 1);
    terria.measurableGeometryManager.splice(
      1,
      terria.measurableGeometryManager.length - 1
    );
    viewState.measurablePanelIsVisible = false;
    viewState.mobileMeasureToolsButtonVisible = false;
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

    if (isMultiPath) {
      setTimeout(() => {
        close();
      }, 5);
    }
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
      !terria?.measurableGeomList[terria.measurableGeometryIndex]?.stopPoints ||
      terria.measurableGeomList[terria.measurableGeometryIndex].stopPoints
        .length === 0
    ) {
      return "";
    }
    const ellipsoid = terria.cesium?.scene?.globe?.ellipsoid ?? Ellipsoid.WGS84;
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

  const activeToolIsPolygon = React.useCallback(() => {
    const polygonTool = terria.mapNavigationModel.findItem(
      MeasurePolygonTool.id
    );
    return polygonTool?.controller?.active === true;
  }, [terria.mapNavigationModel]);

  const downloadPathSummaryTxt = React.useCallback(() => {
    const geom = terria.measurableGeomList[terria.measurableGeometryIndex];
    if (!geom) return;

    const kind = getSummaryKind({
      geom,
      activeToolIsPolygon: activeToolIsPolygon()
    });

    const { text, filename } = generatePathSummaryTxtData({
      geom,
      name: layerName,
      kind,
      ellipsoid: terria?.cesium?.scene?.globe?.ellipsoid ?? Ellipsoid.WGS84
    });

    const href = DataUri.make("txt", text);
    if (!href) return;

    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [activeToolIsPolygon, layerName, terria]);

  const downloadStopPointsCsv = React.useCallback(async () => {
    const geom = terria.measurableGeomList[terria.measurableGeometryIndex];
    if (!geom) return;

    const ellipsoid =
      terria?.cesium?.scene?.globe?.ellipsoid ?? Ellipsoid.WGS84;
    if (!ellipsoid) return;

    const links = await MeasurableGeometryExporter.generateAllDownloadLinks(
      geom,
      layerName,
      false,
      ellipsoid
    );
    const csvLink = links.find((link) => link.key === "csv");
    if (!csvLink?.href || !csvLink.download) return;

    const a = document.createElement("a");
    a.href = csvLink.href;
    a.download = csvLink.download;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [layerName, terria]);

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
    const updateOrDelete = (
      refName: string,
      ref: React.RefObject<HTMLElement>
    ) => {
      if (ref.current) {
        viewState.updateAppRef(refName, ref);
      } else {
        viewState.deleteAppRef(refName);
      }
    };

    updateOrDelete("MeasurablePanel", panelRef);
    updateOrDelete("MeasurableSummaryTable", summaryTableRef);
    updateOrDelete("MeasurableStopSummaryTable", stopSummaryRef);
    updateOrDelete("MeasurableSamplingStep", samplingStepRef);
    updateOrDelete("MeasurableChartButton", chartButtonRef);
    updateOrDelete("MeasurableClampButton", clampButtonRef);
    updateOrDelete("MeasurableTransformButton", transformButtonRef);
    updateOrDelete("MeasurableMultiPathControls", multiPathControlsRef);

    return () => {
      viewState.deleteAppRef("MeasurablePanel");
      viewState.deleteAppRef("MeasurableSummaryTable");
      viewState.deleteAppRef("MeasurableStopSummaryTable");
      viewState.deleteAppRef("MeasurableSamplingStep");
      viewState.deleteAppRef("MeasurableChartButton");
      viewState.deleteAppRef("MeasurableClampButton");
      viewState.deleteAppRef("MeasurableTransformButton");
      viewState.deleteAppRef("MeasurableMultiPathControls");
    };
  }, [
    viewState,
    measurablePanelIsVisible,
    terria.measurableGeometryIndex,
    terria.measurableGeomList,
    isMobile
  ]);

  useEffect(() => {
    if (measurablePanelIsVisible) {
      const seen = !!localStorage.getItem("measurableTourShown");
      if (!seen) setShowTourPrompt(true);
    }
  }, [measurablePanelIsVisible]);

  useEffect(() => {
    if (measurablePanelIsVisible) {
      const timeoutId = setTimeout(() => {
        runInAction(() => {
          terria.measurableGeomList.forEach((geom, index) => {
            if (geom?.stopPoints && geom.stopPoints.length > 0) {
              terria.measurableGeometryManager[index]?.resample(index);
            }
          });
        });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [
    terria.mainViewer.viewerMode,
    measurablePanelIsVisible,
    terria.measurableGeomList,
    terria.measurableGeometryManager
  ]);

  const startMeasurableTour = () => {
    setShowTourPrompt(false);
    localStorage.setItem("measurableTourShown", "true");
    const anyVs: any = viewState as any;
    if (typeof anyVs.startMeasurableTour === "function") {
      runInAction(() => anyVs.startMeasurableTour());
    }
  };

  const renderTourPrompt = () => {
    if (!showTourPrompt) return null;

    return (
      <Box
        position="relative"
        style={{
          background: theme.colorPrimary,
          padding: "8px 12px",
          borderRadius: "4px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          zIndex: 1000,
          marginBottom: 8
        }}
      >
        <Text small textLight>
          {i18next.t(
            "measurableGeometry.tourPrompt",
            "First time using Measures? Take a quick tour!"
          )}
        </Text>
        <Box centered gap={2} style={{ marginTop: 4 }}>
          <Button
            secondary
            shortMinHeight
            onClick={() => {
              startMeasurableTour();
            }}
            style={{ fontSize: "0.8em", padding: "2px 10px" }}
          >
            {i18next.t("measurableGeometry.tour.preface.start")}
          </Button>
          <Button
            primary
            shortMinHeight
            onClick={() => {
              setShowTourPrompt(false);
              localStorage.setItem("measurableTourShown", "true");
            }}
            style={{ fontSize: "0.8em", padding: "2px 10px" }}
          >
            {i18next.t("general.skip", "Skip")}
          </Button>
        </Box>
      </Box>
    );
  };

  const renderCompactHelp = () => {
    return (
      <button
        onClick={startMeasurableTour}
        className={Styles.btnCloseFeature}
        title={i18next.t(
          "measurableGeometry.tour.helpButton",
          "Open Measures tour"
        )}
        style={{ marginRight: 25 }}
      >
        <Icon glyph={Icon.GLYPHS.helpThick} />
      </button>
    );
  };

  useEffect(() => {
    if (selectedStopPointIdx !== null) {
      setHighlightedRow(selectedStopPointIdx);
    } else {
      setHighlightedRow(null);
    }
    terria.currentViewer.notifyRepaintRequired();
  }, [terria.currentViewer, selectedStopPointIdx]);

  const currentGeom = terria.measurableGeomList[terria.measurableGeometryIndex];

  // Render Methods
  const renderHeader = () => {
    return (
      <div
        className={Styles.header}
        css={`
          background: ${theme.darkTranslucent};
        `}
      >
        <div className={classNames(Styles.btnPanelHeading)}>
          <span
            className="drag-handle"
            style={{
              display: "flex",
              justifyContent: "center",
              cursor: "move"
            }}
          >
            <b>{i18next.t("measurableGeometry.header")}</b>
          </span>
          {!isMobile && (
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
          )}
        </div>
        {renderCompactHelp()}
        <button
          type="button"
          onClick={action(() => {
            terria.measurableGeometryIndex = 0;
            close();
          })}
          className={Styles.btnCloseFeature}
          title={i18next.t("general.close")}
        >
          <Icon glyph={Icon.GLYPHS.close} />
        </button>
      </div>
    );
  };

  const renderSamplingStep = () => {
    return (
      !isMobile && (
        <Box
          ref={samplingStepRef}
          css={`
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          `}
          styledMargin="5px"
        >
          <Text textLight style={{ marginLeft: 1, whiteSpace: "nowrap" }}>
            {i18next.t("measurableGeometry.samplingStepHeader")}
            {":"}
          </Text>
          <Text textLight style={{ whiteSpace: "nowrap" }} title="">
            [min {rangeSamplingPathStep.get()[0]}, max{" "}
            {rangeSamplingPathStep.get()[1]}]
          </Text>
          <Box
            css={`
              display: inline-flex;
              align-items: center;
              gap: 8px;
              flex-wrap: nowrap;
            `}
          >
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
        </Box>
      )
    );
  };

  const renderToggleDistanceLabels = () => (
    <label style={{ display: "flex", alignItems: "center", margin: "10px" }}>
      <Checkbox
        title={i18next.t("measurableGeometry.showDistanceCheckboxTitle")}
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
      {i18next.t("measurableGeometry.showDistanceCheckbox")}
    </label>
  );

  const renderGeometrySummary = () => {
    const is2dMode =
      terria.mainViewer.viewerMode === ViewerMode.Leaflet ||
      terria.mainViewer.viewerMode === ViewerMode.Cesium2D;
    const showGroundDistance = !is2dMode;
    const currentGeom =
      terria.measurableGeomList[terria.measurableGeometryIndex];
    if (!currentGeom) return null;

    if (activeToolIsPolygon() || currentGeom.hasArea || currentGeom.isClosed) {
      return (
        <>
          {!isMobile && (
            <StyledTextArea
              title={i18next.t("measurableGeometry.pathNotesTitle")}
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
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8
            }}
          >
            <Text textLight style={{ marginLeft: 1 }} title="">
              {i18next.t("measurableGeometry.geometrySummaryHeader")}
            </Text>
            <Button
              primary
              title={i18next.t("measurableGeometry.downloadLayerTitle")}
              onClick={downloadPathSummaryTxt}
              disabled={!currentGeom.stopPoints?.length}
              css={`
                width: 24px;
                height: 24px;
                min-width: 24px;
                min-height: 24px;
                padding: 0;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 2px;
              `}
            >
              <StyledIcon
                light
                realDark={false}
                glyph={Icon.GLYPHS.downloadNew}
                styledWidth="16px"
              />
            </Button>
          </div>
          <small>
            <table className={Styles.elevation}>
              <thead>
                <tr>
                  <th
                    colSpan={2}
                    css={`
                      padding: 8px;
                      text-align: center;
                      border-bottom: 1px solid ${theme.textLight}44;
                    `}
                  >
                    {i18next.t("measurableGeometry.geometrySummaryAreaGeo")}
                  </th>
                  <th
                    colSpan={2}
                    css={`
                      padding: 8px;
                      text-align: center;
                      border-bottom: 1px solid ${theme.textLight}44;
                    `}
                  >
                    {i18next.t("measurableGeometry.geometrySummaryAreaAir")}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    css={`
                      padding: 8px;
                    `}
                  >
                    {prettifyNumber(currentGeom.geodeticArea ?? 0, true)}
                  </td>
                  <td
                    css={`
                      padding: 8px;
                    `}
                  >
                    {(currentGeom.geodeticArea ?? 0) > 0
                      ? `${((currentGeom.geodeticArea ?? 0) * 0.0001).toFixed(
                          4
                        )} ha`
                      : ""}
                  </td>
                  <td
                    css={`
                      padding: 8px;
                    `}
                  >
                    {prettifyNumber(currentGeom.airArea ?? 0, true)}
                  </td>
                  <td
                    css={`
                      padding: 8px;
                    `}
                  >
                    {(currentGeom.airArea ?? 0) > 0
                      ? `${((currentGeom.airArea ?? 0) * 0.0001).toFixed(4)} ha`
                      : ""}
                  </td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: "15px", marginBottom: "10px" }} />

            {renderSummaryTable(
              [
                "measurableGeometry.geometrySummaryPerimeterGeo",
                "measurableGeometry.geometrySummaryPerimeterAir",
                "measurableGeometry.geometrySummaryPerimeterGround"
              ],
              [
                prettifyNumber(currentGeom.geodeticDistance ?? 0),
                prettifyNumber(currentGeom.airDistance ?? 0),
                prettifyNumber(currentGeom.groundDistance ?? 0)
              ]
            )}

            <div style={{ marginTop: "10px", marginBottom: "10px" }} />
          </small>
        </>
      );
    }

    const tableHeaders = currentGeom.onlyPoints
      ? [
          "measurableGeometry.geometrySummaryElevationMin",
          "measurableGeometry.geometrySummaryElevationMax"
        ]
      : [
          "measurableGeometry.geometrySummaryElevationMin",
          "measurableGeometry.geometrySummaryElevationMax",
          "measurableGeometry.geometrySummaryElevationBear",
          "measurableGeometry.geometrySummaryElevationDiff"
        ];
    const tableData = currentGeom.onlyPoints
      ? [
          prettifyNumber(Math.min(...heights.get())),
          prettifyNumber(Math.max(...heights.get()))
        ]
      : [
          prettifyNumber(Math.min(...heights.get())),
          prettifyNumber(Math.max(...heights.get())),
          getBearing.get(),
          getHeightDifference.get()
        ];

    return (
      <>
        {!isMobile && (
          <StyledTextArea
            title={i18next.t("measurableGeometry.pathNotesTitle")}
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
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8
          }}
        >
          <Text textLight style={{ marginLeft: 1 }} title="">
            {i18next.t("measurableGeometry.geometrySummaryHeader")}
          </Text>
          <Button
            primary
            title={i18next.t("measurableGeometry.downloadLayerTitle")}
            onClick={downloadPathSummaryTxt}
            disabled={!currentGeom.stopPoints?.length}
            css={`
              width: 24px;
              height: 24px;
              min-width: 24px;
              min-height: 24px;
              padding: 0;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              border-radius: 2px;
            `}
          >
            <StyledIcon
              light
              realDark={false}
              glyph={Icon.GLYPHS.downloadNew}
              styledWidth="16px"
            />
          </Button>
        </div>
        <small>
          {!is2dMode && renderSummaryTable(tableHeaders, tableData)}
          {!currentGeom.onlyPoints &&
            renderSummaryTable(
              [
                "measurableGeometry.geometrySummaryDistGeo",
                "measurableGeometry.geometrySummaryDistAir",
                ...(showGroundDistance
                  ? ["measurableGeometry.geometrySummaryDistGround"]
                  : [])
              ],
              [
                prettifyNumber(currentGeom.geodeticDistance ?? 0),
                prettifyNumber(currentGeom.airDistance ?? 0),
                ...(showGroundDistance
                  ? [prettifyNumber(currentGeom.groundDistance ?? 0)]
                  : [])
              ]
            )}
        </small>
      </>
    );
  };

  const renderBody = () => {
    const is2dMode =
      terria.mainViewer.viewerMode === ViewerMode.Leaflet ||
      terria.mainViewer.viewerMode === ViewerMode.Cesium2D;

    return (
      <div className={Styles.body} style={{ padding: "1rem" }}>
        {!terria?.measurableGeomList[terria.measurableGeometryIndex]
          ?.onlyPoints && (
          <div>
            {terria.measurableGeomList[terria.measurableGeometryIndex] &&
              ((terria.measurableGeomList[terria.measurableGeometryIndex]
                .isFileUploaded &&
                isMobile) ||
                !isMobile) && (
                <div
                  ref={multiPathControlsRef}
                  style={{ display: "flex", alignItems: "center" }}
                >
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
                        {`${i18next.t(
                          "measurableGeometry.elementPlaceholder"
                        )} ${index + 1}`}
                      </option>
                    ))}
                  </Select>
                  {terria.measurableGeomList &&
                    terria.measurableGeomList[terria.measurableGeometryIndex] &&
                    !terria.measurableGeomList[terria.measurableGeometryIndex]
                      .isFileUploaded &&
                    !isMobile && (
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
                                Object.freeze(
                                  new MeasurableGeometryManager(terria)
                                )
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
              )}
            <Box
              css={`
                margin-top: 20px;
              `}
            >
              {!terria?.measurableGeomList[terria.measurableGeometryIndex]
                ?.hasArea &&
                !is2dMode && (
                  <Button
                    ref={chartButtonRef}
                    css={`
                      background: ${theme.colorPrimary};
                      margin-left: 5px;
                      margin-bottom: 10px;
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
              {!isMobile && !is2dMode && (
                <Button
                  ref={clampButtonRef}
                  css={`
                    color: ${theme.textLight};
                    background: ${theme.colorPrimary};
                    margin-left: 5px;
                    margin-bottom: 10px;
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
              )}
            </Box>
            {!terria.measurableGeomList[terria.measurableGeometryIndex]
              ?.isFileUploaded && renderToggleDistanceLabels()}
          </div>
        )}

        {terria.measurableGeomList &&
          terria.measurableGeomList[terria.measurableGeometryIndex] && (
            <div
              css={`
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 10px;
                margin-top: 10px;
                margin-bottom: 16px;
              `}
            >
              <Input
                type="text"
                value={layerName}
                onChange={(e) => setLayerName(e.target.value)}
                style={{
                  flex: "1",
                  padding: "8px"
                }}
                placeholder={i18next.t("measurableGeometry.tempLayerName")}
              />
              <div ref={transformButtonRef}>
                <MeasurableTransform
                  terria={terria}
                  viewState={viewState}
                  pathNotes={currentGeom.pathNotes ?? ""}
                  layerName={layerName}
                  onClick={close}
                />
              </div>
            </div>
          )}
        {terria.measurableGeomList &&
          terria.measurableGeomList[terria.measurableGeometryIndex] && (
            <Text textLight style={{ marginLeft: 1, marginBottom: 10 }}>
              {i18next.t("measurableGeometry.tempLayerInfo")}
            </Text>
          )}
        {!terria?.measurableGeomList[terria.measurableGeometryIndex]?.hasArea &&
          !terria?.measurableGeomList[terria.measurableGeometryIndex]
            ?.onlyPoints &&
          !is2dMode &&
          renderSamplingStep()}
        <br />
        <div ref={summaryTableRef}>{renderGeometrySummary()}</div>
        <br />
        {terria.measurableGeomList[terria.measurableGeometryIndex]
          ?.sampledDistances && renderStepDetails()}
      </div>
    );
  };

  const renderSummaryTable = (headers: string[], data: string[]) => (
    <table className={Styles.elevation}>
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
    const is2dMode =
      terria.mainViewer.viewerMode === ViewerMode.Leaflet ||
      terria.mainViewer.viewerMode === ViewerMode.Cesium2D;
    const showGroundDistance = !is2dMode;
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
      <div ref={stopSummaryRef}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8
          }}
        >
          <Text textLight style={{ marginLeft: 1 }} title="">
            {i18next.t("measurableGeometry.geometrySummaryStopSummary")}
          </Text>
          <Button
            primary
            title={i18next.t("measurableGeometry.downloadStopPointsTitle")}
            onClick={downloadStopPointsCsv}
            disabled={!stopPoints.length}
            css={`
              width: 24px;
              height: 24px;
              min-width: 24px;
              min-height: 24px;
              padding: 0;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              border-radius: 2px;
            `}
          >
            <StyledIcon
              light
              realDark={false}
              glyph={Icon.GLYPHS.downloadNew}
              styledWidth="16px"
            />
          </Button>
        </div>
        <small>
          <table className={Styles.elevation}>
            <thead>
              <tr>
                <th>#</th>
                {!is2dMode && (
                  <th>
                    {i18next.t("measurableGeometry.geometrySummaryElevation")}
                  </th>
                )}
                {!onlyPoints && (
                  <>
                    {!is2dMode && (
                      <th>
                        {i18next.t(
                          "measurableGeometry.geometrySummaryElevationDiff"
                        )}
                      </th>
                    )}
                    <th>
                      {i18next.t("measurableGeometry.geometrySummaryDistGeo")}
                    </th>
                    <th>
                      {i18next.t("measurableGeometry.geometrySummaryDistAir")}
                    </th>
                    {showGroundDistance && (
                      <th>
                        {i18next.t(
                          "measurableGeometry.geometrySummaryDistGround"
                        )}
                      </th>
                    )}
                    {!is2dMode && (
                      <th>
                        {i18next.t("measurableGeometry.geometrySummarySlope")}
                      </th>
                    )}
                  </>
                )}
                {onlyPoints && !isMobile && <th>Descrizione</th>}
              </tr>
            </thead>
            {isMobile ? (
              <tbody>
                {stopPoints.map((point, idx) => (
                  <SortableItemComponent
                    key={`item-${idx}`}
                    idx={idx}
                    array={stopPoints}
                    onlyPoints={onlyPoints}
                    pointsDescription={
                      terria.measurableGeomList[terria.measurableGeometryIndex]
                        ?.pointDescriptions?.[idx] || ""
                    }
                    onDescriptionChange={handleDescriptionChange}
                    prettifyNumber={prettifyNumber}
                    terria={terria}
                    point={point}
                    is2dMode={is2dMode}
                  />
                ))}
              </tbody>
            ) : (
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
                is2dMode={is2dMode}
              />
            )}
          </table>
        </small>
      </div>
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
    is2dMode?: boolean;
  }

  const SortableItemComponent: React.FC<SortableItemProps> = ({
    point,
    idx,
    array,
    onlyPoints,
    pointsDescription,
    onDescriptionChange,
    prettifyNumber,
    terria,
    is2dMode
  }) => {
    const theme = useTheme();
    const isHighlighted = idx === highlightedRow;
    const showGroundDistance = !is2dMode;

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
      setHighlightedRow(idx);
      viewState.setSelectedStopPointIdx(idx);
      MeasurablePanelManager.addMarker(
        terria.measurableGeomList[terria.measurableGeometryIndex].stopPoints[
          idx
        ]
      );
    }, [idx, terria.measurableGeomList, terria.measurableGeometryIndex]);

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
        {!is2dMode && <td>{`${point.height.toFixed(0)} m`}</td>}
        {!onlyPoints && (
          <>
            {!is2dMode && (
              <td>
                {idx > 0 &&
                  `${(point.height - array[idx - 1].height).toFixed(0)} m`}
              </td>
            )}
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
            {showGroundDistance && (
              <td>
                {renderDistanceData(
                  terria.measurableGeomList[terria.measurableGeometryIndex]
                    ?.stopGroundDistances,
                  idx
                )}
              </td>
            )}
            {!is2dMode && <td>{renderSlope(idx)}</td>}
          </>
        )}
        {onlyPoints && !isMobile && (
          <td>
            <StyledTextArea
              placeholder="Note..."
              title={i18next.t("measurableGeometry.pointNotesTitle")}
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
    is2dMode?: boolean;
  }

  const SortableListComponent: React.FC<SortableListProps> = ({
    items,
    onlyPoints,
    pointsDescriptions,
    onDescriptionChange,
    prettifyNumber,
    terria,
    is2dMode
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
            is2dMode={is2dMode}
          />
        ))}
      </tbody>
    );
  };

  SortableListComponent.displayName = "SortableListComponent";

  const SortableList = SortableContainer(React.memo(SortableListComponent));
  SortableList.displayName = "SortableList";

  const panelContent = (
    <div
      ref={panelRef}
      css={`
        background: ${theme.darkTranslucent};
        width: ${isMobile ? "100%" : "auto"};
        height: ${isMobile ? "40%" : "auto"};
        overflow-y: auto;
      `}
      className={panelClassName}
      style={{ pointerEvents: "auto", position: "relative" }}
      aria-hidden={!measurablePanelIsVisible}
    >
      <MeasurableMouseProximity
        terria={terria}
        viewState={viewState}
        measurablePanelIsVisible={measurablePanelIsVisible}
        onHighlightedRowChange={setHighlightedRow}
      />
      {renderTourPrompt()}
      {renderHeader()}
      {renderBody()}
    </div>
  );

  if (isMobile) {
    return panelContent;
  } else {
    return (
      <Rnd
        bounds="parent"
        default={{
          x: defaultX,
          y: defaultY,
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
        {panelContent}
      </Rnd>
    );
  }
});

export default MeasurablePanel;
