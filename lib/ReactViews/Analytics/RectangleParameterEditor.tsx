import React, { type ChangeEvent } from "react";
import defined from "terriajs-cesium/Source/Core/defined";
import Styles from "./parameter-editors.scss";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import {
  type TFunction,
  WithTranslation,
  withTranslation
} from "react-i18next";
import { observer } from "mobx-react";
import { makeObservable, runInAction } from "mobx";
import { BaseModel } from "../../Models/Definition/Model";
import RectangleParameter from "../../Models/FunctionParameters/RectangleParameter";
import CommonStrata from "../../Models/Definition/CommonStrata";
import Terria from "../../Models/Terria";
import UserDrawing from "../../Models/UserDrawing";
import ViewState from "../../ReactViewModels/ViewState";

interface RectangleParameterEditorProps extends WithTranslation {
  previewed: BaseModel | undefined;
  parameter: RectangleParameter;
  viewState: ViewState;
  t: TFunction;
}

@observer
class RectangleParameterEditor extends React.Component<RectangleParameterEditorProps> {
  constructor(props: RectangleParameterEditorProps) {
    super(props);
    makeObservable(this);
  }

  setValueFromText(e: ChangeEvent<HTMLInputElement>) {
    this.setParameterValueFromText(e, this.props.parameter);
  }

  /**
   * Triggered when user types value directly into field.
   * @param e Text that user has entered manually.
   * @param parameter Parameter to set value on.
   */
  setParameterValueFromText(
    e: ChangeEvent<HTMLInputElement>,
    parameter: RectangleParameter
  ) {
    parameter.setValue(CommonStrata.user, JSON.parse(e.target.value));
  }

  selectPolygonOnMap() {
    if (this.props.previewed) {
      selectOnMap(
        this.props.previewed.terria,
        this.props.viewState,
        this.props.parameter
      );
    }
  }

  render() {
    const { t } = this.props;
    return (
      <div>
        <input
          className={Styles.field}
          type="text"
          onChange={this.setValueFromText.bind(this)}
          value={getDisplayValue(this.props.parameter.value)}
        />
        <button
          type="button"
          onClick={this.selectPolygonOnMap.bind(this)}
          className={Styles.btnSelector}
        >
          {t("analytics.clickToDrawRectangle")}
        </button>
      </div>
    );
  }
}

/**
 * Given a value, return it in human readable form for display.
 * @param value Native format of parameter value.
 * @return String for display
 */
export function getDisplayValue(value: any) {
  if (!defined(value)) {
    return "";
  }
  return `${value.east}, ${value.north}, ${value.west}, ${value.south}`;
}

/**
 * Prompt user to select/draw on map in order to define parameter.
 * @param terria Terria instance.
 * @param viewState ViewState.
 * @param parameter Parameter.
 */
export function selectOnMap(
  terria: Terria,
  viewState: ViewState,
  parameter: RectangleParameter
) {
  const userDrawing = new UserDrawing({
    terria: terria,
    drawRectangle: true,
    onCleanUp: function () {
      viewState.openAddData();
    },
    onDrawingComplete: function (params) {
      if (params.points) {
        const cartographicPoints = params.points.map((point) => {
          const cartographic = Cartographic.fromCartesian(
            point,
            Ellipsoid.WGS84
          );
          return {
            latitude: CesiumMath.toDegrees(cartographic.latitude),
            longitude: CesiumMath.toDegrees(cartographic.longitude)
          };
        });
        const rectangle = {
          west: cartographicPoints[0].longitude,
          south: cartographicPoints[0].latitude,
          east: cartographicPoints[1].longitude,
          north: cartographicPoints[1].latitude
        };
        runInAction(() => {
          parameter.setValue(CommonStrata.user, rectangle);
        });
      }
    }
  });

  userDrawing.enterDrawMode();
}

export default withTranslation()(RectangleParameterEditor);
