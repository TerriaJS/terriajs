import BadgeBar from "../BadgeBar.jsx";
import Icon from "../Icon.jsx";
import ObserveModelMixin from "../ObserveModelMixin";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import WorkbenchList from "./WorkbenchList.jsx";
import { withTranslation } from "react-i18next";
import RemovePanel from "../RemovePanel/RemovePanel.jsx";

import Styles from "./workbench.scss";

const Workbench = createReactClass({
  displayName: "Workbench",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      showPopup: false // for removing
    };
  },

  togglePopup() {
    this.setState(state => ({
      showPopup: !state.showPopup
    }));
  },

  removeAll() {
    this.props.terria.nowViewing.removeAll();
    this.togglePopup();
  },

  render() {
    const { t } = this.props;
    return (
      <div className={Styles.workbench}>
        {this.state.showPopup ? (
          <RemovePanel
            onConfirm={this.removeAll}
            onCancel={this.togglePopup}
            removeText={t("workbench.removeDataPanel")}
            confirmButtonTitle={t("workbench.confirmRemove")}
            cancelButtonTitle={t("workbench.cancelRemove")}
          />
        ) : null}
        <BadgeBar
          label={t("workbench.label")}
          badge={this.props.terria.nowViewing.items.length}
        >
          <button
            type="button"
            onClick={this.togglePopup}
            className={Styles.removeButton}
          >
            {t("workbench.removeAll")} <Icon glyph={Icon.GLYPHS.remove} />
          </button>
        </BadgeBar>
        <WorkbenchList
          viewState={this.props.viewState}
          terria={this.props.terria}
          removePanelOpen={this.state.showPopup}
        />
      </div>
    );
  }
});

export default withTranslation()(Workbench);
