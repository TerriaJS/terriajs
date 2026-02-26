//"use strict";

import classNames from "classnames";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import { useTheme } from "styled-components";
import { useTranslation } from "react-i18next";
import Text from "../../Styled/Text";
import Box from "../../Styled/Box";
import Input from "../../Styled/Input";
import ViewState from "../../ReactViewModels/ViewState";
import Terria from "../../Models/Terria";
import Styles from "./viewshed-panel.scss";

const DragWrapper = require("../DragWrapper");

interface Props {
  viewState: ViewState;
  terria: Terria;
}

const ViewshedPanel = observer((props: Props) => {
  const { terria, viewState } = props;

  const theme = useTheme();

  const { t } = useTranslation();

  const panelClassName = classNames(Styles.panel, {
    [Styles.isCollapsed]: false,
    [Styles.isVisible]: viewState.viewshedPanelIsVisible,
    [Styles.isTranslucent]: viewState.explorerPanelIsVisible
  });

  const renderHeader = () => {
    return (
      <div className={Styles.header}>
        <div className={classNames("drag-handle", Styles.btnPanelHeading)}>
          <span style={{ display: "flex", justifyContent: "center" }}>
            <b>{t("viewshed.parameters")}</b>
          </span>
        </div>
      </div>
    );
  };

  const renderBody = () => {
    if (terria.viewshedDistances) {
      return (
        <div className={Styles.body}>
          <Text
            textLight
            style={{ textAlign: "center" }}
            title={t("viewshed.observerHeightInputTitle")}
          >
            {t("viewshed.observerHeightInput")}
          </Text>
          <Box>
            <Input
              css={`
                margin-left: 30px;
                margin-right: 30px;
                border: solid;
                border-width: 1px;
                border-color: ${theme.textLight};
              `}
              title={t("viewshed.observerHeightInputTitle")}
              light={false}
              dark
              required
              type="number"
              value={terria.viewshedObserverHeight}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                runInAction(() => {
                  terria.viewshedObserverHeight = isNaN(val) ? 0 : val;
                });
              }}
            />
          </Box>
          <br />
          <Text
            textLight
            style={{ textAlign: "center" }}
            title={t("viewshed.targetHeightInputTitle")}
          >
            {t("viewshed.targetHeightInput")}
          </Text>
          <Box>
            <Input
              css={`
                margin-left: 30px;
                margin-right: 30px;
                border: solid;
                border-width: 1px;
                border-color: ${theme.textLight};
              `}
              title={t("viewshed.targetHeightInputTitle")}
              light={false}
              dark
              required
              type="number"
              value={terria.viewshedTargetHeight}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                runInAction(() => {
                  terria.viewshedTargetHeight = isNaN(val) ? 0 : val;
                });
              }}
            />
          </Box>
          <br />
        </div>
      );
    }
  };

  return (
    <DragWrapper>
      <div
        className={panelClassName}
        aria-hidden={!viewState.viewshedPanelIsVisible}
      >
        {renderHeader()}
        {renderBody()}
      </div>
    </DragWrapper>
  );
});

export default ViewshedPanel;
