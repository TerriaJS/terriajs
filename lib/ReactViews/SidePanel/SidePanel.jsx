import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation, Trans } from "react-i18next";
import { withTheme } from "styled-components";
import Icon, { StyledIcon } from "../Icon";
import SearchBoxAndResults from "../Search/SearchBoxAndResults";
import Workbench from "../Workbench/Workbench";
import FullScreenButton from "./FullScreenButton";

// import { useRefForTerria } from "../Hooks/useRefForTerria";

import Box from "../../Styled/Box";
import Spacing from "../../Styled/Spacing";
import Text, { TextSpan } from "../../Styled/Text";
import Button from "../../Styled/Button";

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

const SidePanelButton = props => {
  const { btnText, ...rest } = props;
  return (
    <Button
      primary
      renderIcon={props.children && (() => props.children)}
      textProps={{
        large: true
      }}
      {...rest}
    >
      {btnText ? btnText : ""}
    </Button>
  );
};
SidePanelButton.propTypes = {
  btnText: PropTypes.string,
  children: PropTypes.node
};

export const EXPLORE_MAP_DATA_NAME = "ExploreMapDataButton";
// const ExploreMapDataWithTour = ({
//   addDataBtnText,
//   onAddDataClicked,
//   viewState
// }) => {
//   const buttonRef = useRefForTerria(EXPLORE_MAP_DATA_NAME, viewState);
//   return (
//     <Button
//       ref={buttonRef}
//       type="button"
//       onClick={onAddDataClicked}
//       title={addDataBtnText}
//       primary
//       renderIcon={() => {
//         return (
//           <StyledIcon glyph={Icon.GLYPHS.add} light styledWidth={"20px"} />
//         );
//       }}
//       textProps={{
//         large: true
//       }}
//       styledWidth={"204px"}
//     >
//       {addDataBtnText}
//     </Button>
//   );
// };
// ExploreMapDataWithTour.propTypes = {
//   addDataBtnText: PropTypes.string.isRequired,
//   onAddDataClicked: PropTypes.func.isRequired,
//   viewState: PropTypes.object.isRequired
// };

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
      // event.stopPropagation();
      this.props.viewState.setTopElement("AddData");
      this.props.viewState.openAddData();
    },

    onAddLocalDataClicked() {
      this.props.viewState.openUserData();
    },
    render() {
      const { t, theme } = this.props;
      const addData = t("addData.addDataBtnText");
      const uploadText = t("models.catalog.upload");
      // const addDataRef = useRefForTerria(EXPLORE_MAP_DATA_NAME, this.props.viewState);
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
                // Unsure how to get refs working :(
                // ref={addDataRef}
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

module.exports = withTranslation()(withTheme(SidePanel));
