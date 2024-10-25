import React from "react";
import Styles from "./measurable-panel.scss";
import classNames from "classnames";
import Icon, { StyledIcon } from "../../Styled/Icon";
import { action, computed } from "mobx";
import { observer } from "mobx-react";
import EllipsoidGeodesic from "terriajs-cesium/Source/Core/EllipsoidGeodesic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Button from "../../Styled/Button";
import Text from "../../Styled/Text";
import Box from "../../Styled/Box";
import Input from "../../Styled/Input";
import ViewState from "../../ReactViewModels/ViewState";
import Terria from "../../Models/Terria";
import { useTheme } from "styled-components";
import { MeasurableGeometry } from "../../ViewModels/MeasurableGeometryManager";
import MeasurableDownload from "./MeasurableDownload";
import i18next from "i18next";

const DragWrapper = require("../DragWrapper");

interface Props {
  viewState: ViewState;
  terria: Terria;
}

const MeasurablePanel = observer((props: Props) => {
  const { terria, viewState } = props;

  const theme = useTheme();

  const [samplingPathStep, setSamplingPathStep] = React.useState(
    terria.measurableGeomSamplingStep
  );
  const [isValidSamplingPathStep, setIsValidSamplingPathStep] =
    React.useState(true);

  const panelClassName = classNames(Styles.panel, {
    [Styles.isCollapsed]: viewState.measurablePanelIsCollapsed,
    [Styles.isVisible]: viewState.measurablePanelIsVisible,
    [Styles.isTranslucent]: viewState.explorerPanelIsVisible
  });

  const close = action(() => {
    viewState.measurablePanelIsVisible = false;
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
    // Given a number representing a number in metres, make it human readable
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
    // http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
    numberStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    numberStr = `${numberStr} ${label}`;
    if (squared) {
      numberStr += "\u00B2";
    }
    return numberStr;
  };

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

  const renderBody = () => {
    return (
      <div className={Styles.body}>
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
        </Box>
        {!terria?.measurableGeom?.hasArea && renderSamplingStep()}
        <br />
        {!terria?.measurableGeom?.hasArea
          ? renderPathSummary()
          : renderAreaSummary()}
        <br />
        {terria.measurableGeom?.sampledDistances && renderStepDetails()}
        {!!terria?.cesium?.scene?.globe?.ellipsoid && terria.measurableGeom && (
          <MeasurableDownload
            geom={terria.measurableGeom as MeasurableGeometry}
            name="path"
            ellipsoid={terria.cesium.scene.globe.ellipsoid}
          />
        )}
      </div>
    );
  };

  const renderPathSummary = () => {
    return (
      <>
        <Text textLight style={{ marginLeft: 1 }} title="">
          {i18next.t("measurableGeometry.geometrySummaryHeader")}
        </Text>
        <small>
          <table className={Styles.elevation}>
            <thead>
              <tr>
                <th>
                  {i18next.t("measurableGeometry.geometrySummaryElevationMin")}
                </th>
                <th>
                  {i18next.t("measurableGeometry.geometrySummaryElevationMax")}
                </th>
                <th>
                  {i18next.t("measurableGeometry.geometrySummaryElevationBear")}
                </th>
                <th>
                  {i18next.t("measurableGeometry.geometrySummaryElevationDiff")}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{prettifyNumber(Math.min(...heights.get()))}</td>
                <td>{prettifyNumber(Math.max(...heights.get()))}</td>
                <td>{getBearing.get()}</td>
                <td>{getHeightDifference.get()}</td>
              </tr>
            </tbody>
          </table>
          <table className={Styles.elevation}>
            <thead>
              <tr>
                <th>
                  {i18next.t("measurableGeometry.geometrySummaryDistGeo")}
                </th>
                <th>
                  {i18next.t("measurableGeometry.geometrySummaryDistAir")}
                </th>
                <th>
                  {i18next.t("measurableGeometry.geometrySummaryDistGround")}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {prettifyNumber(terria.measurableGeom?.geodeticDistance ?? 0)}
                </td>
                <td>
                  {prettifyNumber(terria.measurableGeom?.airDistance ?? 0)}
                </td>
                <td>
                  {prettifyNumber(terria.measurableGeom?.groundDistance ?? 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </small>
      </>
    );
  };

  const renderAreaSummary = () => {
    return (
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
                <th>
                  {i18next.t("measurableGeometry.geometrySummaryAreaGeo")}
                </th>
                <th>
                  {i18next.t("measurableGeometry.geometrySummaryAreaAir")}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {prettifyNumber(terria.measurableGeom?.geodeticDistance ?? 0)}
                </td>
                <td>
                  {prettifyNumber(terria.measurableGeom?.airDistance ?? 0)}
                </td>
                <td>
                  {prettifyNumber(
                    terria.measurableGeom?.geodeticArea ?? 0,
                    true
                  )}
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
  };

  const renderStepDetails = () => {
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
                <th>
                  {i18next.t("measurableGeometry.geometrySummaryElevationDiff")}
                </th>
                <th>
                  {i18next.t("measurableGeometry.geometrySummaryDistGeo")}
                </th>
                <th>
                  {i18next.t("measurableGeometry.geometrySummaryDistAir")}
                </th>
                <th>
                  {i18next.t("measurableGeometry.geometrySummaryDistGround")}
                </th>
                <th>{i18next.t("measurableGeometry.geometrySummarySlope")}</th>
              </tr>
            </thead>
            <tbody>
              {terria?.measurableGeom?.stopPoints &&
                terria.measurableGeom.stopPoints.length > 0 &&
                terria.measurableGeom.stopPoints.map((point, idx, array) => {
                  return (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{`${point.height.toFixed(0)} m`}</td>
                      <td>
                        {idx > 0
                          ? `${(point.height - array[idx - 1].height).toFixed(
                              0
                            )} m`
                          : ""}
                      </td>
                      <td>
                        {idx > 0 &&
                        terria?.measurableGeom?.stopGeodeticDistances &&
                        terria.measurableGeom.stopGeodeticDistances.length > idx
                          ? prettifyNumber(
                              terria.measurableGeom.stopGeodeticDistances[idx]
                            )
                          : ""}
                      </td>
                      <td>
                        {idx > 0 &&
                        terria?.measurableGeom?.stopAirDistances &&
                        terria.measurableGeom.stopAirDistances.length > idx
                          ? prettifyNumber(
                              terria.measurableGeom.stopAirDistances[idx]
                            )
                          : ""}
                      </td>
                      <td>
                        {idx > 0 &&
                        terria?.measurableGeom?.stopGroundDistances &&
                        terria.measurableGeom.stopGroundDistances.length > idx
                          ? prettifyNumber(
                              terria.measurableGeom.stopGroundDistances[idx]
                            )
                          : ""}
                      </td>
                      <td>
                        {idx > 0 &&
                        terria?.measurableGeom?.stopAirDistances &&
                        terria.measurableGeom.stopAirDistances.length > idx
                          ? Math.abs(
                              (100 * (point.height - array[idx - 1].height)) /
                                terria.measurableGeom.stopAirDistances[idx]
                            ).toFixed(1)
                          : ""}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </small>
      </>
    );
  };

  return (
    <DragWrapper>
      <div
        className={panelClassName}
        aria-hidden={!viewState.measurablePanelIsVisible}
      >
        {renderHeader()}
        {renderBody()}
      </div>
    </DragWrapper>
  );
});

export default MeasurablePanel;
