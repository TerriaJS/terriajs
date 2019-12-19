import BadgeBar from "../BadgeBar";
import Icon from "../Icon";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import WorkbenchList from "./WorkbenchList";
import { observer } from "mobx-react";

import Styles from "./workbench.scss";
import { runInAction } from "mobx";

const Workbench = observer(
  createReactClass({
    displayName: "Workbench",

    propTypes: {
      terria: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      t: PropTypes.func.isRequired
    },

    removeAll() {
      runInAction(() => {
        this.props.terria.workbench.removeAll();
        this.props.terria.timelineStack.items.clear();
      });
    },

    render() {
      const { t } = this.props;
      return (
        <div className={Styles.workbench}>
          <BadgeBar
            label={t("workbench.label")}
            badge={this.props.terria.workbench.items.length}
          >
            <button
              type="button"
              onClick={this.removeAll}
              className={Styles.removeButton}
            >
              {t("workbench.removeAll")} <Icon glyph={Icon.GLYPHS.remove} />
            </button>
          </BadgeBar>
          <WorkbenchList
            viewState={this.props.viewState}
            terria={this.props.terria}
          />
        </div>
      );
    }
  })
);

export default withTranslation()(Workbench);
