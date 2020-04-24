import createReactClass from "create-react-class";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation, Trans } from "react-i18next";
import { withTheme } from "styled-components";
import Icon from "../Icon";
import SearchBoxAndResults from "../Search/SearchBoxAndResults";
import Workbench from "../Workbench/Workbench";
import FullScreenButton from "./FullScreenButton";
import Styles from "./side-panel.scss";

import { useRefForTerria } from "../Hooks/useRefForTerria";

import Box from "../../Styled/Box";
import Spacing from "../../Styled/Spacing";
import Text, { TextSpan } from "../../Styled/Text";

function EmptyWorkbench(props) {
  const t = props.t;
  return (
    <Text large textLight nunito>
      <Box
        centered
        css={`
          min-height: 240px;
        `}
      >
        <Text large color={props.theme.textLightDimmed}>
          {t("emptyWorkbench.emptyArea")}
        </Text>
      </Box>
      <Box column paddedRatio={3}>
        <Box
          left
          css={`
            svg {
              fill: ${p => p.theme.textLight};
              width: 13px;
              height: 13px;
              padding-right: 5px;
            }
          `}
        >
          <Icon glyph={Icon.GLYPHS.bulb} />
          <Text large>{t("emptyWorkbench.helpfulHints")}</Text>
        </Box>
        <Spacing bottom={2} />
        <Text large>{t("emptyWorkbench.helpfulHintsOne")}</Text>
        <Spacing bottom={1} />
        <Trans i18nKey="emptyWorkbench.helpfulHintsTwo">
          <Text large>
            Click
            <TextSpan large bold>
              Explore map data
            </TextSpan>
            above to browse the Data Catalogue or click
            <TextSpan large bold>
              Upload
            </TextSpan>
            to load your own data onto the map.
          </Text>
        </Trans>
      </Box>
    </Text>
  );
}
EmptyWorkbench.propTypes = {
  t: PropTypes.func.isRequired,
  theme: PropTypes.object.isRequired
};

export const EXPLORE_MAP_DATA_NAME = "ExploreMapDataButton";
const ExploreMapDataWithTour = ({
  addDataBtnText,
  onAddDataClicked,
  viewState
}) => {
  const buttonRef = useRefForTerria(EXPLORE_MAP_DATA_NAME, viewState);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onAddDataClicked}
      className={Styles.button}
      title={addDataBtnText}
    >
      <Icon glyph={Icon.GLYPHS.add} />
      <TextSpan large nunito>
        {addDataBtnText}
      </TextSpan>
    </button>
  );
};
ExploreMapDataWithTour.propTypes = {
  addDataBtnText: PropTypes.string.isRequired,
  onAddDataClicked: PropTypes.func.isRequired,
  viewState: PropTypes.object.isRequired
};

const SidePanel = observer(
  createReactClass({
    displayName: "SidePanel",

    propTypes: {
      terria: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      t: PropTypes.func.isRequired,
      theme: PropTypes.object.isRequired
    },

    onAddDataClicked(event) {
      event.stopPropagation();
      runInAction(() => {
        this.props.viewState.topElement = "AddData";
      });
      this.props.viewState.openAddData();
    },

    onAddLocalDataClicked() {
      this.props.viewState.openUserData();
    },
    render() {
      const { t, theme } = this.props;
      const addData = t("addData.addDataBtnText");
      const uploadText = t("models.catalog.upload");
      return (
        <div className={Styles.workBench}>
          <div className={Styles.header}>
            <FullScreenButton
              terria={this.props.terria}
              viewState={this.props.viewState}
              minified={true}
              animationDuration={250}
              btnText={t("addData.btnHide")}
            />
            <button onClick={() => this.props.viewState.setTourIndex(0)}>
              <Icon glyph={Icon.GLYPHS.tour} /> {"Take the tour"}{" "}
            </button>
            <SearchBoxAndResults
              viewState={this.props.viewState}
              terria={this.props.terria}
              placeholder={t("search.placeholder")}
            />
            <div className={Styles.addData}>
              <ExploreMapDataWithTour
                viewState={this.props.viewState}
                addDataBtnText={addData}
                onAddDataClicked={this.onAddDataClicked}
              />
              <button
                type="button"
                onClick={this.onAddLocalDataClicked}
                className={Styles.uploadData}
                title={t("addData.load")}
              >
                <Icon glyph={Icon.GLYPHS.upload} />
                <TextSpan large nunito>
                  {uploadText}
                </TextSpan>
              </button>
            </div>
          </div>
          <div className={Styles.body}>
            <Choose>
              <When
                condition={
                  this.props.terria.workbench.items &&
                  this.props.terria.workbench.items.length > 0
                }
              >
                <Workbench
                  viewState={this.props.viewState}
                  terria={this.props.terria}
                />
              </When>
              <Otherwise>
                <EmptyWorkbench t={t} theme={theme} />
              </Otherwise>
            </Choose>
          </div>
        </div>
      );
    }
  })
);

module.exports = withTranslation()(withTheme(SidePanel));
