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
import { MeasurableGeometry } from "../../ViewModels/MeasurableGeometryManager";
import MeasurableDownload from "./MeasurableDownload";
import i18next from "i18next";
import {
  MeasureLineTool,
  MeasurePolygonTool,
  MeasureAngleTool,
  MeasurePointTool
} from "../Map/MapNavigation/Items";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import MeasurablePanelManager from "../Custom/MeasurablePanelManager";

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

  // Initialize utils methods and variables
  MeasurablePanelManager.initialize(terria);

  runInAction(() => {
    if (terria.measurableGeom) {
      terria.measurableGeom.showDistanceLabels = showDistances;
    }
  });

  const panelClassName = classNames(Styles.panel, {
    [Styles.isCollapsed]: viewState.measurablePanelIsCollapsed,
    [Styles.isVisible]: viewState.measurablePanelIsVisible,
    [Styles.isTranslucent]: viewState.explorerPanelIsVisible
  });

  const close = action(() => {
    MeasurablePanelManager.removeAllMarkers();
    viewState.measurablePanelIsVisible = false;
    const deactivateTool = (toolId: string) => {
      const item =
        viewState.terria.mapNavigationModel.findItem(toolId)?.controller;
      if (item && item.active) {
        item.deactivate();
      }
    };
    deactivateTool(MeasurePointTool.id);
    deactivateTool(MeasureLineTool.id);
    deactivateTool(MeasurePolygonTool.id);
    deactivateTool(MeasureAngleTool.id);
  });

  const toggleCollapsed = action(() => {
    viewState.measurablePanelIsCollapsed =
      !viewState.measurablePanelIsCollapsed;
  });

  const toggleChart = action(() => {
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
      !terria?.measurableGeom?.stopPoints ||
      terria.measurableGeom.stopPoints.length === 0
    ) {
      return "";
    }
    const ellipsoid = terria.cesium.scene.globe.ellipsoid;
    const start = terria.measurableGeom.stopPoints[0];
    const end = terria.measurableGeom.stopPoints.at(-1);
    const geo = new EllipsoidGeodesic(start, end, ellipsoid);
    const bearing = (CesiumMath.toDegrees(geo.startHeading) + 360) % 360;
    return `${bearing.toFixed(0)}°`;
  });

  const getHeightDifference = computed(() => {
    if (
      !terria?.measurableGeom?.stopPoints ||
      terria.measurableGeom.stopPoints.length < 2
    ) {
      return "";
    }
    const start = terria.measurableGeom.stopPoints[0];
    const end = terria.measurableGeom.stopPoints.at(-1) as Cartographic;
    const difference = end.height - start.height;
    return `${difference.toFixed(0)} m`;
  });

  const heights = computed(() => {
    return terria?.measurableGeom?.stopPoints?.map((elem) => elem.height) || [];
  });

  const rangeSamplingPathStep = computed(() => {
    if (!terria?.measurableGeom?.geodeticDistance) {
      return [0, 0];
    }
    const minExponent = 0;
    const maxExponent = 3;
    const thousandthExponent = 4;
    const exponent = Math.min(
      maxExponent,
      Math.max(
        minExponent,
        terria.measurableGeom.geodeticDistance.toFixed(0).length -
          thousandthExponent
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
    if (viewState.selectedStopPointIdx !== null) {
      setHighlightedRow(viewState.selectedStopPointIdx);
    } else {
      setHighlightedRow(null);
    }
    terria.currentViewer.notifyRepaintRequired();
  }, [terria.currentViewer, viewState.selectedStopPointIdx]);

  useEffect(() => {
    if (!viewState.measurablePanelIsVisible) return;

    const handleMouseProximity = () => {
      const mouseCoords = terria.currentViewer.mouseCoords.cartographic;
      if (!mouseCoords || !terria.measurableGeom) return;

      const findNearbyPoint = (
        points: Cartographic[],
        action: (point: Cartographic | null, idx: number | null) => void
      ) => {
        const rangeThreshold = 0.0001;

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

      if (terria?.measurableGeom?.onlyPoints === false) {
        if (terria.measurableGeom.sampledPoints) {
          findNearbyPoint(terria.measurableGeom.sampledPoints, (point, idx) => {
            if (point) {
              MeasurablePanelManager.addMarker(point);
              viewState.setSelectedSampledPointIdx(idx);
            } else {
              MeasurablePanelManager.removeAllMarkers();
              viewState.setSelectedSampledPointIdx(null);
            }
          });
        }
      }

      if (terria.measurableGeom.stopPoints) {
        findNearbyPoint(terria.measurableGeom.stopPoints, (point, idx) => {
          if (point) {
            MeasurablePanelManager.addMarker(point);
            setHighlightedRow(idx);
            viewState.setSelectedStopPointIdx(idx);
          } else {
            if (terria?.measurableGeom?.onlyPoints)
              MeasurablePanelManager.removeAllMarkers();
            setHighlightedRow(null);
            viewState.setSelectedStopPointIdx(null);
          }
        });
      }

      terria.currentViewer.notifyRepaintRequired();
    };

    const disposer =
      terria.currentViewer.mouseCoords.updateEvent.addEventListener(
        handleMouseProximity
      );

    return () => disposer();
  }, [
    terria.cesium,
    terria.currentViewer,
    terria.measurableGeom,
    viewState.measurablePanelIsVisible
  ]);

  // Render Methods
  const renderHeader = () => {
    return (
      <div className={Styles.header}>
        <div className={classNames("drag-handle", Styles.btnPanelHeading)}>
          <span style={{ display: "flex", justifyContent: "center" }}>
            <b>{i18next.t("measurableGeometry.header")}</b>
          </span>
          <button
            type="button"
            onClick={toggleCollapsed}
            className={Styles.btnToggleFeature}
            title="collapse"
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
          onClick={close}
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
      <input
        type="checkbox"
        checked={showDistances}
        onChange={(e) => {
          setShowDistances(e.target.checked);
          runInAction(() => {
            terria.measurableGeom!.showDistanceLabels = e.target.checked;
          });
        }}
        style={{ marginRight: "5px" }}
      />
      {i18next.t("Mostra etichette distanze")}
    </label>
  );

  const renderBody = () => {
    return (
      <div className={Styles.body} style={{ padding: "1rem" }}>
        {!terria?.measurableGeom?.onlyPoints && (
          <Box>
            {!terria?.measurableGeom?.hasArea && (
              <Button
                css={`
                  background: #519ac2;
                  margin-left: 5px;
                  margin-bottom: 20px;
                `}
                onClick={toggleChart}
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
              onClick={toggleLineClampToGround}
              title={i18next.t("measurableGeometry.clampLineButtonTitle")}
            >
              {terria.clampMeasureLineToGround
                ? i18next.t("measurableGeometry.clampLineToGround")
                : i18next.t("measurableGeometry.dontClampLineToGround")}
            </Button>
            {!terria.measurableGeom?.isFileUploaded &&
              renderToggleDistanceLabels()}
          </Box>
        )}

        {!!terria?.cesium?.scene?.globe?.ellipsoid && terria.measurableGeom && (
          <div
            css={`
              display: flex;
              margin-left: 5px;
              margin-top: 5px;
              margin-bottom: 5px;
            `}
          >
            <Box>
              <Input
                css={`
                  margin-top: 5px;
                  margin-right: 10px;
                  max-width: 200px;
                  height: 30px;
                `}
                dark
                placeholder={i18next.t(
                  "measurableGeometry.filenamePlaceholder"
                )}
                value={terria.measurableGeom.filename}
                onChange={(e) => {
                  runInAction(() => {
                    if (terria.measurableGeom)
                      terria.measurableGeom.filename = e.target.value;
                  });
                }}
              />
            </Box>
            <Box>
              {!!terria?.cesium?.scene?.globe?.ellipsoid &&
                terria.measurableGeom && (
                  <MeasurableDownload
                    geom={terria.measurableGeom as MeasurableGeometry}
                    name={terria.measurableGeom.filename!!}
                    pathNotes={terria.measurableGeom.pathNotes!!}
                    ellipsoid={terria.cesium.scene.globe.ellipsoid}
                  />
                )}
            </Box>
          </div>
        )}
        {!terria?.measurableGeom?.hasArea &&
          !terria?.measurableGeom?.onlyPoints &&
          renderSamplingStep()}
        <br />
        {!terria?.measurableGeom?.hasArea
          ? terria?.measurableGeom?.onlyPoints
            ? renderPointsSummary()
            : renderPathSummary()
          : renderAreaSummary()}
        <br />
        {terria.measurableGeom?.sampledDistances && renderStepDetails()}
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

  const renderPointsSummary = () => {
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
          value={terria.measurableGeom?.pathNotes}
          onChange={(e) => {
            runInAction(() => {
              if (terria.measurableGeom)
                terria.measurableGeom.pathNotes = e.target.value;
            });
          }}
        />
        <Text textLight style={{ marginLeft: 1 }} title="">
          {i18next.t("measurableGeometry.geometrySummaryHeader")}
        </Text>
        <small>{renderSummaryTable(tableHeaders, tableData)}</small>
      </>
    );
  };

  const renderPathSummary = () => {
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

    const distanceHeaders = [
      "measurableGeometry.geometrySummaryDistGeo",
      "measurableGeometry.geometrySummaryDistAir",
      "measurableGeometry.geometrySummaryDistGround"
    ];

    const distanceData = [
      prettifyNumber(terria.measurableGeom?.geodeticDistance ?? 0),
      prettifyNumber(terria.measurableGeom?.airDistance ?? 0),
      prettifyNumber(terria.measurableGeom?.groundDistance ?? 0)
    ];

    return (
      <>
        <StyledTextArea
          placeholder={i18next.t("measurableGeometry.textareaPlaceholder")}
          dark
          value={terria.measurableGeom?.pathNotes}
          onChange={(e) => {
            runInAction(() => {
              if (terria.measurableGeom)
                terria.measurableGeom.pathNotes = e.target.value;
            });
          }}
        />
        <Text textLight style={{ marginLeft: 1 }} title="">
          {i18next.t("measurableGeometry.geometrySummaryHeader")}
        </Text>
        <small>
          {renderSummaryTable(tableHeaders, tableData)}
          {renderSummaryTable(distanceHeaders, distanceData)}
        </small>
      </>
    );
  };

  const renderAreaSummary = () => (
    <>
      <Text textLight style={{ marginLeft: 1 }} title="">
        {i18next.t("measurableGeometry.geometrySummaryHeader")}
      </Text>
      <small>
        <table className={Styles.elevation}>
          <thead>
            <tr>
              <th>
                {i18next.t("measurableGeometry.geometrySummaryPerimeterGeo")}
              </th>
              <th>
                {i18next.t("measurableGeometry.geometrySummaryPerimeterAir")}
              </th>
              <th>{i18next.t("measurableGeometry.geometrySummaryAreaGeo")}</th>
              <th>{i18next.t("measurableGeometry.geometrySummaryAreaAir")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                {prettifyNumber(terria.measurableGeom?.geodeticDistance ?? 0)}
              </td>
              <td>{prettifyNumber(terria.measurableGeom?.airDistance ?? 0)}</td>
              <td>
                {prettifyNumber(terria.measurableGeom?.geodeticArea ?? 0, true)}
              </td>
              <td>
                {prettifyNumber(terria.measurableGeom?.airArea ?? 0, true)}
              </td>
            </tr>
          </tbody>
        </table>
      </small>
    </>
  );

  const renderStepDetails = () => {
    const stopPoints = terria?.measurableGeom?.stopPoints || [];
    const onlyPoints = terria?.measurableGeom?.onlyPoints;

    const handleDescriptionChange = action((index: number, value: string) => {
      const newDescriptions = [...terria.measurableGeom?.pointDescriptions!!];
      newDescriptions[index] = value;
      if (terria.measurableGeom) {
        terria.measurableGeom.pointDescriptions = newDescriptions;
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
        if (terria.measurableGeom) {
          const newDescriptions = reorder(
            terria.measurableGeom?.pointDescriptions!!,
            oldIndex,
            newIndex
          );
          terria.measurableGeom.stopPoints = newStopPoints;
          terria.measurableGeom.pointDescriptions = newDescriptions;
        }
        if (
          !terria.measurableGeom?.onlyPoints &&
          !terria.measurableGeom?.isFileUploaded
        )
          terria.measurableGeometryManager.resample();
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
              items={stopPoints}
              onlyPoints={onlyPoints}
              pointsDescriptions={terria.measurableGeom?.pointDescriptions!!}
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
  const SortableItem = SortableElement(
    React.memo(
      ({
        point,
        idx,
        array,
        onlyPoints,
        pointsDescription,
        onDescriptionChange,
        prettifyNumber,
        terria
      }: {
        point: any;
        idx: number;
        array: any[];
        onlyPoints?: boolean;
        pointsDescription: string;
        onDescriptionChange: (index: number, value: string) => void;
        prettifyNumber: (num: number, squared?: boolean) => string;
        terria: any;
      }) => {
        const theme = useTheme();
        const isHighlighted = idx === highlightedRow;

        const renderDistanceData = React.useCallback(
          (distanceArray: any[], index: number) => {
            return index > 0 && distanceArray?.length > index
              ? prettifyNumber(distanceArray[index])
              : "";
          },
          [prettifyNumber]
        );

        const renderSlope = React.useCallback(
          (index: number) => {
            if (index <= 0) return "";
            const airDistances = terria?.measurableGeom?.stopAirDistances;
            return airDistances?.length > index
              ? Math.abs(
                  (100 * (point.height - array[index - 1].height)) /
                    airDistances[index]
                ).toFixed(1)
              : "";
          },
          [terria?.measurableGeom, array, point.height]
        );

        const handleMouseLeave = React.useCallback(() => {
          setHighlightedRow(null);
          viewState.setSelectedStopPointIdx(null);
          MeasurablePanelManager.removeAllMarkers();
        }, [viewState]);

        const handleMouseOver = React.useCallback(() => {
          if (terria.cesium) {
            setHighlightedRow(idx);
            viewState.setSelectedStopPointIdx(idx);
            MeasurablePanelManager.addMarker(
              terria.measurableGeom.stopPoints[idx]
            );
          }
        }, [idx, terria, viewState]);

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
              cursor: "row-resize",
              outline: isHighlighted
                ? `2px solid ${theme.colorPrimary}`
                : "none",
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
                    terria?.measurableGeom?.stopGeodeticDistances,
                    idx
                  )}
                </td>
                <td>
                  {renderDistanceData(
                    terria?.measurableGeom?.stopAirDistances,
                    idx
                  )}
                </td>
                <td>
                  {renderDistanceData(
                    terria?.measurableGeom?.stopGroundDistances,
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
                  onChange={(e) => {
                    setLocalText(e.target.value);
                  }}
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
      },
      (prevProps, nextProps) =>
        prevProps.idx === nextProps.idx &&
        prevProps.point === nextProps.point &&
        prevProps.pointsDescription === nextProps.pointsDescription
    )
  );

  const SortableList = SortableContainer(
    ({
      items,
      onlyPoints,
      pointsDescriptions,
      onDescriptionChange,
      prettifyNumber,
      terria
    }: {
      items: any[];
      onlyPoints?: boolean;
      pointsDescriptions: string[];
      onDescriptionChange: (index: number, value: string) => void;
      prettifyNumber: (num: number, squared?: boolean) => string;
      terria: any;
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
    }
  );

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
          viewState.measurablePanelIsVisible &&
          !viewState.measurablePanelIsCollapsed
            ? "auto"
            : "none"
      }}
    >
      <div
        className={panelClassName}
        style={{ pointerEvents: "auto" }}
        aria-hidden={!viewState.measurablePanelIsVisible}
      >
        {renderHeader()}
        {renderBody()}
      </div>
    </Rnd>
  );
});

export default MeasurablePanel;
