import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import classNames from "classnames";
import ObserveModelMixin from "../ObserveModelMixin";
import Styles from "./terrain-settings.scss";
import { withTranslation } from "react-i18next";

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
        </div>
      </>
    );
  }
});

// export default TerrainSettingsPanel;
export default withTranslation()(TerrainSettingsPanel);
