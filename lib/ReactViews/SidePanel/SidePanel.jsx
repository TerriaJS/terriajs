import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import Icon, { StyledIcon } from "../Icon";
import SearchBoxAndResults from "../Search/SearchBoxAndResults";
import Workbench from "../Workbench/Workbench";
import FullScreenButton from "./FullScreenButton";

import { withTerriaRef } from "../HOCs/withTerriaRef";

import Box from "../../Styled/Box";
import Spacing from "../../Styled/Spacing";
import Text from "../../Styled/Text";
import Button from "../../Styled/Button";

function EmptyWorkbench(props) {
  const t = props.t;
  const HelpfulHintsIcon = () => {
    return (
      <StyledIcon
        glyph={Icon.GLYPHS.bulb}
        styledWidth={"14px"}
        styledHeight={"14px"}
        light
        css={`
          padding: 2px 1px;
        `}
      />
    );
  };
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
      <Spacing bottom={10} />
      <Box column paddedRatio={3}>
        <Box left>
          <Text extraLarge bold>
            {t("emptyWorkbench.helpfulHints")}
          </Text>
        </Box>
        <Spacing bottom={4} />
        <Box>
          <HelpfulHintsIcon />
          <Spacing right={1} />
          <Text medium light>
            {t("emptyWorkbench.helpfulHintsOne")}
          </Text>
        </Box>
        <Spacing bottom={3} />
        <Box>
          <HelpfulHintsIcon />
          <Spacing right={1} />
          <Text medium light>
            {t("emptyWorkbench.helpfulHintsTwo")}
          </Text>
        </Box>
        <Spacing bottom={3} />
        <Box>
          <HelpfulHintsIcon />
          <Spacing right={1} />
          <Text medium light>
            {t("emptyWorkbench.helpfulHintsThree")}
          </Text>
        </Box>
      </Box>
    </Text>
  );
}
EmptyWorkbench.propTypes = {
  t: PropTypes.func.isRequired,
  theme: PropTypes.object.isRequired
};

const SidePanelButton = React.forwardRef((props, ref) => {
  const { btnText, ...rest } = props;
  return (
    <Button
      primary
      ref={ref}
      renderIcon={props.children && (() => props.children)}
      textProps={{
        large: true
      }}
      {...rest}
    >
      {btnText ? btnText : ""}
    </Button>
  );
});
SidePanelButton.displayName = "SidePanelButton"; // for some reasons lint doesn't like not having this
SidePanelButton.propTypes = {
  btnText: PropTypes.string,
  children: PropTypes.node
};

export const EXPLORE_MAP_DATA_NAME = "ExploreMapDataButton";
export const SIDE_PANEL_UPLOAD_BUTTON_NAME = "SidePanelUploadButton";

const SidePanel = observer(
  createReactClass({
    displayName: "SidePanel",

    propTypes: {
      terria: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      refFromHOC: PropTypes.object.isRequired,
      refFromHOCForUpload: PropTypes.object.isRequired,
      t: PropTypes.func.isRequired,
      theme: PropTypes.object.isRequired
    },

    onAddDataClicked() {
      this.props.viewState.setTopElement("AddData");
      this.props.viewState.openAddData();
    },

    onAddLocalDataClicked(event) {
      event.stopPropagation();
      this.props.viewState.topElement = "AddData";
      this.props.viewState.openUserData();
    },
    render() {
      const { t, theme } = this.props;
      const addData = t("addData.addDataBtnText");
      const uploadText = t("models.catalog.upload");
      return (
        <div>
          <div
            css={`
              padding: 0 5px;
              background: ${this.props.theme.dark};
            `}
          >
            <FullScreenButton
              terria={this.props.terria}
              viewState={this.props.viewState}
              minified={true}
              animationDuration={250}
              btnText={t("addData.btnHide")}
            />
            <SearchBoxAndResults
              viewState={this.props.viewState}
              terria={this.props.terria}
              placeholder={t("search.placeholder")}
            />
            <Spacing bottom={2} />
            <Box justifySpaceBetween>
              <SidePanelButton
                ref={this.props.refFromHOC}
                onClick={() => this.onAddDataClicked()}
                title={addData}
                btnText={addData}
                styledWidth={"200px"}
              >
                <StyledIcon
                  glyph={Icon.GLYPHS.add}
                  light
                  styledWidth={"20px"}
                />
              </SidePanelButton>
              <SidePanelButton
                ref={this.props.refFromHOCForUpload}
                onClick={() => this.onAddLocalDataClicked()}
                title={t("addData.load")}
                btnText={uploadText}
                styledWidth={"130px"}
              >
                <StyledIcon
                  glyph={Icon.GLYPHS.uploadThin}
                  light
                  styledWidth={"20px"}
                />
              </SidePanelButton>
            </Box>
            <Spacing bottom={1} />
          </div>
          <div
            css={`
              overflow: hidden;
            `}
          >
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

// Used to re-route a second re-HOC wrapping of withTerriaRef
// a better solution is probably to update the HOC to take an array of keys
const RefForUpload = props => {
  const SidePanelWrappedForExplore = withTerriaRef(
    SidePanel,
    EXPLORE_MAP_DATA_NAME
  );
  // it's important we pull outt refFromHOC and not override it again on rest
  // so that the second HOC can correctly provide the EXPLORE_MAP_DATA_NAME prop
  const { refFromHOC, ...rest } = props;
  return (
    <SidePanelWrappedForExplore refFromHOCForUpload={refFromHOC} {...rest} />
  );
};
RefForUpload.propTypes = {
  refFromHOC: PropTypes.object.isRequired
};

module.exports = withTranslation()(
  withTheme(withTerriaRef(RefForUpload, SIDE_PANEL_UPLOAD_BUTTON_NAME))
);
