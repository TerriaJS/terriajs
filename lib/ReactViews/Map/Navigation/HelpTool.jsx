"use strict";
import React from "react";
import PropTypes from "prop-types";
import Styles from "./tool_button.scss";
import { withTranslation } from "react-i18next";
import Icon from "../../Icon";
import { observer } from "mobx-react";
import { observable, action } from "mobx";
import Box from "../../../Styled/Box";
import Text from "../../../Styled/Text";

import UserDrawing from "../../../Models/UserDrawing";
import EllipsoidGeodesic from "terriajs-cesium/Source/Core/EllipsoidGeodesic";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import EllipsoidTangentPlane from "terriajs-cesium/Source/Core/EllipsoidTangentPlane";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import PolygonGeometryLibrary from "terriajs-cesium/Source/Core/PolygonGeometryLibrary";
import PolygonHierarchy from "terriajs-cesium/Source/Core/PolygonHierarchy";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import VertexFormat from "terriajs-cesium/Source/Core/VertexFormat";

@observer
class HelpTool extends React.Component {

  static displayName = "HelpTool";

  static propTypes = {
    terria: PropTypes.object,
    viewState: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
  }

  @action.bound
  handleClick() {
    this.props.viewState.showHelpMenu = !this.props.viewState
    .showHelpMenu;
    console.log("HI");
  }

  render() {
    const { t } = this.props;
    return (
      <div className={Styles.toolButton}>
        <button
          type="button"
          className={Styles.btn}
          title={"Help tool"}
          onClick={this.handleClick}
        >
          <Icon glyph={Icon.GLYPHS.bulb} />
        </button>
      </div>
    );
  }
}
export default withTranslation()(HelpTool);
